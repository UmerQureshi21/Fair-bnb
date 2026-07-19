import os
import time

from dotenv import load_dotenv
from twelvelabs import (
    TwelveLabs,
    ImageInputRequest,
    VideoInputRequest,
    MediaSource,
    # For dynamic segmentation uncomment the next two lines:
    # VideoSegmentation_Dynamic,
    # VideoSegmentationDynamicDynamic,
    # For fixed segmentation uncomment the next two lines:
    # VideoSegmentation_Fixed,
    # VideoSegmentationFixedFixed,
)

from usage import track_image_request, track_video_request

load_dotenv()

TWELVELABS_API_KEY = os.getenv("TWELVELABS_API_KEY")

client = TwelveLabs(api_key=TWELVELABS_API_KEY)


def embed_video(file_path: str) -> list[float]:
    """Upload a local video file and return its whole-video visual embedding."""
    asset = client.assets.create(method="direct", file=open(file_path, "rb"))

    while True:
        asset = client.assets.retrieve(asset.id)
        if asset.status == "ready":
            break
        if asset.status == "failed":
            raise RuntimeError(f"Asset processing failed: id={asset.id}")
        time.sleep(5)

    response = client.embed.v_2.create(
        input_type="video",
        model_name="marengo3.0",
        video=VideoInputRequest(
            media_source=MediaSource(asset_id=asset.id),
            embedding_option=["visual"],
            embedding_scope=["asset"],
        ),
    )

    data = response.data[0]
    track_video_request(data.end_sec - data.start_sec)
    return data.embedding


def embed_image_file(file_path: str) -> list[float]:
    """Upload a local image file and return its embedding — for user-uploaded photos,
    as opposed to embed_image() which takes a hotel thumbnail URL directly."""
    asset = client.assets.create(method="direct", file=open(file_path, "rb"))

    while True:
        asset = client.assets.retrieve(asset.id)
        if asset.status == "ready":
            break
        if asset.status == "failed":
            raise RuntimeError(f"Asset processing failed: id={asset.id}")
        time.sleep(2)

    response = client.embed.v_2.create(
        input_type="image",
        model_name="marengo3.0",
        image=ImageInputRequest(
            media_source=MediaSource(asset_id=asset.id),
        ),
    )

    track_image_request()
    return response.data[0].embedding


def embed_image(url: str) -> list[float]:
    """Embed an image straight from a URL — e.g. a Stay22 hotel thumbnail — no asset upload needed."""
    response = client.embed.v_2.create(
        input_type="image",
        model_name="marengo3.0",
        image=ImageInputRequest(
            media_source=MediaSource(url=url),
        ),
    )

    track_image_request()
    return response.data[0].embedding


# if __name__ == "__main__":
#     vector = embed_video("../bedroom.mp4")
#     print(f"Video embedding: {len(vector)} dims, first 10: {vector[:10]}")

#     thumbnail_url = "https://q-xx.bstatic.com/xdata/images/hotel/max500/841773690.jpg?k=4a129bb1e7e7c5fd83f235b1a5c62d67453e9d15c98d3ccb4518b6d03f3aec63&o=&a=1607597"
#     image_vector = embed_image(thumbnail_url)
#     print(f"Image embedding: {len(image_vector)} dims, first 10: {image_vector[:10]}")
