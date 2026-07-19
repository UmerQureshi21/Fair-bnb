import json
import os
import sqlite3
import tempfile
from datetime import date, timedelta

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

import auth
import db
import storage
from stay22 import cheapest_price, get_config, search_accommodations
from embed import embed_image, embed_image_file, embed_video
from similarity import cosine_similarity
from vectors import compute_vector_plot

load_dotenv()

PORT = int(os.getenv("PORT", "8000"))

# Below this average similarity across the top 3 matches, the closest hotels
# we found aren't actually visually similar - the fair_price would be
# averaging prices of unrelated properties, not comparable ones.
SIMILARITY_THRESHOLD = 0.45

MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20MB

REFRESH_TOKEN_TTL_DAYS = int(os.getenv("REFRESH_TOKEN_TTL_DAYS", 7))
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")

app = FastAPI()

# The frontend (Next.js on :3000) and this API run on different origins in dev.
# allow_credentials is required so the browser sends/accepts the HttpOnly
# refresh-token cookie on cross-origin requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    db.init_db()


def set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="refresh_token",
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        path="/api/auth",
        max_age=REFRESH_TOKEN_TTL_DAYS * 86400,
    )


class SignupRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class SaveValuationRequest(BaseModel):
    mode: str
    result: dict


def serialize_user(user: dict) -> dict:
    return {"id": user["id"], "email": user["email"]}


@app.post("/api/auth/signup", status_code=201)
async def signup(body: SignupRequest, response: Response):
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    password_hash = auth.hash_password(body.password)
    try:
        user = db.create_user(body.email, password_hash)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Email already registered")

    access_token = auth.create_access_token(user["id"], user["email"])
    refresh_token = auth.create_refresh_token(user["id"], user["token_version"])
    set_refresh_cookie(response, refresh_token)
    return {"access_token": access_token, "token_type": "bearer", "user": serialize_user(user)}


@app.post("/api/auth/login")
async def login(body: LoginRequest, response: Response):
    user = db.get_user_by_email(body.email)
    if not user or not auth.verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = auth.create_access_token(user["id"], user["email"])
    refresh_token = auth.create_refresh_token(user["id"], user["token_version"])
    set_refresh_cookie(response, refresh_token)
    return {"access_token": access_token, "token_type": "bearer", "user": serialize_user(user)}


