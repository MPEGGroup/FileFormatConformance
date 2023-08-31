import Fuse from "fuse.js";
import hash from "object-hash";

import { Box, Feature, FileSearchResult, Filter, SearchResult, SearchResultRefined } from "@/types";
import { Files } from "@/types/json";
import { normalizeResultScores } from "@/utils";
import Database from "./database";

/**
 * This is the list of filter options
 */
export const FILTER_OPTIONS: {
    [key: string]: {
        name: string;
        placeholder: string;
    };
} = {
    container: {
        name: "Container",
        placeholder: "Start by typing a box or a type..."
    },
    type: {
        name: "Box Type",
        placeholder: "Start by typing a type..."
    },
    registered_type: {
        name: "Registered Type",
        placeholder: "Start by typing a registered type..."
    },
    spec: {
        name: "Specification",
        placeholder: "Start by typing the ISO/IEC number..."
    }
};

class Search {
    static instance: Search;

    #database: Database;

    #filters: Filter[] = [];

    #files: Files;

    #currentHash = "";

    #fuses: [Fuse<Box>, Fuse<Feature>];

    #fuseCache: {
        [hash: string]: [Fuse<Box>, Fuse<Feature>];
    } = {};

    #fuseOptions = {
        includeScore: true,
        fieldNormWeight: 0.8,
        useExtendedSearch: true,
        keys: [
            {
                name: "fourcc",
                weight: 100
            },
            {
                name: "description",
                weight: 40
            },
            {
                name: "type",
                weight: 30
            },
            {
                name: "registered_type",
                weight: 30
            },
            { name: "spec" },
            { name: "syntax" }
        ]
    };

    #searchOptions = {
        querySearchAttributes: ["fourcc", "description", "syntax"]
    };

    /**
     * Initialize the search instance by
     * - Loading the database
     * - Loading the files
     * - Creating the default fuse instance
     */
    async init() {
        this.#database = await Database.getInstance();
        this.#files = (await import("@data/files.json").then((module) => module.default)) as Files;
        await this.getFuse();
    }

    /**
     * Get the search instance
     * @param reset - Reset the search instance
     */
    static async getInstance(reset = false) {
        if (!Search.instance || reset) {
            const instance = new Search();
            await instance.init();
            Search.instance = instance;
        }
        return Search.instance;
    }

    /**
     * Getter for the filters
     * This will group the filters by type and return a unique list of filters
     */
    get filters() {
        const groupedFilters = this.#filters.reduce((acc: { [type: string]: Filter[] }, filter) => {
            if (filter.value === "") return acc;
            if (!acc[filter.type]) acc[filter.type] = [];
            acc[filter.type].push(filter);
            return acc;
        }, {});

        // Get unique filters
        const uniqueFilters = Object.values(groupedFilters)
            .map((filters) => {
                if (filters.length === 1) {
                    return {
                        [filters[0].type]: filters[0].value
                    };
                }
                if (filters.length > 1) {
                    return {
                        [filters[0].type]: filters.map((filter) => filter.value).join("|")
                    };
                }
                return null;
            })
            .flatMap((filter) => (filter ? [filter] : []));

        return uniqueFilters;
    }

    /**
     * Getter for the dictionary from the database
     */
    get dictionary() {
        return this.#database.dictionary;
    }

    /**
     * Returns the cached fuse instance if current filter state is same
     * Otherwise it will update the database and create new fuse instances (box and feature)
     */
    async getFuse() {
        if (this.#currentHash !== this.searchStateHash()) {
            this.#currentHash = this.searchStateHash();

            // We need to update database instance
            // It needs container filter to recreate boxes, dictionary, possible hierarchy list
            try {
                await this.#database.updateDatabase(this.filters);
            } catch (error) {
                console.error(error);
            }

            // Check if we have a cached version of the fuse instance
            const cachedFuse = this.#fuseCache[this.#currentHash];

            if (cachedFuse) {
                this.#fuses = cachedFuse;
            } else {
                // Create new fuse instances
                this.#fuses = [
                    new Fuse(this.#database.boxes, this.#fuseOptions),
                    new Fuse(
                        Object.values(this.#files.feature_file_map).map((feature) => ({
                            name: feature.key,
                            description: feature.description,
                            spec: feature.spec
                        })),
                        {
                            ...this.#fuseOptions,
                            keys: ["name", "description", "spec"]
                        }
                    )
                ];

                // Cache the fuse instance
                this.#fuseCache[this.#currentHash] = this.#fuses;
            }
        }
        return this.#fuses;
    }

    /**
     * This hash is used to identify the current database after container filter has been applied
     * For that reason we only care about the container filter
     */
    searchStateHash() {
        return hash({
            filters: Object.values(this.filters).filter((filter) => filter?.container)
        });
    }

    /**
     * This is actually an indirect way to update the database
     */
    async flushFilters(filters: Filter[]) {
        this.#filters = filters;
        await this.getFuse();
    }

    /**
     * Refinement process consists of several features:
     * - Search files matching the boxes and features
     * - Add match count to boxes and features
     * - Clean the resulting files and construct a match list for each file
     * @param boxes - List of boxes to refine
     * @param features - List of features to refine
     * @param first - If this is the first refinement, it is used to exclude items based on score
     */
    refine(
        boxes: SearchResultRefined<Box>[],
        features: SearchResultRefined<Feature>[],
        first: boolean = false
    ): {
        boxes: SearchResultRefined<Box>[];
        features: SearchResultRefined<Feature>[];
        files: FileSearchResult[];
    } {
        // Create a map for boxes and features
        const boxMap = new Map<string, SearchResultRefined<Box>>(
            boxes.map((box, index) => {
                return [
                    `${box.item.fourcc}:${box.item.type}`,
                    {
                        ...box,
                        refIndex: index
                    }
                ];
            })
        );
        const featureMap = new Map<string, SearchResultRefined<Feature>>(
            features.map((feature, index) => {
                return [
                    feature.item.name,
                    {
                        ...feature,
                        refIndex: index
                    }
                ];
            })
        );
        const fileMap = new Map<string, FileSearchResult>();

        const files = this.#database
            .getMatchingFilesByFeature(features)
            .concat(this.#database.getMatchingFilesByBox(boxes));

        // Go through the matches and create a map of boxes and features
        files.forEach((file) => {
            file.matches.forEach((match) => {
                const { type, value } = match;

                if (type === "box") {
                    let existing = boxes.find(
                        (box) => `${box.item.fourcc}:${box.item.type}` === value
                    );

                    if (!existing || !boxMap.has(value))
                        throw new Error(`Sanity Check failed: Box ${value} not found in box list`);

                    if (boxMap.has(value)) {
                        existing = boxMap.get(value);
                        if (existing) existing.count += 1;
                    }
                } else if (type === "feature") {
                    let existing = features.find((feature) => feature.item.name === value);

                    if (!existing || !featureMap.has(value))
                        throw new Error(
                            `Sanity Check failed: Feature ${value} not found in feature list`
                        );

                    if (featureMap.has(value)) {
                        existing = featureMap.get(value);
                        if (existing) existing.count += 1;
                    }
                }
            });
        });

        // Merge matches of duplicate files (by md5)
        files.forEach((file) => {
            const existing = fileMap.get(file.item.md5);
            if (existing) existing.matches = existing.matches.concat(file.matches);
            else fileMap.set(file.item.md5, file);
        });

        // Convert to array
        const boxesArray = Array.from(boxMap.values());
        const featuresArray = Array.from(featureMap.values());
        let filesArray = Array.from(fileMap.values());

        // Remove duplicate matches
        filesArray = filesArray.map((file) => ({
            ...file,
            matches: file.matches.filter(
                (match, index, self) =>
                    self.findIndex((m) => m.type === match.type && m.value === match.value) ===
                    index
            )
        }));

        // Sort files by alphabetical order
        filesArray = filesArray.sort((a, b) =>
            a.item.rel_filepath.localeCompare(b.item.rel_filepath)
        );

        if (!first)
            return {
                boxes: boxesArray,
                features: featuresArray,
                files: filesArray
            };

        // On first refinement, we should aim to have the best results of boxes and features individually
        let reducedFeatures = featuresArray;
        let reducedBoxes = boxesArray;

        if (boxesArray.length > 1)
            reducedBoxes = boxesArray.map((box) => ({
                ...box,
                exclude: box.score > 0.1 || box.actualScore > 0.2
            }));

        if (featuresArray.length > 1)
            reducedFeatures = featuresArray.map((feature) => ({
                ...feature,
                exclude: feature.score > 0.1 || feature.actualScore > 0.2
            }));

        return this.refine(reducedBoxes, reducedFeatures);
    }

    /**
     * Search the database with the given query and filters
     * It will construct a query for boxes and features separately
     * Then it will search the database with the constructed queries
     * It will return the results with normalized scores and filters out low relevance results
     * @param query - Search query
     * @param filters - List of filters to apply
     */
    async search(query: string, filters?: Filter[]) {
        if (filters) this.#filters = filters;

        // This is for searching multiple attributes with the same query with OR condition
        const attributes = query !== "" && [
            {
                $or: this.#searchOptions.querySearchAttributes.map((attr) => ({
                    [attr]: query
                }))
            }
        ];

        // This adds the filters as an AND condition
        const constructedQueryForBox: Fuse.Expression = {
            $and: [...this.filters.filter((filter) => !filter?.container), ...(attributes || [])]
        };

        // This adds the spec filter as an AND condition
        const spec = this.filters.find((filter) => filter?.spec)?.spec;
        const constructedQueryForFeature: Fuse.Expression = {
            $and: [
                ...(query
                    ? [
                          {
                              $or: [
                                  {
                                      name: query
                                  },
                                  {
                                      description: query
                                  }
                              ]
                          }
                      ]
                    : []),
                ...(spec ? [{ spec }] : [])
            ]
        };

        let boxes: SearchResult<Box>[] = [];
        let features: SearchResult<Feature>[] = [];
        try {
            const [boxFuse, featureFuse] = await this.getFuse();

            // If the query is empty but we have container filter, we need to return all the boxes
            if (
                query === "" &&
                this.filters.length > 0 &&
                this.filters.every((filter) => filter?.container)
            ) {
                boxes = this.#database.boxes.map((box, index) => ({
                    item: box,
                    refIndex: index,
                    actualScore: 0,
                    score: 0
                }));
                features = Object.values(this.#files.feature_file_map).map((feature, index) => ({
                    item: {
                        name: feature.key,
                        description: feature.description,
                        spec: feature.spec
                    },
                    refIndex: index,
                    actualScore: 0,
                    score: 0
                }));
            } else {
                boxes = boxFuse.search(constructedQueryForBox) as SearchResult<Box>[];
                features = featureFuse.search(
                    constructedQueryForFeature
                ) as SearchResult<Feature>[];
            }
        } catch (e) {
            console.error(e);
        }

        // Special case: remove 'file' from the box list
        boxes = boxes.filter((box) => box.item.fourcc !== "file");

        // Normalize scores
        boxes = normalizeResultScores(boxes, query === "" ? 1.0 : 0.2);
        features = normalizeResultScores(features, query === "" ? 1.0 : 0.2);

        // Filter out results with low scores
        boxes = boxes.filter((result) => result.score <= 0.2);
        features = features.filter((result) => result.score <= 0.2);

        return { boxes, features };
    }
}

export default Search;
