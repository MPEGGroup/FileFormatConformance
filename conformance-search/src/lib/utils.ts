import { Filter, FuseSearchWithScore } from "@/types";
import { Hierarchy } from "@/types/json";

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

/**
 * Normalize the scores of the given results.
 * @param results - the results to normalize
 */
function normalizeResultScores<T>(results: FuseSearchWithScore<T>[], threshold = 0.2) {
    let normalizedResults = results;
    if (results.length === 1) {
        normalizedResults = results.map((result) => ({
            ...result,
            actualScore: result.score,
            score: 0
        }));
    } else if (results.length > 1) {
        const minScore = results[0].score;
        const maxScore = results[results.length - 1].score;

        if (minScore === maxScore) {
            normalizedResults = results.map((result) => ({
                ...result,
                actualScore: result.score,
                score: minScore < threshold ? 0 : 1
            }));
        } else {
            normalizedResults = results.map((result) => ({
                ...result,
                actualScore: result.score,
                score: ((result.score || 0) - minScore) / (maxScore - minScore)
            }));
        }
    }

    return normalizedResults;
}

export { collectMatchingBranches, crawlBranches, normalizeResultScores };