@app.post("/api/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    try:
        payload = auth.decode_token(token, expected_type="refresh")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = db.get_user_by_id(int(payload["sub"]))
    if not user or user["token_version"] != payload["ver"]:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    access_token = auth.create_access_token(user["id"], user["email"])
    new_refresh_token = auth.create_refresh_token(user["id"], user["token_version"])
    set_refresh_cookie(response, new_refresh_token)
    return {"access_token": access_token, "token_type": "bearer", "user": serialize_user(user)}


@app.post("/api/auth/logout")
async def logout(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if token:
        try:
            payload = auth.decode_token(token, expected_type="refresh")
            db.bump_token_version(int(payload["sub"]))
        except ValueError:
            pass

    response.delete_cookie(key="refresh_token", path="/api/auth")
    return {"ok": True}


@app.get("/api/auth/me")
async def me(user: dict = Depends(auth.get_current_user)):
    return serialize_user(user)


@app.post("/api/valuations", status_code=201)
async def save_valuation(body: SaveValuationRequest, user: dict = Depends(auth.get_current_user)):
    result = body.result
    saved = db.create_valuation(
        user_id=user["id"],
        mode=body.mode,
        fair_price=result.get("fair_price"),
        listed_price=result.get("listed_price"),
        result_json=json.dumps(result),
    )
    return {"id": saved["id"], "created_at": saved["created_at"]}


@app.get("/api/valuations")
async def get_valuations(user: dict = Depends(auth.get_current_user)):
    rows = db.list_valuations(user["id"])
    return {
        "valuations": [
            {
                "id": row["id"],
                "mode": row["mode"],
                "fair_price": row["fair_price"],
                "listed_price": row["listed_price"],
                "result": json.loads(row["result_json"]),
                "created_at": row["created_at"],
            }
            for row in rows
        ]
    }


# Fixed location used to backfill the games with real Stay22 hotels for a
# brand-new user who has no saved valuations yet - without this, they'd have
# nothing to play with until they actually ran and saved a valuation first.
DEMO_HOTEL_ADDRESS = "New York, NY"


@app.get("/api/demo-hotels")
async def demo_hotels(user: dict = Depends(auth.get_current_user)):
    # cheapest_price() reads live-rate supplier pricing, which Stay22 only
    # returns when checkin/checkout are provided - same fixed dates /api/valuate uses.
    checkin = date.today() + timedelta(days=7)
    checkout = checkin + timedelta(days=1)
    status_code, stay22_res = await search_accommodations(
        {
            "address": DEMO_HOTEL_ADDRESS,
            "checkin": checkin.isoformat(),
            "checkout": checkout.isoformat(),
            "pageSize": 20,
        }
    )
    if status_code != 200:
        return JSONResponse(status_code=status_code, content=stay22_res)

    hotels = stay22_res.get("results", [])
    results = [
        {
            "thumbnail": hotel.get("media", {}).get("thumbnail"),
            "price": cheapest_price(hotel),
            "url": hotel.get("url"),
        }
        for hotel in hotels
    ]
    results = [r for r in results if r["thumbnail"] and r["price"] is not None]
    return {"results": results}


@app.get("/api/config")
async def config():
    return get_config()


@app.get("/api/search")
async def search(request: Request):
    status_code, body = await search_accommodations(dict(request.query_params))
    return JSONResponse(status_code=status_code, content=body)


@app.post("/api/valuate")
async def valuate(
    file: UploadFile = File(...),
    address: str | None = Form(None),
    lat: str | None = Form(None),
    lng: str | None = Form(None),
    listed_price: float | None = Form(None),
):
    if not address and not (lat and lng):
        raise HTTPException(status_code=400, detail="address or lat/lng is required")

    content_type = file.content_type or ""
    if not (content_type.startswith("video/") or content_type.startswith("image/")):
        raise HTTPException(status_code=400, detail="Invalid file type")

    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large - 20MB max")

    suffix = os.path.splitext(file.filename or "")[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    async def stream():
        def emit(**data) -> bytes:
            return (json.dumps(data) + "\n").encode()

        try:
            yield emit(step="embed_input", status="start")
            if content_type.startswith("video/"): # user is a host, pricing their room
                user_embedding = embed_video(tmp_path)
            else: # user is looking, verifying a listing's price
                user_embedding = embed_image_file(tmp_path)
            yield emit(step="embed_input", status="done")

            # Dates are fixed for now - not yet exposed in the UI.
            checkin = date.today() + timedelta(days=7)
            checkout = checkin + timedelta(days=1)

            MIN_MATCHES = 3
            page_size = 20
            candidates = []

            # Stay22's live-rate pricing occasionally comes back empty for a
            # given result-set size (upstream flakiness, not something our
            # query controls) - retry once with a bigger pageSize if we don't
            # get enough priced hotels. Checked before spending any embed
            # calls on this batch.
            yield emit(step="fetch_hotels", status="start")
            for _attempt in range(2):
                stay22_req = {
                    "checkin": checkin.isoformat(),
                    "checkout": checkout.isoformat(),
                    "pageSize": page_size,
                }
                if address:
                    stay22_req["address"] = address
                else:
                    stay22_req["lat"] = lat
                    stay22_req["lng"] = lng

                status_code, stay22_res = await search_accommodations(stay22_req)
                hotels = stay22_res.get("results", [])

                candidates = [
                    (hotel.get("media", {}).get("thumbnail"), cheapest_price(hotel), hotel.get("url"))
                    for hotel in hotels
                ]
                candidates = [(t, p, u) for t, p, u in candidates if t and p is not None]

                if len(candidates) >= MIN_MATCHES:
                    break
                page_size += 20
            yield emit(step="fetch_hotels", status="done", count=len(candidates))

            yield emit(step="embed_hotels", status="start", total=len(candidates))
            hotel_vectors = []
            for i, (thumbnail, price, url) in enumerate(candidates, start=1):
                try:
                    embedding = embed_image(thumbnail)
                except Exception:
                    # A single unreachable/broken thumbnail shouldn't fail the whole request.
                    continue
                hotel_vectors.append(
                    {"embedding": embedding, "price": price, "thumbnail": thumbnail, "url": url}
                )
                yield emit(step="embed_hotels", status="progress", current=i, total=len(candidates))
            yield emit(step="embed_hotels", status="done")

            if not hotel_vectors:
                yield emit(step="error", message="No comparable hotels with pricing data found")
                return

            yield emit(step="compare", status="start")
            for hotel_vector in hotel_vectors:
                hotel_vector["similarity"] = cosine_similarity(user_embedding, hotel_vector["embedding"])

            ranked = sorted(hotel_vectors, key=lambda h: h["similarity"], reverse=True)
            top_matches = ranked[:3]
            worst_matches = ranked[-3:][::-1]  # worst first
            fair_price = sum(h["price"] for h in top_matches) / len(top_matches)
            avg_similarity = sum(h["similarity"] for h in top_matches) / len(top_matches)
            low_confidence = avg_similarity < SIMILARITY_THRESHOLD
            yield emit(step="compare", status="done")

            try:
                vector_plot = compute_vector_plot(user_embedding, [h["embedding"] for h in top_matches])
            except Exception:
                vector_plot = None

            media_id = storage.new_media_id()
            try:
                user_media_url = storage.upload_user_media(media_id, content, content_type, suffix)
                user_media_type = "video" if content_type.startswith("video/") else "image"
            except Exception:
                user_media_url = user_media_type = None

            for i, h in enumerate(top_matches):
                h["thumbnail"] = await storage.upload_hotel_thumbnail(media_id, i, h["thumbnail"])

            def serialize(h):
                return {
                    "price": h["price"],
                    "similarity": h["similarity"],
                    "thumbnail": h["thumbnail"],
                    "url": h["url"],
                }

            result_data = {
                "fair_price": fair_price,
                "low_confidence": low_confidence,
                "top_matches": [serialize(h) for h in top_matches],
                "worst_matches": [serialize(h) for h in worst_matches],
            }

            if vector_plot is not None:
                result_data["vector_plot"] = vector_plot
            if user_media_url is not None:
                result_data["user_media_url"] = user_media_url
                result_data["user_media_type"] = user_media_type

            # "Looking" mode only - how the listing's asking price compares to
            # what similar hotels nearby actually charge.
            if listed_price is not None:
                overcharge_amount = listed_price - fair_price
                result_data["listed_price"] = listed_price
                result_data["overcharge_amount"] = overcharge_amount
                result_data["overcharge_percent"] = (overcharge_amount / fair_price) * 100
                result_data["is_overpriced"] = overcharge_amount > 0

            yield emit(step="result", data=result_data)
        except Exception as e:
            # Anything unexpected (TwelveLabs failure, Stay22 outage, etc.)
            # still needs a clean event - otherwise the stream just dies and
            # the frontend has no way to know what went wrong. TwelveLabs
            # errors carry a parsed {code, message} body; unwrap it instead
            # of dumping the raw exception (headers, trace IDs, etc).
            body = getattr(e, "body", None)
            message = body.get("message") if isinstance(body, dict) else str(e)
            yield emit(step="error", message=message or str(e))
        finally:
            os.remove(tmp_path)

    return StreamingResponse(stream(), media_type="application/x-ndjson")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)
