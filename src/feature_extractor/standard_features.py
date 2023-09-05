import argparse
import os
from docx import Document
import json
import re
from git import Repo
import csv

MP4RA_PATH = "./mp4ra"
MP4RA_URL = "https://github.com/mp4ra/mp4ra.github.io.git"


def get_mp4ra_entries(csv_file, feature_type):
    mp4ra_entries = []
    code_idx = 0
    description_idx = 1
    spec_idx = 2
    if feature_type == "item_references" or feature_type == "sample_groups":
        spec_idx = 3
    csv_reader = csv.reader(csv_file, delimiter=",")
    line_idx = 0
    for row in csv_reader:
        line_idx += 1
        if line_idx == 1:
            continue
        code = row[code_idx].strip()
        code = code.replace("$20", " ")
        description = row[description_idx].strip()
        spec = row[spec_idx].strip()

        entry = {"fourcc": code, "description": description, "spec": spec}
        mp4ra_entries.append(entry)
    return mp4ra_entries


def get_4CC_and_class(boxsyntax):
    # Initialize variables to None
    class_name = None
    four_cc = None

    class_name_match = re.search(
        r"class ([a-zA-Z0-9_]+) extends (Box|FullBox)", boxsyntax
    )
    four_cc_match = re.search(r"(Box|FullBox)\('([^']+)'", boxsyntax)

    if class_name_match:
        class_name = class_name_match.group(1)
    if four_cc_match:
        four_cc = four_cc_match.group(2)

    return class_name, four_cc


def _update_boxes(entries, paragraphs, mp4ra_entries):
    boxes = []
    fullboxes = []

    for paragraph in paragraphs:
        matches = re.findall(
            r"(class [a-zA-Z0-9_]+ extends Box\([^)]*\)\s*{[^}]*})", paragraph
        )
        for match in matches:
            if match not in boxes:
                boxes.append(match)
        matches = re.findall(
            r"(class [a-zA-Z0-9_]+ extends FullBox\([^)]*\)\s*{[^}]*})", paragraph
        )
        for match in matches:
            if match not in boxes:
                fullboxes.append(match)

    # let the user know what we found.
    print(f"Found {len(boxes) + len(fullboxes)} Boxes and FullBoxes")
    print(f"{5*'----'} {len(boxes)} Box'es {5*'----'}")
    for box in boxes:
        classname, fourcc = get_4CC_and_class(box)
        print(f"{fourcc}: {classname}")
    print(f"{5*'----'} {len(fullboxes)} FullBox'es {5*'----'}")
    for box in fullboxes:
        classname, fourcc = get_4CC_and_class(box)
        print(f"{fourcc}: {classname}")
    print(11 * "----")

    # print(entries)
    # now see if we actually found something new
    for boxsyntax in boxes:
        classname, fourcc = get_4CC_and_class(boxsyntax)
        foundentries = [entry for entry in entries if entry["fourcc"] == fourcc]
        assert len(foundentries) <= 1, f"More than 1 entries fround for {fourcc}"
        if len(foundentries) == 1:
            # TODO: replace type with the classname and add parenttype Box
            # entry = foundentries[0]
            # if entry["type"] != classname:
            #     print(f'Classname/Type mismatch {fourcc}. {classname}/{entry["type"]}')
            continue
        description = ""
        ra_entries = [
            ra_entry for ra_entry in mp4ra_entries if ra_entry["fourcc"] == fourcc
        ]
        if len(ra_entries) == 1:
            description = ra_entries[0]["description"]
        newentry = {
            "fourcc": fourcc,
            "description": description,
            "containers": [],
            "type": "Box",
            "syntax": boxsyntax,
        }
        print(f"add new entry: {fourcc}")
        entries.append(newentry)
    for boxsyntax in fullboxes:
        classname, fourcc = get_4CC_and_class(boxsyntax)
        foundentries = [entry for entry in entries if entry["fourcc"] == fourcc]
        assert len(foundentries) <= 1, f"More than 1 entries fround for {fourcc}"
        if len(foundentries) == 1:
            # TODO: replace type with the classname and add parenttype FullBox
            # entry = foundentries[0]
            # if entry["type"] != classname:
            #     print(f'Classname/Type mismatch {fourcc}. {classname}/{entry["type"]}')
            continue
        description = ""
        ra_entries = [
            ra_entry for ra_entry in mp4ra_entries if ra_entry["fourcc"] == fourcc
        ]
        if len(ra_entries) == 1:
            description = ra_entries[0]["description"]
        newentry = {
            "fourcc": fourcc,
            "description": description,
            "containers": [],
            "type": "Box",
            "syntax": boxsyntax,
        }
        print(f"add new entry: {fourcc}")
        entries.append(newentry)
    return len(entries)


def update():
    parser = argparse.ArgumentParser(
        description="Update standard features based on the spec word document and MP4RA."
    )
    parser.add_argument(
        "-i", "--input", help="Input json file with standard features.", required=True
    )
    parser.add_argument(
        "-s", "--spec", help="Input specification .docx file", required=True
    )
    parser.add_argument(
        "--allpars",
        dest="allpars",
        action="store_true",
        help="Use all paragraphs and not only those which are formatted with code",
    )
    args = parser.parse_args()

    # get/update MP4RA
    if not os.path.exists(MP4RA_PATH):
        print(f"clone MP4RA repo {MP4RA_URL} to {MP4RA_PATH}")
        Repo.clone_from(MP4RA_URL, MP4RA_PATH, branch="main")
    else:
        print(f"pull MP4RA in {MP4RA_PATH}")
        repo = Repo(MP4RA_PATH)
        repo.remotes.origin.pull()

    # load json file
    with open(args.input, "r") as json_file:
        data = json.load(json_file)

    # open and parse spec
    doc = Document(args.spec)
    # filter styles by string "code" in their names
    codestyles = []
    for style in doc.styles:
        if "code" in style.name.lower():
            codestyles.append(style)
    # get text of all code paragraphs
    codeparagraphs = []
    for par in doc.paragraphs:
        if par.style in codestyles:
            codeparagraphs.append(par.text)
        elif args.allpars:
            codeparagraphs.append(par.text)

    if "boxes.json" in args.input:
        # get associated type from MP4RA
        tmp_path = os.path.join(MP4RA_PATH, "CSV", "boxes.csv")
        with open(tmp_path, "r") as f:
            mp4ra_entries = get_mp4ra_entries(f, "boxes")
        tmp_path = os.path.join(MP4RA_PATH, "CSV", "sample-entries-boxes.csv")
        with open(tmp_path, "r") as f:
            mp4ra_se_boxes = get_mp4ra_entries(f, "boxes")
            mp4ra_entries += mp4ra_se_boxes

        cnt_before = len(data["entries"])
        cnt_after = _update_boxes(data["entries"], codeparagraphs, mp4ra_entries)
        print(f"New entries count: {cnt_after - cnt_before}")
        with open(args.input, "w") as json_file:
            json.dump(data, json_file, indent=2)
    else:
        head, tail = os.path.split(args.input)
        print(f"No support for {tail} yet implemented.")
