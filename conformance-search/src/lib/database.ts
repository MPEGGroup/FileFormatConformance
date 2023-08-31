import hash from "object-hash";
import {
    Box,
    Feature,
    FileSearchResult,
    Filter,
    FilterConverted,
    SearchResultRefined
} from "@/types";
import { Dictionary, FileMetadata, Files, Hierarchy } from "@/types/json";

/**
 * This will go through the given hierarchies and collect all the branches that match the given filter.
 * We terminate each branch at the first match. So that next filter can start from that branch.
 * @param filter - the filter to match
 * @param hierarchies - the hierarchies to search
 * @param matches - the matches found so far
 */
function collectMatchingBranches(
    filter: Filter,
    hierarchies: Hierarchy[],
    matches: Hierarchy[] = []
) {
    // Basically, we will start from the root, and go down the tree. If we encounter a node that matches the filter, we will keep the descedants of that node in a list (preserving the branch) and continue to other branches.
    const { type, value } = filter;

    // * go through hierarchies
    hierarchies.forEach((hierarchy) => {
        Object.keys(hierarchy).forEach((key) => {
            const [keyFourcc, keyType] = key.split(":");

            let found = false;
            if (type === "fourcc") {
                if (keyFourcc === value) {
                    matches.push(hierarchy[key]);
                    found = true;
                }
            } else if (type === "type") {
                if (keyType === value) {
                    matches.push(hierarchy[key]);
                    found = true;
                }
            }

            if (Object.keys(hierarchy[key]).length > 0 && !found) {
                collectMatchingBranches(filter, [hierarchy[key]], matches);
            }
        });
    });

    return matches;
}

/**
 * This goes through the given hierarchies and collects all unique the fourccs, types and tuples.
 * @param branches - the hierarchies to crawl
 */
function crawlBranches(
    branches: Hierarchy[],
    fourccs: string[] = [],
    types: string[] = [],
    tuples: string[] = []
) {
    branches.forEach((branch) => {
        Object.keys(branch).forEach((key) => {
            const box = branch[key];
            const [boxFourcc, boxType] = key.split(":");

            if (!fourccs.includes(boxFourcc)) fourccs.push(boxFourcc);
            if (!types.includes(boxType)) types.push(boxType);
            if (!tuples.includes(key)) tuples.push(key);

            if (Object.keys(box).length > 0) {
                crawlBranches([box], fourccs, types, tuples);
            }
        });
    });

    return { fourccs, types, tuples };
}

class Database {
    static instance: Database;

    #files: Files;

