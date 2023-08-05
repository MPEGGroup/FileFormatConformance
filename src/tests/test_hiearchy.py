import json
import random
import hashlib
from tqdm import tqdm
from copy import deepcopy

from construct.hierarchy import build_farm


def dict_hash(dictionary):
    """MD5 hash of a dictionary."""
    dhash = hashlib.md5()
    encoded = json.dumps(dictionary).encode()
    dhash.update(encoded)
    return dhash.hexdigest()


def load_data():
    with open("tests/__mocks__/test_boxes.json", "r", encoding="utf-8") as f:
        return json.load(f)


def test_determinism():
    """
    This test checks that the tree is deterministic on mock data.
    """
    data = load_data()
    hashes = {}

    for _ in tqdm(range(100), ncols=80):
        rdata = deepcopy(data)
        random.shuffle(rdata)

        farm = build_farm(rdata, "../data/rules/hierarchy.json")
        for tree in farm:
            if tree.root.box.fourcc not in hashes:
                hashes[tree.root.box.fourcc] = set()

            _hash = dict_hash(tree.toJSON())

            if _hash not in hashes[tree.root.box.fourcc]:
                hashes[tree.root.box.fourcc].add(_hash)

                assert len(hashes[tree.root.box.fourcc]) == 1, (
                    "Non-deterministic tree for",
                    tree.root.box.fourcc,
                )

    for k, v in hashes.items():
        assert len(v) == 1, ("Non-deterministic tree for", k)
