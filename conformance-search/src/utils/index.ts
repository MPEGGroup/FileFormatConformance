import { FuseSearchWithScore } from "@/types";

/**
 * Normalize the scores of the given results.
 * @param results - the results to normalize
 */
function normalizeResultScores<T>(results: FuseSearchWithScore<T>[], noQuery = false) {
    const threshold = noQuery ? 1.0 : 0.2;
    let normalizedResults = results;

    if (results.length === 1) {
        normalizedResults = results.map((result) => ({
            ...result,
            actualScore: noQuery ? 0 : result.score,
            score: 0
        }));
    } else if (results.length > 1) {
        const minScore = results[0].score;
        const maxScore = results[results.length - 1].score;

        if (minScore === maxScore) {
            normalizedResults = results.map((result) => ({
                ...result,
                actualScore: noQuery ? 0 : result.score,
                score: minScore < threshold ? 0 : 1
            }));
        } else {
            normalizedResults = results.map((result) => ({
                ...result,
                actualScore: noQuery ? 0 : result.score,
                score: ((result.score || 0) - minScore) / (maxScore - minScore)
            }));
        }
    }

    return normalizedResults;
}

/**
 * Add ordinal suffix to the given number.
 * @param num - the number to add the suffix to
 * @link https://stackoverflow.com/a/15397495
 */
function addOrdinalSuffix(num: number) {
    const dString = String(num);
    const last = +dString.slice(-2);
    if (last > 3 && last < 21) return `${num}th`;
    switch (last % 10) {
        case 1:
            return `${num}st`;
        case 2:
            return `${num}nd`;
        case 3:
            return `${num}rd`;
        default:
            return `${num}th`;
    }
}

export { normalizeResultScores, addOrdinalSuffix };
