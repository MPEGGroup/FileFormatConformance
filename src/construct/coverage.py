import json
from glob import glob
from loguru import logger

from common import *


def main():
    logger.add("/tmp/construct.log", level="ERROR")

    with open("output/dictionary.json", "r", encoding="utf-8") as f:
        dictionary = json.load(f)

    with open("output/files.json", "r", encoding="utf-8") as f:
        files = json.load(f)

    # Strip variants from path_file_map
    for path, variants in files["path_file_map"].items():
        files["path_file_map"][path] = list(
            set([f for variant in variants.values() for f in variant])
        )

    DESCRIPTION = {
        "not_found": {
            "count": "Number of paths of boxes that were discovered in submitted files but not in our database of boxes",
            "percentage": "Percentage of paths of boxes that were discovered in submitted files but not in our database of paths of boxes",
            "boxes": "List of boxes that were discovered in submitted files but not in our database of boxes (created from the paths)",
            "missing_extensions": "List of paths of boxes that were discovered in submitted files but not in our database of boxes but were found in the extension files",
            "paths": "List of paths of boxes that were discovered in submitted files but not in our database of boxes (unique)",
        },
        "lists": {
            "boxes": {
                "covered": "List of paths of boxes that were discovered in published files and are in our database of boxes",
                "not_covered": "List of paths of boxes that weren't discovered in published files and are in our database of boxes",
                "under_consideration": "List of paths of boxes that were discovered in under consideration files and are in our database of boxes",
            },
            "features": {
                "covered": "List of features that were discovered in published files and are in our database of features",
                "not_covered": "List of features that weren't discovered in published files and are in our database of features",
                "under_consideration": "List of features that were discovered in under consideration files and are in our database of features",
            },
        },
        "path_file_map": {
            "count": "Number of paths of boxes that were discovered in our database of boxes",
            "non_empty": "Number of paths of boxes that were discovered in our database of boxes and were found in submitted files",
            "overall_coverage": "Percentage of paths of boxes that were found in submitted files",
            "published": {
                "count": "Number of paths of boxes that were found in submitted files and have published files",
                "coverage": "Percentage of paths of boxes that were found in submitted files and have published files",
            },
            "under_consideration": {
                "count": "Number of paths of boxes that were found in submitted files and all files are under consideration",
                "coverage": "Percentage of paths of boxes that were found in submitted files and all files are under consideration",
            },
        },
        "feature_file_map": {
            "count": "Total number of features",
            "published_features": "Number of features that has published files",
            "under_consideration_features": "Number of features that exclusively has under consideration files",
        },
        "files": {
            "count": "Number of files that were submitted",
            "published_count": "Number of files that were submitted and are published",
            "under_consideration_count": "Number of files that were submitted and are under consideration",
        },
        "boxes": {
            "count": "Number of boxes that that we have in our database",
        },
        "spec_info": {
            "[]": "Spec information for every spec that was used to generate the coverage report",
        },
    }

    # Detailed information about not found boxes
    # Get all gpac extensions and look if we haven't added any extensions to our database
    extensions = glob("../data/file_features/**/*gpac.ext.json", recursive=True)
    ignored = get_ignored_files()
    extensions = list(set(extensions) - ignored)

    missing_extensions = set()
    for extension in extensions:
        with open(extension, "r", encoding="utf-8") as f:
            ext_data = json.load(f)
        missing_extensions.update(
            [f"{e['location']}.{e['box']['@Type']}" for e in ext_data["extensions"]]
        )

    # Remove all known and unknown paths from missing extensions (to reduce redundancy)
    missing_extensions.difference_update(set(files["not_found"]))
    missing_extensions.difference_update(set(files["path_file_map"].keys()))

    NOT_FOUND = {
        "count": len(files["not_found"]),
        "percentage": len(files["not_found"]) / len(files["path_file_map"]),
        "boxes": list(set(p.split(".")[-1] for p in files["not_found"])),
        "missing_extensions": list(missing_extensions),
        "paths": list(files["not_found"].keys()),
    }

    # FIXME: All the logs here should be errors, except for info
    for upath, in_files in files["not_found"].items():
        # Easy to access variables
        container_path = upath.split(".")[:-1]
        box_fourcc = upath.split(".")[-1]
        known_box = box_fourcc in dictionary["fourccs"]

        if not known_box:
            # Check if this was in under consideration files
            if any(["under_consideration" in f for f in in_files]):
                extra = ""
                if box_fourcc in get_mp4ra_boxes():
                    extra = " It exists in MP4RA though."

                logger.error(
                    f"Box {box_fourcc} was found in under consideration files but it is not in our database."
                    + extra
                )
                continue

            if box_fourcc not in get_mp4ra_boxes():
                logger.info(f"Box {box_fourcc} is not in standard features or MP4RA")
            else:
                logger.warning(
                    f"Box {box_fourcc} was found in submitted files and it exists in MP4RA but not in our database"
                )
            continue

        # Try to find a known subpath
        best_match = ""
        for kpath in files["path_file_map"].keys():
            if upath.startswith(kpath):
                if len(kpath) > len(best_match):
                    best_match = kpath

        # If there is no match but the box is known
        if best_match == "":
            logger.warning(
                f"Box {box_fourcc} has an entry but container path {'.'.join(container_path)} did not yield any matches"
            )

        # If there is a match but only difference is the box fourcc
        elif best_match == ".".join(container_path):
            logger.warning(
                f"Box {container_path[-1]} is not listed as container for box {box_fourcc}"
            )

        # Otherwise, we can give a more detailed error message
        else:
            # Get the difference between the container_path annd best_match
            diff = container_path[len(best_match.split(".")) :]
            broken_path = [best_match.split(".")[-1]] + diff
            if len(broken_path) == 1:
                logger.warning(
                    f"Box {broken_path[-1]} is not listed as container for box {box_fourcc}"
                )
            else:
                logger.warning(
                    f"Path ~{'.'.join(broken_path)} is not listed as container for box {box_fourcc}"
                )

    for path in NOT_FOUND["missing_extensions"]:
        logger.warning(
            f"Path {path} was found in the extension files but not in our database"
        )

    # Detailed information about path to file map
    PATH_FILE_MAP = {
        "count": len(files["path_file_map"]),
        "non_empty": len([p for p in files["path_file_map"].values() if len(p) > 0]),
        "overall_coverage": len(
            [p for p in files["path_file_map"].values() if len(p) > 0]
        )
        / len(files["path_file_map"]),
        "published": {
            "count": len(
                [
                    p
                    for p in files["path_file_map"].values()
                    if len(p) > 0 and any(["published" in f for f in p])
                ]
            ),
            "coverage": len(
                [
                    p
                    for p in files["path_file_map"].values()
                    if len(p) > 0 and any(["published" in f for f in p])
                ]
            )
            / len(files["path_file_map"]),
        },
        "under_consideration": {
            "count": len(
                [
                    p
                    for p in files["path_file_map"].values()
                    if len(p) > 0 and all(["under_consideration" in f for f in p])
                ]
            ),
            "coverage": len(
                [
                    p
                    for p in files["path_file_map"].values()
                    if len(p) > 0 and all(["under_consideration" in f for f in p])
                ]
            )
            / len(files["path_file_map"]),
        },
    }

    # Detailed information about feature to file map
    FEATURE_FILE_MAP = {
        "count": len(files["feature_file_map"]),
        "published_features": len(
            [
                f
                for f in files["feature_file_map"].values()
                if len(f["files"]) > 0 and any(["published" in p for p in f["files"]])
            ]
        ),
        "under_consideration_features": len(
            [
                f
                for f in files["feature_file_map"].values()
                if len(f["files"]) > 0
                and all(["under_consideration" in p for p in f["files"]])
            ]
        ),
    }

    LISTS = {
        "boxes": {
            "covered": [
                p
                for p, v in files["path_file_map"].items()
                if len(v) > 0 and any(["published" in f for f in v])
            ],
            "not_covered": [
                p for p, v in files["path_file_map"].items() if len(v) == 0
            ],
            "under_consideration": [
                p
                for p, v in files["path_file_map"].items()
                if len(v) > 0 and all(["under_consideration" in f for f in v])
            ],
        },
        "features": {
            "covered": [
                f
                for f, v in files["feature_file_map"].items()
                if len(v["files"]) > 0 and any(["published" in p for p in v["files"]])
            ],
            "not_covered": [
                f for f, v in files["feature_file_map"].items() if len(v["files"]) == 0
            ],
            "under_consideration": [
                f
                for f, v in files["feature_file_map"].items()
                if len(v["files"]) > 0
                and all(["under_consideration" in p for p in v["files"]])
            ],
        },
    }

    # Detailed information about files
    FILES = {
        "count": len(files["file_metadata"]),
        "published_count": len(
            [f for f in files["file_metadata"].values() if f["published"]]
        ),
        "under_consideration_count": len(
            [f for f in files["file_metadata"].values() if not f["published"]]
        ),
    }

    spec_infos = glob("../data/standard_features/**/spec_info.json")
    SPEC_INFO = []
    for spec_info in spec_infos:
        with open(spec_info, "r", encoding="utf-8") as f:
            spec = json.load(f)
            spec["link"] = get_document_status_link(spec["ISO"])
            SPEC_INFO.append(spec)

    # Detailed information about boxes
    BOXES = {
        "count": len(files["boxes"]),
    }

    # Save
    with open("output/coverage.json", "w", encoding="utf-8") as f:
        json.dump(
            {
                "description": DESCRIPTION,
                "not_found": NOT_FOUND,
                "lists": LISTS,
                "path_file_map": PATH_FILE_MAP,
                "feature_file_map": FEATURE_FILE_MAP,
                "files": FILES,
                "boxes": BOXES,
                "spec_info": SPEC_INFO,
            },
            f,
            indent=4,
        )

    check_logs_for_ci()


if __name__ == "__main__":
    main()
