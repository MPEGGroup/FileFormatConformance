import json
from dataclasses import dataclass
from argparse import ArgumentParser

from common.unique_logger import logger


@dataclass
class Box:
    fourcc: str
    type: str
    only_match_type: bool = False

    def __post_init__(self):
        if self.fourcc == "*":
            self.only_match_type = True

    def __hash__(self):
        if self.fourcc == "file":
            return hash(self.fourcc)
        if self.type is None:
            logger.critical(f"Box {self.fourcc} has no type")
            exit(1)
        return hash(self.fourcc + self.type)

    def __eq__(self, other):
        if self.only_match_type or other.only_match_type:
            return self.type == other.type

        return self.fourcc == other.fourcc and self.type == other.type

    def __str__(self):
        return f"{self.fourcc} ({self.type})"


class Branch:
    def __init__(self, box):
        self.root = None
        self.box = box
        self.descendants = []

    def branch_out(self, box):
        # If descendants already has the box, don't add it again
        for descendant in self.descendants:
            if descendant.box == box:
                return False

        # Create a new branch
        new_branch = Branch(box)
        new_branch.root = self
        self.descendants.append(new_branch)
        return True

    def get_path(self):
        path = []
        current = self
        while current is not None:
            path.append(current)
            current = current.root

        path.reverse()
        return path

    def __hash__(self):
        return hash(self.box)

    def __eq__(self, other):
        return self.box == other.box


class Tree:
    def __init__(self, root_box):
        self.root = Branch(root_box)
        self.disconnected_boxes = set()
        self.all_connectable_boxes = set()
        self.saplings = set()

        # Cache
        self.cache = {}

    def add_saplings(self, saplings):
        self.saplings = set(saplings)

    def flush_disconnected_boxes(self):
        # Go through disconnected boxes and try to add them to the tree
        # It is possible that they still don't have a parent
        # If so, add them to the disconnected boxes queue again
        temp = set()
        while len(self.disconnected_boxes) > 0:
            dis_box = self.disconnected_boxes.pop()
            parents = self.find_boxes(dis_box[1])
            if len(parents) == 0:
                temp.add(dis_box)
                continue

            for parent in parents:
                self._add(dis_box[0], parent.box)

        self.disconnected_boxes = temp

    def flush_all_connectable_boxes(self):
        n_success = 0
        n_prev_success = None

        while n_success != n_prev_success:
            n_prev_success = n_success
            for box, parent in self.all_connectable_boxes:
                res = self._add(box, parent)
                if res:
                    n_success += 1

    def flush_all(self, flush_cache=False):
        if flush_cache:
            self.cache = {}
        self.flush_disconnected_boxes()
        self.flush_all_connectable_boxes()

    def add(self, box, parent):
        # Flush all
        self.flush_all()

        # Add the box to the tree
        self._add(box, parent)

    def _add(self, box, parent):
        # Add to all connectable boxes
        self.all_connectable_boxes.add((box, parent))

        # If the parent is not in the tree, add it to the disconnected boxes queue
        parents = self.find_boxes(parent)
        if len(parents) == 0:
            self.disconnected_boxes.add((box, parent))
            return False

        # If the parent is in the tree, add the box to the tree
        added = False
        for _parent in parents:
            res = _parent.branch_out(box)

            # Invalidate cache
            if res and box in self.cache:
                del self.cache[box]

            if not added and res:
                added = True

        return added

    def find_boxes(self, box):
        if box in self.cache:
            return self.cache[box]

        result = self._find_boxes(box, self.root)
        self.cache[box] = result
        return result

    def _find_boxes(self, box, root):
        if root.box == box:
            return [root]

        if root.descendants is None:
            return []

        result = []
        for descendant in root.descendants:
            result += self._find_boxes(box, descendant)

        return result

    def get_leaves(self, root=None):
        if root is None:
            root = self.root

        if len(root.descendants) == 0:
            return [root]

        result = []
        for descendant in root.descendants:
            result += self.get_leaves(descendant)

        return result

    def toJSON(self):
        def order_dict(dictionary):
            return {
                k: order_dict(v) if isinstance(v, dict) else v
                for k, v in sorted(dictionary.items())
            }

        return order_dict(self._toJSON())

    def _toJSON(self):
        result = {}
        serialized_saplings = [s._toJSON() for s in self.saplings]

        def _serizalize_tree(root, result):
            key = f"{root.box.fourcc}:{root.box.type}"
            if key not in result:
                result[key] = {}

                for s in serialized_saplings:
                    result[key].update(s)

            if root.descendants is None:
                return

            for descendant in root.descendants:
                _serizalize_tree(descendant, result[key])

        _serizalize_tree(self.root, result)
        return result

    def __str__(self):
        return self._print_tree()

    def _print_tree(self, root=None, depth=0):
        # This visualization does not show the boxes with containers of type '*'. However, they are added during serialization.
        if root is None:
            root = self.root

        string = "  " * depth + str(root.box) + "\n"

        if root.descendants is None:
            return string

        for descendant in root.descendants:
            string += self._print_tree(descendant, depth + 1)

        return string


