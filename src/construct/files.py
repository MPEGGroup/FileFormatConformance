import os
import json
from glob import glob

from common.unique_logger import logger
from common import get_ignored_files, get_mp4ra_boxes


## Helper functions
def encode_metadata(metadata):
    """
    Metadata for a variant is extra attributes that are derived from files and not cross-checked with the spec.
    Currently, we only have flavor information for brands
    """
    encoded = 0x0
    if metadata is None:
        return encoded

    if "BrandFlavor" in metadata:
        if metadata["BrandFlavor"] == "Major":
            encoded |= 0x1
        else:
            encoded |= 0x2
    return encoded


def add_variant(adder, value, path_prefix, metadata=None):
    ver = "@Version" in value and value["@Version"] or "*"
    flags = "@Flags" in value and value["@Flags"] or "*"
    fourcc = "@Type" in value and value["@Type"] or None
    adder(
        ".".join(path_prefix + [fourcc]),
        (
            ver,
            flags,
            str(encode_metadata(metadata)),
        ),
    )


def crawl_hierarchy(root_hierarchy, can_be_found_anywhere):
    boxes = {}
    paths = set()

    root_node = list(root_hierarchy.keys())[0]

    def crawl(hierarchy, path=[]):
        nonlocal boxes, paths, root_node
        for parent, descendants in hierarchy.items():
            if parent in can_be_found_anywhere:
                if parent not in boxes:
                    boxes[parent] = [[root_node, "*"]]
                    paths.add(".".join([root_node, "*", parent]))
                continue

            if parent not in boxes:
                boxes[parent] = []

            # Add the current path to be the container of current node
            if len(path) != 0:
                boxes[parent].append(path)
                paths.add(".".join(path + [parent]))

            for child, descendant in descendants.items():
                crawl({child: descendant}, path + [parent])

    crawl(root_hierarchy)
    return boxes, paths


def crawl_hierarchy_gpac(root_hierarchy, can_be_found_anywhere, mp4ra_check=True):
    paths = {}

    def add(path, variant):
        nonlocal paths
        if path not in paths:
            paths[path] = set()
        paths[path].add(variant)

    def crawl(hierarchy, path=[]):
        # If an object has @Type then follow it. record the path
        # We also skip UnknownBox(s) because extension already has this information
        for key, value in hierarchy.items():
            if key == "UnknownBox":
                continue

            if isinstance(value, dict):
                if "@Type" not in value:
                    continue
                fourcc = value["@Type"]

                if any([fourcc in box for box in can_be_found_anywhere]):
                    add_variant(add, value, ["file", "*"])
                    continue

                if mp4ra_check and fourcc not in get_mp4ra_boxes():
                    continue

                # Special case for sample group entries
                if "@grouping_type" in value:
                    sg_entry = {"@Type": value["@grouping_type"]}
                    add_variant(add, sg_entry, path + [fourcc])

                # Special case for handlers
                if "@hdlrType" in value:
                    hdlr_entry = {"@Type": value["@hdlrType"]}
                    add_variant(add, hdlr_entry, path + [fourcc])

                # Special case for brands
                if "@MajorBrand" in value:
                    brand_entry = {"@Type": value["@MajorBrand"]}
                    add_variant(
                        add,
                        brand_entry,
                        path + [fourcc],
                        {"BrandFlavor": "Major"},
                    )

                    if "BrandEntry" in value:
                        if isinstance(value["BrandEntry"], list):
                            for brand in value["BrandEntry"]:
                                brand_entry = {"@Type": brand["@AlternateBrand"]}
                                add_variant(
                                    add,
                                    brand_entry,
                                    path + [fourcc],
                                    {"BrandFlavor": "Compatible"},
                                )
                        elif isinstance(value["BrandEntry"], dict):
                            for brand in value["BrandEntry"].values():
                                brand_entry = {"@Type": brand}
                                add_variant(
                                    add,
                                    brand_entry,
                                    path + [fourcc],
                                    {"BrandFlavor": "Compatible"},
                                )

                add_variant(add, value, path)
                crawl(value, path + [fourcc])
            elif isinstance(value, list):
                for item in value:
                    crawl({key: item}, path)

    # Special case for gpac files. Root is not a box
    crawl(root_hierarchy["IsoMediaFile"], path=["file"])
    return paths


def crawl_hierarchy_gpac_ext(extension, mp4ra_check=True):
    paths = {}

    def add(path, variant):
        nonlocal paths
        if path not in paths:
            paths[path] = set()
        paths[path].add(variant)

    def crawl(root, path):
        for key, value in root.items():
            if isinstance(value, dict):
                if "@Type" not in value:
                    continue
                fourcc = value["@Type"]

                if mp4ra_check and fourcc not in get_mp4ra_boxes():
                    continue

                add_variant(add, value, path)
                crawl(value, path + [fourcc])
            elif isinstance(value, list):
                for item in value:
                    crawl({key: item}, path)

    for ext in extension["extensions"]:
        root = ext["box"]
        path = ext["location"].split(".")

        if mp4ra_check and path[-1] not in get_mp4ra_boxes():
            continue

        add_variant(add, root, path)
        crawl({"root": root}, path)

    return paths


