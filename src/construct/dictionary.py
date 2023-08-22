import json


def main():
    with open("output/boxes.json", "r", encoding="utf-8") as f:
        boxes = json.load(f)

    with open("output/files.json", "r", encoding="utf-8") as f:
        files = json.load(f)

    fourccs = set()
    types = set()
    specs = set()
    registered_types = set()
    for box in boxes:
        fourccs.add(box["fourcc"])
        specs.add(box["spec"])
        if box["registered_type"] is not None:
            registered_types.add(box["registered_type"])
        if box["type"] is not None:
            types.add(box["type"])

    # In case we missed some specs
    for feature in files["feature_file_map"].values():
        # FIXME: This shouldn't be necessary
        if feature["spec"] == "N/A":
            continue
        specs.add(feature["spec"])

    # Sort the sets
    fourccs = sorted(fourccs)
    types = sorted(types)

    with open("output/dictionary.json", "w", encoding="utf-8") as f:
        json.dump(
            {
                "fourccs": sorted(fourccs),
                "types": sorted(types),
                "specs": sorted(specs),
                "registered_types": sorted(registered_types),
            },
            f,
            indent=4,
            ensure_ascii=False,
        )


if __name__ == "__main__":
    main()
