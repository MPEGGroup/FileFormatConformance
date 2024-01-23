import os
import json
import requests
from glob import glob
from functools import cache

from .unique_logger import logger

MP4RA_BOXES_URL = "https://mp4ra.org/api/boxes"
DOCUMENT_STATUS_URL = (
    "https://github.com/MPEGGroup/FileFormat/blob/master/DocumentStatus.md"
)


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
    response = requests.get(MP4RA_BOXES_URL, timeout=15)
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


@cache
def get_document_status_toc():
    response = requests.get(DOCUMENT_STATUS_URL, timeout=15)
    if response.status_code != 200:
        logger.critical(f"Failed to get document status: {response.status_code}")
        exit(1)

    payload = response.json()["payload"]
    toc = payload["blob"]["headerInfo"]["toc"]
    return {
        heading["text"]: DOCUMENT_STATUS_URL + f"#{heading['anchor']}"
        for heading in toc
    }


def get_document_status_link(iso):
    toc = get_document_status_toc()
    match = [key for key in toc if iso in key]
    assert len(match) == 1, f"Failed to find document status section for {iso}"
    return toc[match[0]]


def check_logs_for_ci():
    if "CI" not in os.environ:
        return

    with open("/tmp/construct.log", "r", encoding="utf-8") as f:
        line_count = len(f.readlines())

    if line_count > 0:
        os.remove("/tmp/construct.log")
        exit(1)