class Sapling(Tree):
    pass


def build_farm(_data, ruleset):
    # Create a farm
    _farm = []

    # Create skip set
    skip = set()

    # Do a initial pass to create root boxes
    for entry in _data:
        _box = Box(entry["fourcc"], entry["type"])
        if "containers" not in entry or len(entry["containers"]) == 0:
            skip.add(_box)
            _farm.append(Tree(_box))
            continue

        for container in entry["containers"]:
            if container["type"] == "*":
                skip.add(_box)
                _farm.append(Sapling(_box))
                break

    # Add boxes to the tree
    for entry in _data:
        _box = Box(entry["fourcc"], entry["type"])
        if _box in skip:
            continue

        for container in entry["containers"]:
            _container = Box(container["fourcc"], container["type"])
            for _tree in _farm:
                _tree.add(_box, _container)

    # Separate trees
    trees = [t for t in _farm if type(t) == Tree]
    saplings = [s for s in _farm if type(s) == Sapling]

    # Flush all
    for t in trees + saplings:
        t.flush_all(flush_cache=True)

    # Add saplings to trees
    for t in trees:
        t.add_saplings(saplings)

    # Prune the trees based on ruleset
    with open(ruleset, "r", encoding="utf-8") as f:
        rules = json.load(f)

    has_rule = lambda x: f"{x.box.fourcc}:{x.box.type}" in rules
    get_rule = lambda x: rules[f"{x.box.fourcc}:{x.box.type}"]

    for tree in trees:
        leaves = tree.get_leaves()
        for leaf in leaves:
            # Check if any node in the path has a rule
            path = leaf.get_path()
            for node in path:
                # Check if the node has a rule
                if not has_rule(node):
                    continue

                # Check if the rule is prune
                rule = get_rule(node)
                if not rule["action"] == "prune" or node.root is None:
                    continue

                # Check conditions
                conditions = rule["conditions"]
                if "path_has" in conditions:
                    if not any(
                        [
                            Box(*c.split(":")) in [n.box for n in path]
                            for c in conditions["path_has"]
                        ]
                    ):
                        continue

                # Remove it from its root
                node.root.descendants.remove(node)
                node.root = None

    return trees


def main():
    parser = ArgumentParser()
    parser.add_argument(
        "-r",
        "--rules",
        help="Path to the ruleset",
        default="../data/rules/hierarchy.json",
    )

    args = parser.parse_args()

    with open("output/boxes.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    farm = build_farm(data, args.rules)

    # Print the number of trees if there are more than one
    if len(farm) > 1:
        logger.error(
            "There are more than one tree in the farm. Trees that are not originated from 'file' has been removed. Excess trees are: "
            + ", ".join([str(t.root.box) for t in farm if t.root.box.fourcc != "file"])
        )

    # Serialize the 'file' tree
    serialized = {}
    for tree in farm:
        if tree.root.box.fourcc == "file":
            serialized = tree.toJSON()
            break

    # Write the serialized trees to a file
    with open("output/hierarchy.json", "w", encoding="utf-8") as f:
        json.dump(serialized, f, indent=4)


if __name__ == "__main__":
    main()