def main():
    # Check which boxes can be found anywhere (container.fourcc=* && container.type=*)
    can_be_found_anywhere = set()
    with open("output/boxes.json", "r", encoding="utf-8") as f:
        boxes = json.load(f)

    for box in boxes:
        for container in box["containers"]:
            if container["fourcc"] == "*" and container["type"] == "*":
                can_be_found_anywhere.add(f"{box['fourcc']}:{box['type']}")

    # Start by crawling through hierarchy to find boxes and their possible locations
    with open("output/hierarchy.json", "r", encoding="utf-8") as f:
        hierarchy = json.load(f)

    boxes, paths = crawl_hierarchy(hierarchy, can_be_found_anywhere)

    # Convert paths to a dict and search through every *_gpac.json file and add the file to path if there is a match
    path_file_map = {
        ".".join(k.split(":")[0] for k in path.split(".")): {} for path in paths
    }

    files = set(glob("../data/file_features/**/*_gpac.json", recursive=True))

    # Ignored files
    ignored = get_ignored_files()
    files = list(files - ignored)

    if len(ignored) > 0:
        logger.warning(f"Found {len(ignored)} ignored files.")

    file_metadata = {}
    not_found = {}

    for file in files:
        # metadata is the one without the _gpac.json
        metadata_file = file.replace("_gpac.json", ".json")

        # Add metadata to file_metadata
        with open(metadata_file, "r", encoding="utf-8") as f:
            metadata = json.load(f)

        key_name = os.path.abspath(
            os.path.join(os.path.dirname(file), metadata["rel_filepath"])
        )
        key_name = key_name.split("/")
        base_index = key_name.index("file_features")
        key_name = "/".join(key_name[base_index + 1 :])

        # Add absolute path to metadata
        metadata["abs_filepath"] = key_name

        # Add metadata to file_metadata
        file_metadata[key_name] = metadata

        # Search through gpac output
        with open(file, "r", encoding="utf-8") as f:
            gpac = json.load(f)

        # Do not perform MP4RA check for under consideration files
        mp4ra_check = "under_consideration" not in key_name

        paths_contained = crawl_hierarchy_gpac(gpac, can_be_found_anywhere, mp4ra_check)

        # Add the extension to paths_contained
        gpac_ext = file.replace("_gpac.json", "_gpac.ext.json")
        if os.path.exists(gpac_ext):
            with open(gpac_ext, "r", encoding="utf-8") as f:
                extension = json.load(f)

            paths_contained.update(crawl_hierarchy_gpac_ext(extension, mp4ra_check))

        for path, variants in paths_contained.items():
            if path not in path_file_map:
                if path not in not_found:
                    not_found[path] = set()
                not_found[path].add(key_name)
                continue

            for variant in variants:
                serizalized_variant = ":".join(variant)
                if serizalized_variant not in path_file_map[path]:
                    path_file_map[path][serizalized_variant] = []
                path_file_map[path][serizalized_variant].append(key_name)

    # Mapping of user_defined.json to files
    feature_file_map = {}

    # Load all user_defined.json's we have
    files = glob("../data/standard_features/**/user_defined.json", recursive=True)

    for file in files:
        with open(file, "r", encoding="utf-8") as f:
            user_defined = json.load(f)
            spec = file.split("/")[-2]

            for key, value in user_defined.items():
                if key not in feature_file_map:
                    feature_file_map[key] = {
                        "key": key,
                        "description": value,
                        "spec": spec,
                        "files": [],
                    }
                else:
                    logger.error(f"Duplicate key ({key}) found in user_defined.json")

    # Now go through files and add them to feature_file_map
    for path, metadata in file_metadata.items():
        for feature in metadata["features"]:
            if feature in feature_file_map:
                feature_file_map[feature]["files"].append(path)
            else:
                logger.error(
                    f'Feature "{feature}" not found in standard features. File: {path}'
                )

    # Sort files
    for key, value in feature_file_map.items():
        value["files"] = sorted(value["files"])

    for key, variants in path_file_map.items():
        path_file_map[key] = {
            variant: sorted(files) for variant, files in variants.items()
        }

    for key, value in boxes.items():
        boxes[key] = sorted(value)

    for key, value in feature_file_map.items():
        value["files"] = sorted(value["files"])

    # Save
    with open("output/files.json", "w", encoding="utf-8") as f:
        json.dump(
            {
                "not_found": {path: sorted(files) for path, files in not_found.items()},
                "path_file_map": path_file_map,
                "feature_file_map": feature_file_map,
                "file_metadata": file_metadata,
                "boxes": boxes,
            },
            f,
            indent=4,
        )


if __name__ == "__main__":
    main()
