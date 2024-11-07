import os
import json
import pytest
from glob import glob
from itertools import compress

from common import get_ignored_files
from feature_extractor.file_features import traverse_gpac_dict


def test_variants(check):
    # We could add new files without doing this but having this information is a nice habit
    # if file has *:* then it shouldn't have version or flags in the standard features
    # If it has version or flags then it should be in the standard features

    with open("output/boxes.json", "r", encoding="utf-8") as f:
        boxes = json.load(f)

    with open("output/files.json", "r", encoding="utf-8") as f:
        files = json.load(f)

    # Create the base reference (standard)
    base_reference = {}
    for box in boxes:
        key = f"{box['fourcc']}:{box['type']}"

        # Get versions
        versions = []
        if "versions" in box and isinstance(box["versions"], list):
            versions = list(set(v for v in box["versions"]))

        # Get flags
        flags = []
        if "flags" in box and isinstance(box["flags"], list):
            for f in box["flags"]:
                if "wildcard" in f:
                    if f["wildcard"] == "any":
                        flags.append(f["wildcard"])
                else:
                    flags.append(int(f["value"].split("0x")[1], 16))

        # Add to base reference
        base_reference[key] = {
            "versions": set(versions),
            "flags": set(flags),
        }

    # Look at files
    for box, paths in files["boxes"].items():
        ref = base_reference[box]

        # Convert paths to path_file_map index
        paths = [".".join(p.split(":")[0] for p in path + [box]) for path in paths]

        # Get variants
        for path in paths:
            if path == "file" or "*" in path:
                continue

            # We don't care about variant metadata so strip it
            variant_file_map = files["path_file_map"][path]
            variant_file_map = {
                ":".join(k.split(":")[:2]): v for k, v in variant_file_map.items()
            }

            # Get variant keys
            variant_keys = set(variant_file_map.keys())

            # Check if there is a *:* variant
            if "*:*" in variant_keys:
                # First check: if there is a *:* variant then there should be no other variants
                with check:
                    assert (
                        len(variant_keys) == 1
                    ), f"Found multiple variants for box {box} when there is a *:* variant"

                # Second check: if there is a *:* variant then there should be no version or flags in the standard features
                with check:
                    test = len(ref["versions"]) == 0 and len(ref["flags"]) == 0
                    if not test:
                        for key, val in variant_file_map.items():
                            if key != "*:*":
                                continue
                            print(f"{box} problematic variant: {key}")
                            for file in val:
                                print(f"\t{file}")
                    assert (
                        test
                    ), f"Box {box} has a *:* variant but also version or flags defined in the standard features."
                continue

            # We have variants
            # Check if the ref versions is the super set
            variant_versions = set(int(v.split(":")[0]) for v in variant_keys)
            with check:
                is_super_set = ref["versions"].issuperset(variant_versions)
                # List problematic files
                if not is_super_set:
                    excess_versions = variant_versions - ref["versions"]
                    excess_variants = [
                        v
                        for v in variant_keys
                        if int(v.split(":")[0]) in excess_versions
                    ]
                    for variant in excess_variants:
                        print(f"{box} problematic variant (version): {variant}")
                        for file in variant_file_map[variant]:
                            print(f"\t{file}")
                assert (
                    is_super_set
                ), f"Box {box} has versions {variant_versions - ref['versions']} that are not in the standard features."

            # Skip flag check if "any" wildcard is present
            if "any" in ref["flags"]:
                continue

            # Check if the ref flags is the super set
            variant_flags = [v.split(":")[1] for v in variant_keys]

            # Standard doesn't specify "any" wildcard so the variant should not have it as well
            with check:
                assert (
                    "*" not in variant_flags
                ), f"Box {box} has wilcard (any) flag in the variant but not in the standard features."

            variant_flags = filter(lambda x: x != "*", variant_flags)
            variant_flags = set(map(int, variant_flags))

            # These flags can be composed of multiple flags
            # We need to check if the flags are a subset of the standard flags
            failed_flags = set()
            for variant_flag in variant_flags:
                cf = 0
                for ref_flag in ref["flags"]:
                    if variant_flag & ref_flag == ref_flag:
                        cf |= ref_flag
                if cf != variant_flag:
                    failed_flags.add(variant_flag)

            with check:
                # List problematic files
                if len(failed_flags) > 0:
                    for variant in variant_keys:
                        if int(variant.split(":")[1]) in failed_flags:
                            print(f"{box} problematic variant (flag): {variant}")
                            for file in variant_file_map[variant]:
                                print(f"\t{file}")
                assert (
                    len(failed_flags) == 0
                ), f"Box {box} has flags {failed_flags} that are not in the standard features."


