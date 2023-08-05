import json
from glob import glob
from jsonschema import validate
from jsonschema.exceptions import ValidationError

from common import get_ignored_files


def test_validate_standard(check):
    # Import the schemas
    with open("../data/schemas/spec-info.schema.json", "r", encoding="utf-8") as f:
        spec_info_schema = json.load(f)

    with open("../data/schemas/standard.schema.json", "r", encoding="utf-8") as f:
        standard_schema = json.load(f)

    with open("../data/schemas/user-defined.schema.json", "r", encoding="utf-8") as f:
        user_defined_schema = json.load(f)

    # Validate the files
    files = glob("../data/standard_features/**/*.json", recursive=True)
    for file in files:
        with open(file, "r", encoding="utf-8") as f:
            data = json.load(f)

        try:
            if "spec_info" in file:
                validate(instance=data, schema=spec_info_schema)
            elif "user_defined" in file:
                validate(instance=data, schema=user_defined_schema)
            else:
                validate(instance=data, schema=standard_schema)
        except ValidationError as ve:
            check.is_true(False, f"File {file} failed validation: {ve.message}")


def test_validate_files(check):
    # Import the schemas
    with open("../data/schemas/file-metadata.schema.json", "r", encoding="utf-8") as f:
        file_metadata_schema = json.load(f)

    with open("../data/schemas/gpac-extension.schema.json", "r", encoding="utf-8") as f:
        gpac_extension_schema = json.load(f)

    # Validate the files
    files = glob("../data/file_features/**/*.json", recursive=True)
    ignored = get_ignored_files()
    files = list(set(files) - ignored)
    for file in files:
        with open(file, "r", encoding="utf-8") as f:
            data = json.load(f)

        try:
            if "gpac.ext" in file:
                validate(instance=data, schema=gpac_extension_schema)
            elif "gpac" not in file:
                validate(instance=data, schema=file_metadata_schema)
        except ValidationError as ve:
            check.is_true(False, f"File {file} failed validation: {ve.message}")
