import os
import uuid

import boto3
import httpx
from botocore.exceptions import BotoCoreError, ClientError
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET = os.getenv("AWS_S3_BUCKET", "fairbnb-valuation-media")

_s3 = boto3.client("s3", region_name=AWS_REGION)


def new_media_id() -> str:
    """Unique folder id for one /api/valuate run's archived media. Deliberately
    unrelated to any `valuations` DB row id - this runs before save, and a run
    may never be saved."""
    return uuid.uuid4().hex


def _public_url(key: str) -> str:
    return f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"


def _put(key: str, data: bytes, content_type: str) -> str:
    # No ACL= kwarg. The bucket uses "Bucket owner enforced" object ownership
    # (S3's modern default), which disables per-object ACLs outright - public
    # read comes purely from the bucket policy, not from put_object.
    _s3.put_object(Bucket=S3_BUCKET, Key=key, Body=data, ContentType=content_type)
    return _public_url(key)


def upload_user_media(media_id: str, content: bytes, content_type: str, ext: str) -> str:
    key = f"valuations/{media_id}/user{ext}"
    return _put(key, content, content_type or "application/octet-stream")


async def upload_hotel_thumbnail(media_id: str, index: int, thumbnail_url: str) -> str:
    """Re-fetches + re-uploads a Stay22 thumbnail. Returns the new durable URL,
    or the original thumbnail_url unchanged on any failure - one broken image
    must never fail the whole valuation."""
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            res = await client.get(thumbnail_url)
            res.raise_for_status()
        content_type = res.headers.get("content-type", "image/jpeg").split(";")[0].strip()
        key = f"valuations/{media_id}/hotel_{index}.jpg"
        return _put(key, res.content, content_type)
    except (httpx.HTTPError, BotoCoreError, ClientError):
        return thumbnail_url
