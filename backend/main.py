import json
import os
import tempfile
from datetime import date, timedelta

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from stay22 import cheapest_price, get_config, search_accommodations
from embed import embed_image, embed_image_file, embed_video
from similarity import cosine_similarity

load_dotenv()

PORT = int(os.getenv("PORT", "8000"))

# Below this average similarity across the top 3 matches, the closest hotels
# we found aren't actually visually similar - the fair_price would be
# averaging prices of unrelated properties, not comparable ones.
SIMILARITY_THRESHOLD = 0.45

app = FastAPI()

# The frontend (Next.js on :3000) and this API run on different origins in dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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

    suffix = os.path.splitext(file.filename or "")[1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
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