    #db: {
        [db_hash: string]: {
            boxes: Box[];
            dictionary: Dictionary;
            hierarchy: Hierarchy[];
            stripped: {
                boxes: Box[];
                dictionary: Dictionary;
            } | null;
        };
    } = {};

    #currentFilters: { exact: boolean; configuration: Filter[] }[] = [];

    #activeHashes = ["DEFAULT"];

    /**
     * Initializes the database. Loads the cached version from local storage if available.
     * Otherwise, loads the JSON files.
     * @access private
     */
    async init() {
        // load files and coverage from JSONs
        this.#files = (await import("@data/files.json").then((module) => module.default)) as Files;

        // load the database from local storage if it exists
        if (
            typeof window !== "undefined" &&
            window.localStorage &&
            process.env.NODE_ENV !== "development"
        ) {
            // Remove expired databases
            Object.keys(window.localStorage).forEach((key) => {
                if (key !== BUILD_TIMESTAMP) localStorage.removeItem(key);
            });

            const db = window.localStorage.getItem(BUILD_TIMESTAMP);
            if (db) {
                try {
                    const parsed = JSON.parse(db);
                    if (parsed) {
                        this.#db = parsed;
                        return;
                    }
                } catch (error) {
                    // Remove faulty database from local storage
                    window.localStorage.removeItem(BUILD_TIMESTAMP);
                }
            }
        }

        // load the database from JSON files
        this.#db = {
            DEFAULT: {
                boxes: (await import("@data/boxes.json").then((module) => module.default)) as Box[],
                dictionary: (await import("@data/dictionary.json").then(
                    (module) => module.default
                )) as Dictionary,
                hierarchy: [
                    await import("@data/hierarchy.json").then((module) => module.default)
                ] as Hierarchy[],
                stripped: null
            }
        };
        this.saveDatabase();
    }

    /**
     * Return the current instance of the database. If the instance is not initialized, it will initialize it.
     * @param reset - If true, it will return a new instance of the database
     */
    static async getInstance(reset = false) {
        if (!Database.instance || reset) {
            const instance = new Database();
            await instance.init();
            Database.instance = instance;
        }

        return Database.instance;
    }

    /**
     * Return the current instance of the database. If the instance is not initialized, it will throw an error.
     */
    static getInstanceSync() {
        if (Database.instance) return Database.instance;
        throw new Error("Database instance is not initialized");
    }

    /**
     * Converts _updateDatabase to a promise
     * @param filters - Current filters
     */
    async updateDatabase(filters: FilterConverted[]) {
        return new Promise((resolve, reject) => {
            try {
                this.updateDatabaseAction(filters);
            } catch (error) {
                reject(error);
            }
            resolve(null);
        });
    }

    /**
     * Updates the database based on the current filters.
     * Caches the compound filters in the database for faster access.
     * @param rawFilters - Current raw filters
     */
    private updateDatabaseAction(rawFilters: FilterConverted[]) {
        //* get only container filters
        const filters = rawFilters.filter((filter) => filter?.container);

        //* if no container filters, return
        if (!filters.length) {
            this.#activeHashes = ["DEFAULT"];
            this.#currentFilters = [];
            return;
        }

        //* parse container values
        // The container filter value is dot separated
        // If value starts with $, it is 4CC
        // If value starts with #, it is a box type
        // If value starts with =, it is an exact match
        this.#currentFilters = filters.map((filter) => {
            const value = filter.container;
            const values = value.startsWith("=") ? value.slice(1).split(".") : value.split(".");

            return {
                exact: value.startsWith("="),
                configuration: values.map((cfg) => {
                    if (cfg.startsWith("$")) {
                        return {
                            type: "fourcc",
                            value: cfg.slice(1)
                        };
                    }
                    if (cfg.startsWith("#")) {
                        return {
                            type: "type",
                            value: cfg.slice(1)
                        };
                    }
                    throw new Error("Invalid container filter value");
                })
            };
        });

        // * Reset active hashes
        this.#activeHashes = [];

        this.#currentFilters.forEach((filterValues) => {
            // * get the hash of the filter
            const filterHash = hash(filterValues);

            // * add to active hashes
            this.#activeHashes.push(filterHash);

            // * check if we have a cached version of the filter
            const cachedFilter = this.#db[filterHash];

            // * if we have a cached version, skip constructing the filter
            if (cachedFilter) return;

            // * construct the filter
            const pathSoFar: Filter[] = [];
            filterValues.configuration.forEach((currentNode) => {
                // * check the db if we have the current path in db
                pathSoFar.push(currentNode);

                // * get the hash of the path
                const pathHash = hash({
                    ...filterValues,
                    configuration: pathSoFar
                });

                // * check if we have a cached version of the path
                const cachedPath = this.#db[pathHash];

                // * if we have a cached version, skip constructing the path
                if (cachedPath) return;

                let rootAttributes = this.#db.DEFAULT;
                if (pathSoFar.length > 1) {
                    // * get previous attributes, if any
                    const previousPath: Filter[] = pathSoFar.slice(0, -1);
                    const rootAttributesHash = hash({
                        ...filterValues,
                        configuration: previousPath
                    });

                    // * get the previous attributes
                    if (rootAttributesHash in this.#db)
                        rootAttributes = this.#db[rootAttributesHash];
                }

                // * filter and generate matching branches
                const matchingBranches = collectMatchingBranches(
                    currentNode,
                    rootAttributes.hierarchy
                );

                // * clean the matching branches
                // If a branch does not have any descedants after filtering, we will remove that branch from the list
                const cleanHierarchy = (hierarchy: Hierarchy[]) => {
                    const hashes: string[] = [];
                    return hierarchy
                        .map((branch) => {
                            // * remove empty branches
                            if (Object.keys(branch).length === 0) return null;

                            // * remove duplicates
                            const branchHash = hash(branch);
                            if (hashes.includes(branchHash)) return null;
                            hashes.push(branchHash);

                            return branch;
                        })
                        .flatMap((branch) => (branch ? [branch] : []));
                };

                const cleanedMatchingBranches = cleanHierarchy(matchingBranches);

                // * get unique fourccs, types, and tuples
                const {
                    fourccs: uniqueFourccs,
                    types: uniqueTypes,
                    tuples: uniqueFourccTypeTuples
                } = crawlBranches(cleanedMatchingBranches);

                // * filter the boxes
                const filterBoxes = (boxes: Box[], tuples: string[]) => {
                    return boxes.filter((box) => {
                        const boxFourcc = box.fourcc;
                        const boxType = box.type;

                        let found = false;
                        tuples.forEach((tuple) => {
                            const [fourcc, type] = tuple.split(":");

                            if (fourcc === boxFourcc && type === boxType) found = true;
                        });

                        return found;
                    });
                };

                // * if we are on the last filter and the filter requires exact match, we will strip the boxes
                // * Therefore, only EXACT boxes will be returned
                let stripped: {
                    boxes: Box[];
                    dictionary: Dictionary;
                } | null = null;
                if (filterValues.exact) {
                    const matchingBranchesStripped = matchingBranches.map((branch) => {
                        const keys = Object.keys(branch);
                        const newBranch: Hierarchy = {};
                        keys.forEach((key) => {
                            newBranch[key] = {};
                        });
                        return newBranch;
                    });

                    const {
                        fourccs: uniqueFourccsStripped,
                        types: uniqueTypesStripped,
                        tuples: uniqueFourccTypeTuplesStripped
                    } = crawlBranches(cleanHierarchy(matchingBranchesStripped));

                    // Stripped means we will only return first descendent of each branch
                    stripped = {
                        boxes: filterBoxes(rootAttributes.boxes, uniqueFourccTypeTuplesStripped),
                        dictionary: {
                            fourccs: uniqueFourccsStripped,
                            types: uniqueTypesStripped,
                            specs: rootAttributes.dictionary.specs,
                            registered_types: rootAttributes.dictionary.registered_types
                        }
                    };
                }

                // * save the filter to the db
                this.#db[pathHash] = {
                    hierarchy: cleanedMatchingBranches,
                    boxes: filterBoxes(rootAttributes.boxes, uniqueFourccTypeTuples),
                    dictionary: {
                        fourccs: uniqueFourccs,
                        types: uniqueTypes,
                        specs: rootAttributes.dictionary.specs,
                        registered_types: rootAttributes.dictionary.registered_types
                    },
                    stripped
                };
            });
        });
        this.saveDatabase();
    }

    /**
     * Saves the database to local storage if available
     */
    saveDatabase() {
        if (
            typeof window !== "undefined" &&
            window.localStorage &&
            process.env.NODE_ENV !== "development"
        )
            window.localStorage.setItem(BUILD_TIMESTAMP, JSON.stringify(this.#db));
    }

    /**
     * Searches the files based on the current filters and given boxes
     * @param boxes - Boxes to search within files
     */
    getMatchingFilesByBox(boxes: SearchResultRefined<Box>[]): FileSearchResult[] {
        const matchingFiles: {
            item: FileMetadata;
            matches: {
                type: string;
                value: string;
            }[];
        }[] = [];

        boxes.forEach((currentBox) => {
            const key = `${currentBox.item.fourcc}:${currentBox.item.type}`;

            // * If the box is excluded, skip
            if (currentBox.exclude) return;

            // * First step is to search files.boxes to see what are the possible paths this box can be found in
            if (!(key in this.#files.boxes)) return;

            let matchingPaths = this.#files.boxes[key];

            // * If we have active filters, we will filter the matching paths
            matchingPaths = matchingPaths.filter((path) => {
                let matched = true;
                // Currently, we only support one container filter. This is for future proofing
                this.#currentFilters.forEach((filterValues) => {
                    let totalMatched = 0;
                    let latchAfterFirst = 0;
                    for (let i = 0; i < path.length; i += 1) {
                        // if we have already matched all the filters, we can break out of the loop
                        if (totalMatched === filterValues.configuration.length) {
                            // on exact match, totalMatched should be equal to path.length or we also include other descendants
                            if (filterValues.exact && totalMatched !== path.length) matched = false;
                            break;
                        }

                        // on exact match, we can break out of the loop if order of the filters are not met
                        if (filterValues.exact && totalMatched !== latchAfterFirst) {
                            matched = false;
                            break;
                        }

                        const currentNode = path[i];
                        const [boxFourcc, boxType] = currentNode.split(":");
                        const { type, value } = filterValues.configuration[totalMatched];

                        // if we have a "*" in the filter, accept the whole path as a match
                        if (boxFourcc === "*") {
                            totalMatched = filterValues.configuration.length;
                            break;
                        }

                        if (type === "fourcc" && value === boxFourcc) totalMatched += 1;
                        if (type === "type" && value === boxType) totalMatched += 1;

                        // on exact match we need to start counting after the first match
                        if (totalMatched > 0) latchAfterFirst += 1;
                    }

                    if (totalMatched !== filterValues.configuration.length) matched = false;
                });
                return matched;
            });

            // * Second step is to look through files.path_file_map to see what files have the matching paths
            const matchingPathsConverted = matchingPaths.map((path) => {
                // We don't need the box type anymore. But we need to add currentBox at the end of each path
                return path
                    .map((node) => node.split(":")[0])
                    .concat(currentBox.item.fourcc)
                    .join(".");
            });

            const matchingFilesConverted = matchingPathsConverted.flatMap((path) => {
                // If there are no refinements, we can just return the files
                if (!currentBox.refinements)
                    return [...new Set(Object.values(this.#files.path_file_map[path]).flat())];

                // Quick catch-up if file key has *:* that means it can be any version:flag
                // That can be seperate as well. 0:* means version 0, any flag
                // By any we mean GPAC couldn't find that version or flag in the JSON output
                // If standard specifies a version/flag and a refinement is applied we will try to match it exactly
                /*
                        If "*:*" is present then GPAC had no idea what version or flag it was but if we are here then there should've been a version or flag specified in the standard

                        Note: X means don't care
                        Example: Only version is given
                            version:X
                        Example: Multiple versions are given
                            version1:X,version2:X
                        Example: Only flag is given
                            X:flag
                        Example: Both version and flag is given
                            version:flag
                        Example: Multiple versions and flag is given
                            version1:flag,version2:flag
                    */

                // versions is an array of numbers
                // flags will be ORed and used as base 16
                const { versions, flags } = currentBox.refinements.variant;
                const ORedFlags = flags.value.reduce(
                    (accumulator, currentValue) =>
                        accumulator | parseInt(currentValue.split("0x")[1], 16),
                    0
                );

                const flagMatcher = (flag: string) => {
                    const nFlag = parseInt(flag, 10);
                    if (flags.exact) return nFlag === ORedFlags;
                    return (nFlag & ORedFlags) === nFlag;
                };

                // We will filter the variants to collect based on the refinements
                const variantsToCollect = Object.keys(this.#files.path_file_map[path]).filter(
                    (variant) => {
                        const [vv, vf] = variant.split(":");
                        return (
                            !(
                                versions.value.length > 0 &&
                                !versions.value.includes(parseInt(vv, 10))
                            ) && !(flags.value.length > 0 && !flagMatcher(vf))
                        );
                    }
                );

                // Merge the files from the variants
                const variantFiles = variantsToCollect.flatMap(
                    (variant) => this.#files.path_file_map[path][variant]
                );

                // Remove duplicates
                return [...new Set(variantFiles)];
            });

            // Flatten and remove duplicates
            const files = [...new Set(matchingFilesConverted)];

            // * Last step is to map the files to their metadata
            const matchingFilesMetadata = files.map((file) => {
                return {
                    item: this.#files.file_metadata[file],
                    matches: [
                        {
                            type: "box",
                            value: `${currentBox.item.fourcc}:${currentBox.item.type}`
                        }
                    ]
                };
            });

            matchingFiles.push(...matchingFilesMetadata);
        });

        return matchingFiles;
    }

    /**
     * Searches the files based on the current filters and given features
     * @param features - Features to search within files
     */
    getMatchingFilesByFeature(features: SearchResultRefined<Feature>[]): FileSearchResult[] {
        const matchingFiles: {
            item: FileMetadata;
            matches: {
                type: string;
                value: string;
            }[];
        }[] = [];

        features.forEach((currentFeature) => {
            // * If the feature is excluded, skip
            if (currentFeature.exclude) return;

            matchingFiles.push(
                ...this.#files.feature_file_map[currentFeature.item.name].files.map((file) => {
                    return {
                        item: this.#files.file_metadata[file],
                        matches: [
                            {
                                type: "feature",
                                value: currentFeature.item.name
                            }
                        ]
                    };
                })
            );
        });

        return matchingFiles;
    }

    /**
     * Getter for boxes. It will reflect the filters applied during updateDatabase.
     * If stripped boxes are available, it will return those.
     */
    get boxes() {
        let buffer: Box[] = [];
        this.#activeHashes.forEach((currentHash) => {
            const boxes = (
                this.#db[currentHash].stripped !== null
                    ? this.#db[currentHash].stripped?.boxes
                    : this.#db[currentHash].boxes
            ) as Box[];

            buffer.push(...boxes);
        });

        // Remove duplicates
        buffer = buffer.filter(
            (box, index, self) =>
                index === self.findIndex((t) => t.fourcc === box.fourcc && t.type === box.type)
        );

        return buffer;
    }

    /**
     * Getter for dictionary. It will reflect the filters applied during updateDatabase.
     * If stripped dictionary is available, it will return those.
     */
    get dictionary() {
        const buffer: Dictionary = {
            fourccs: [],
            types: [],
            specs: this.#db.DEFAULT.dictionary.specs,
            registered_types: this.#db.DEFAULT.dictionary.registered_types
        };

        this.#activeHashes.forEach((currentHash) => {
            // Fourccs
            const fourccs: string[] = (
                this.#db[currentHash].stripped !== null
                    ? this.#db[currentHash].stripped?.dictionary.fourccs
                    : this.#db[currentHash].dictionary.fourccs
            ) as string[];

            fourccs.forEach((fourcc) => {
                if (!buffer.fourccs.includes(fourcc)) buffer.fourccs.push(fourcc);
            });

            // Types
            const types: string[] = (
                this.#db[currentHash].stripped !== null
                    ? this.#db[currentHash].stripped?.dictionary.types
                    : this.#db[currentHash].dictionary.types
            ) as string[];

            types.forEach((type) => {
                if (!buffer.types.includes(type)) buffer.types.push(type);
            });
        });

        return buffer;
    }
}

export default Database;
