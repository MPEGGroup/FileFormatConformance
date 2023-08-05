import json
import requests
from glob import glob
from loguru import logger
from functools import cache

MP4RA_BOXES_URL = "https://mp4ra.org/boxes.json"


@cache
def get_ignored_files():
    ignored = set()
    with open("../data/file_features/.cfignore", "r", encoding="utf-8") as fp:
        for line in fp:
            ignored.update(
                glob(f"../data/file_features/**/{line.strip()}", recursive=True)
            )
    return ignored


@cache
def get_mp4ra_boxes():
    response = requests.get(MP4RA_BOXES_URL)
    if response.status_code != 200:
        logger.critical(f"Failed to get MP4RA boxes: {response.status_code}")
        exit(1)

    allowed_mp4ra_specs = set()
    specs = glob("../data/standard_features/**/spec_info.json", recursive=True)
    for spec in specs:
        with open(spec, "r", encoding="utf-8") as fp:
            spec_info = json.load(fp)
            allowed_mp4ra_specs.update(spec_info["mp4ra_reference"])

    boxes = set()
    for box in response.json():
        if "specification" not in box:
            continue
        if box["specification"] in allowed_mp4ra_specs:
            boxes.add(box["code"].replace("$20", " "))

    return boxes