def test_metadata_conforms_to(check):
    # Load all spec informations
    with open("output/coverage.json", "r", encoding="utf-8") as f:
        specs = json.load(f)["spec_info"]

    # Load all metadata files
    metadata_files = glob("../data/file_features/**/*.json", recursive=True)
    metadata_files = list(filter(lambda x: "_gpac" not in x, metadata_files))
    ignored = get_ignored_files()
    metadata_files = list(set(metadata_files) - ignored)

    # Check if "conforms_to" is a valid property
    for file in metadata_files:
        with open(file, "r", encoding="utf-8") as f:
            metadata = json.load(f)

        for conforms_to in metadata["conforms_to"]:
            ref = list(
                filter(
                    lambda x, y=conforms_to: x["ISO"] == y["ISO"]
                    and x["version"] == y["version"],
                    specs,
                )
            )
            exists = len(ref) == 1
            assert (
                len(ref) < 2
            ), f"There are multiple specifications with the same ISO and version. {ref}"

            # amendmends and corrigenda needs to be super set
            if exists:
                ref = ref[0]
                if "amendmends" in ref:
                    base = set(ref["amendmends"])
                    if "amendmends" in conforms_to:
                        current = set(conforms_to["amendmends"])
                        exists = exists and base.issuperset(current)
                else:
                    exists = exists and not ("amendmends" in conforms_to)

                if "corrigenda" in ref:
                    base = set(ref["corrigenda"])
                    if "corrigenda" in conforms_to:
                        current = set(conforms_to["corrigenda"])
                        exists = exists and base.issuperset(current)
                else:
                    exists = exists and not ("corrigenda" in conforms_to)

            with check:
                assert (
                    exists
                ), f"Specification {conforms_to['ISO']} (ver{conforms_to['version']}) in {file} is not a valid spec."


@pytest.mark.dependency()
def test_folder_consistency(check):
    # Every file should be accounted for
    ALL_FILES = set(glob("../data/file_features/**/*", recursive=True))

    # Remove directories
    ALL_FILES = ALL_FILES - set(file for file in ALL_FILES if os.path.isdir(file))

    # Look at ignored files
    ignored = set(
        ["../data/file_features/.cfignore", "../data/file_features/README.md"]
    )
    ignored.update(get_ignored_files())

    # Remove ignored files
    ALL_FILES = ALL_FILES - ignored
    FOUND_FILES = set()
    assertion_raised = False

    # Traverse trough metadata files
    for file in ALL_FILES:
        if not file.endswith(".json"):
            continue

        if "gpac" in file:
            continue

        with open(file, "r", encoding="utf-8") as f:
            metadata = json.load(f)

        # Gather the files associated with this metadata
        actual_file = os.path.relpath(
            os.path.join(os.path.dirname(file), metadata["rel_filepath"])
        )
        gpac_file = file.replace(".json", "_gpac.json")
        gpac_ext_file = file.replace(".json", "_gpac.ext.json")
        associated_files = [
            os.path.relpath(os.path.join(os.path.dirname(file), af))
            for af in metadata["associated_files"]
        ]

        # Check if the primary files exist
        primary_files = [actual_file, gpac_file]
        primary_files.extend(associated_files)
        primary_files_exist = [os.path.exists(pf) for pf in primary_files]

        # Report if any of the primary files do not exist
        with check:
            assert all(
                primary_files_exist
            ), f"Some primary files {list(compress(primary_files, [p ^ 1 for p in primary_files_exist]))} do not exist."

        if not all(primary_files_exist):
            assertion_raised = True
            continue

        # Check if gpac extension is needed
        with open(gpac_file, "r", encoding="utf-8") as f:
            gpac_dict = json.load(f)
        unknown_boxes = traverse_gpac_dict(gpac_dict)
        if len(unknown_boxes) > 0:
            with check:
                gpac_ext_exists = os.path.exists(gpac_ext_file)
                assert gpac_ext_exists, f"File {gpac_ext_file} does not exist."

        if len(unknown_boxes) > 0 and not os.path.exists(gpac_ext_file):
            assertion_raised = True
            continue

        # Add the files to the found files
        FOUND_FILES.add(file)
        FOUND_FILES.add(actual_file)
        FOUND_FILES.add(gpac_file)
        for associated_file in associated_files:
            FOUND_FILES.add(associated_file)
        if len(unknown_boxes) > 0:
            FOUND_FILES.add(gpac_ext_file)

    # Unaccounted files check is useless if an assertion was raised
    if assertion_raised:
        return

    for file in ALL_FILES - FOUND_FILES:
        print(f"Unaccounted file: {file}")

    # Check if there are any files left
    with check:
        consistent_files = ALL_FILES == FOUND_FILES
        assert (
            consistent_files
        ), f"Found {len(ALL_FILES) - len(FOUND_FILES)} unaccounted files."


@pytest.mark.dependency(depends=["test_folder_consistency"])
def test_gpac_ext_consistency(check):
    gpac_files = glob("../data/file_features/**/*_gpac.json", recursive=True)
    ignored = get_ignored_files()
    gpac_files = list(set(gpac_files) - ignored)

    for gpac in gpac_files:
        with open(gpac, "r", encoding="utf-8") as f:
            gpac_dict = json.load(f)

        unknown_boxes = traverse_gpac_dict(gpac_dict)
        if len(unknown_boxes) == 0:
            continue

        gpac_ext = gpac.replace(".json", ".ext.json")

        if not os.path.exists(gpac_ext):
            continue  # This is already checked in test_folder_consistency

        with open(gpac_ext, "r", encoding="utf-8") as f:
            gpac_ext_dict = json.load(f)

        # Test if boxes are the same
        gt_locations = [ub["location"] for ub in unknown_boxes]
        ref_locations = [ub["location"] for ub in gpac_ext_dict["extensions"]]

        # Reference must match exactly
        with check:
            assert (
                gt_locations == ref_locations
            ), f"Extension file provided for {gpac} is inconsistent with the MP4Box output."
