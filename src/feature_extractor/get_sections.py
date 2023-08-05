import regex
import json
from docx import Document

from transformers import AutoTokenizer, AutoModelWithLMHead


tokenizer = AutoTokenizer.from_pretrained("t5-base")
model = AutoModelWithLMHead.from_pretrained("t5-base", return_dict=True)


def is_heading(paragraph):
    return regex.match(r"h\d+|a\d+|Heading.\d", paragraph.style.name)


def summarize(definition):
    if len(definition) == 0:
        return ""

    inputs = tokenizer.encode(
        "summarize: " + "\n".join(definition),
        return_tensors="pt",
        max_length=512,
        truncation=True,
    )

    summary_ids = model.generate(
        inputs, max_length=96, min_length=2, length_penalty=5.0, num_beams=2
    )

    summary = tokenizer.decode(summary_ids[0])

    # remove <pad> and </s> tokens
    summary = summary.replace("<pad>", "")
    summary = summary.replace("</s>", "")

    # remove last non sentences
    summary = summary.rsplit(".", 1)[0] + "."

    # remove extra white spaces
    summary = summary.strip()

    # Capitalize first letter of each sentence including the first one
    summary = ". ".join(
        sentence[0].capitalize() + sentence[1:] for sentence in summary.split(". ")
    )

    # remove extra white spaces
    summary = summary.strip()

    print("Summary:\n", summary)
    return summary


def parse_atom(atom):
    lines = atom.split("\n")
    obj_atom = {}
    for line in lines:
        if line == "":
            continue

        if ":" not in line:
            obj_atom[key] += " " + line.strip()
            continue

        key, value = line.split(":")
        obj_atom[key.strip()] = value.strip()

    # Convert fourccs to list
    first_key = list(obj_atom.keys())[0]
    fourcccs = obj_atom[first_key].split(",")

    # get only alphanumeric characters
    fourcccs = [regex.sub(r"[^a-zA-Z0-9]", "", f) for f in fourcccs]

    obj_atom[first_key] = fourcccs

    return obj_atom


if __name__ == "__main__":
    raise NotImplementedError("This is not good as Dimitri's attempt")
    document = Document("sample.docx")

    data = []

    done_so_far = 0

    # get all parapgrahs and their headings
    state = 0
    prev_heading = ""
    atom = ""
    definition = []
    for i, paragraph in enumerate(document.paragraphs):
        if state < 3 and is_heading(paragraph):
            if state == 0:
                prev_heading = paragraph.text
                state = 1
                continue

            if paragraph.text == "Definition":
                state = 2
                continue
            else:
                state = 0
                continue

        if state == 2 and paragraph.style.name == "Atom":
            atom = paragraph.text
            state = 3
        elif state == 3 and is_heading(paragraph):
            data.append(
                {
                    "heading": prev_heading,
                    "atom": parse_atom(atom),
                    "definition": summarize(definition),
                }
            )
            definition = []
            done_so_far += 1
            print("Done so far:", done_so_far)
            state = 0
        elif state == 3 and paragraph.style.name == "Normal":
            definition.append(paragraph.text)
        elif state == 3:
            continue
        else:
            state = 0

    # show different keys in atoms
    keys = set()
    for d in data:
        keys.update(d["atom"].keys())

    print("Different keys for atoms:", keys)

    # count number of atoms
    print("Number of atoms:", len(data))

    # save data
    with open("output/data.json", "w") as f:
        json.dump(data, f, indent=4)
