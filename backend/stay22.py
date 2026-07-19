import os

import httpx
from dotenv import load_dotenv

load_dotenv()

STAY22_API_KEY = os.getenv("STAY22_API_KEY")
STAY22_AID = os.getenv("STAY22_AID")

# All 30 documented query params for GET /v2/accommodations. Only these are
# forwarded upstream — everything else in the caller's params dict is ignored.
FORWARDABLE_PARAMS = [
    "address", "lat", "lng", "radius", "nelat", "nelng", "swlat", "swlng", "hotelids",
    "provider", "type", "minstarrating", "minguestrating", "minratingcount",
    "checkin", "checkout", "adults", "children", "rooms",
    "min", "max", "currency",
    "pageSize", "page", "lang",
    "aid", "campaign", "cluster", "precision", "cell",
]

# Passing our aid means every result.url / suppliers[x].link the API returns
# already carries our affiliate tracking - no need to rebuild Allez links by
# hand on the client.
DEFAULT_UPSTREAM_PARAMS = {"aid": STAY22_AID} if STAY22_AID else {}


def get_config() -> dict:
    """The frontend needs the affiliate ID to build Maps/Allez links, but never the API key."""
    return {"aid": STAY22_AID or None}


async def search_accommodations(params: dict) -> tuple[int, dict]:
    """Proxy to the Accommodations Search API. Keeps STAY22_API_KEY server-side only.

    `params` is any mapping of candidate query params (e.g. a request's query
    string, or a dict built programmatically) — only the documented Stay22
    params are forwarded, with `aid` defaulted in. Returns (status_code, body).
    """
    if not STAY22_API_KEY:
        return 500, {"error": "STAY22_API_KEY is not set in .env"}

    upstream_params = dict(DEFAULT_UPSTREAM_PARAMS)
    for key in FORWARDABLE_PARAMS:
        value = params.get(key)
        if value is not None:
            upstream_params[key] = value

    try:
        async with httpx.AsyncClient() as client:
            upstream_res = await client.get(
                "https://api.stay22.com/v2/accommodations",
                params=upstream_params,
                headers={"X-API-KEY": STAY22_API_KEY},
            )
        return upstream_res.status_code, upstream_res.json()
    except httpx.HTTPError as err:
        return 502, {"error": "Failed to reach Stay22 API", "details": str(err)}


def cheapest_price(hotel: dict) -> float | None:
    """Lowest per-night price across a hotel's suppliers, or None if no supplier has one."""
    prices = [
        (supplier.get("price") or {}).get("total")
        for supplier in hotel.get("suppliers", {}).values()
    ]
    prices = [p for p in prices if p is not None]
    return min(prices) if prices else None
