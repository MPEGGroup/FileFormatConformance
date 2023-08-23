import { Slider } from "@mui/material";
import Fuse from "fuse.js";
import React, { useEffect, useMemo, useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { FaExpandAlt } from "react-icons/fa";
import { useAsync, useMedia, useThrottle } from "react-use";
import { Coverage } from "@/types/json";
import SpecsCovered from "@/components/SpecsCovered";
import { NavigationBar } from "@/components";
import { CoverageResults } from "@/types";

function HighlightBox({ children }: { children: string }) {
    const path = children.split(".").slice(0, -1).join(".");
    const last = children.split(".").slice(-1)[0];
    return (
        <div className="table w-full table-fixed text-sm xs:text-base">
            <span className="table-cell truncate text-left" style={{ direction: "rtl" }}>
                <span className="text-neutral-500">
                    {path.includes("*") ? (
                        <>
                            {path.split("*")[0]}
                            <FaExpandAlt className="z-0 mx-1 inline-block rotate-45 text-xl text-red-400" />
                            {path.split("*")[1]}
                        </>
                    ) : (
                        path
                    )}
                </span>
                <span className="font-bold">.{last}</span>
            </span>
        </div>
    );
}

function CoverageTables({
    coverageStats,
    processedCoverageStats,
    depth
}: {
    coverageStats: Coverage;
    processedCoverageStats: Coverage;
    depth: number;
}) {
    const download = () => {
        const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(coverageStats)
        )}`;
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `coverage-${BUILD_TIMESTAMP}.json`);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    return (
        <div className="flex w-full flex-col flex-wrap items-start gap-4 border-b-2 border-black pb-6 text-sm xs:text-base md:flex-row">
            <table className="max-md:w-full">
                <thead>
                    <tr>
                        <th colSpan={2}>File Statistics</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>Count</th>
                        <th>Attribute</th>
                    </tr>
                    <tr>
                        <td>{coverageStats.files.count}</td>
                        <td>Files submitted</td>
                    </tr>
                    <tr>
                        <td>{coverageStats.files.published_count}</td>
                        <td>Published</td>
                    </tr>
                    <tr>
                        <td>{coverageStats.files.under_consideration_count}</td>
                        <td>Under consideration</td>
                    </tr>
                </tbody>
            </table>
            <table className="max-md:w-full">
                <thead>
                    <tr>
                        <th colSpan={2}>Boxes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>Count</th>
                        <th>Attribute</th>
                    </tr>
                    <tr>
                        <td>{processedCoverageStats.path_file_map.count}</td>
                        <td>All possible box locations</td>
                    </tr>
                    <tr>
                        <td>
                            {(
                                (processedCoverageStats.lists.boxes.covered.length /
                                    (processedCoverageStats.lists.boxes.not_covered.length +
                                        processedCoverageStats.lists.boxes.covered.length)) *
                                100
                            ).toFixed(2)}
                            %
                        </td>
                        <td>Coverage percentage (depth={depth})</td>
                    </tr>
                    <tr>
                        <td>{processedCoverageStats.path_file_map.non_empty}</td>
                        <td>Unique box locations in files</td>
                    </tr>
                    <tr>
                        <td>{processedCoverageStats.path_file_map.published.count}</td>
                        <td>Published</td>
                    </tr>
                    <tr>
                        <td>{processedCoverageStats.path_file_map.under_consideration.count}</td>
                        <td>Under consideration</td>
                    </tr>
                </tbody>
            </table>
            <table className="max-md:w-full">
                <thead>
                    <tr>
                        <th colSpan={2}>User Defined Features</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>Count</th>
                        <th>Attribute</th>
                    </tr>
                    <tr>
                        <td>{processedCoverageStats.feature_file_map.count}</td>
                        <td>Total number of features</td>
                    </tr>
                    <tr>
                        <td>{processedCoverageStats.feature_file_map.published_features}</td>
                        <td>Published</td>
                    </tr>
                    <tr>
                        <td>
                            {processedCoverageStats.feature_file_map.under_consideration_features}
                        </td>
                        <td>Under consideration</td>
                    </tr>
                </tbody>
            </table>
            <div className="flex grow flex-col items-center max-md:w-full md:items-start">
                <SpecsCovered compact />
            </div>
            <button
                className="rounded-md border-1 bg-white px-3 py-2 shadow-md hover:shadow-sm"
                onClick={download}
                type="button"
            >
                Download Coverage Report
            </button>
        </div>
    );
}

function Tables({ results }: { results: CoverageResults }) {
    return (
        <>
            {["covered", "not_covered", "under_consideration"].map((type) => {
                if (!results) return null;
                if (results.boxes[type].length === 0 && results.features[type].length === 0)
                    return null;
                return (
                    <div key={type} className="flex flex-1 flex-col items-stretch justify-center">
                        <span className="sticky top-0 z-10 bg-black text-center font-bold capitalize text-white">
                            {type.replace("_", " ")} (
                            {results.boxes[type].length + results.features[type].length})
                        </span>
                        {results.boxes[type].length > 0 && (
                            <>
                                <span className="sticky top-6 z-10 bg-red-500 text-center font-bold text-white">
                                    Boxes ({results.boxes[type].length})
                                </span>
                                <table>
                                    <tbody>
                                        {results.boxes[type].map(
                                            (path: Fuse.FuseResult<string>) => {
                                                return (
                                                    <tr
                                                        key={path.item}
                                                        className="flex justify-start"
                                                    >
                                                        <td>
                                                            <HighlightBox>{path.item}</HighlightBox>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )}
                                    </tbody>
                                </table>
                            </>
                        )}
                        {results.features[type].length > 0 && (
                            <>
                                <span className="sticky top-6 z-10 bg-blue-500 text-center font-bold text-white">
                                    Features ({results.features[type].length})
                                </span>
                                <table>
                                    <tbody>
                                        {results.features[type].map(
                                            (feature: Fuse.FuseResult<string>) => {
                                                return (
                                                    <tr
                                                        key={feature.item}
                                                        className="flex justify-start"
                                                    >
                                                        <td>
                                                            <b>{feature.item}</b>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                        )}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                );
            })}
        </>
    );
}

export default function CoveragePage() {
    const mobile = useMedia("(max-height: 1000px)");
    const [processedCoverageStats, setProcessedCoverageStats] = useState<Coverage>();
    const [search, setSearch] = useState("");
    const throttledSearch = useThrottle(search, 250);
    const [depth, setDepth] = useState(3);
    const [fuses, setFuses] = useState<{
        boxes: {
            covered: Fuse<string>;
            not_covered: Fuse<string>;
            under_consideration: Fuse<string>;
        };
        features: {
            covered: Fuse<string>;
            not_covered: Fuse<string>;
            under_consideration: Fuse<string>;
        };
    }>();

    // Load coverage stats
    const { value: coverageStats } = useAsync(async () => {
        return (await import("../../data/coverage.json").then(
            (module) => module.default
        )) as Coverage;
    }, []);

    // When coverage stats are loaded or depth value is changed, process them
    useEffect(() => {
        if (!coverageStats) return undefined;

        // Process paths that they are truncated to the depth specified
        const process = (list: string[]) =>
            list.map((path) => {
                const split = path.split(".");

                if (split.length <= depth + 1) return path;

                return split
                    .slice(1, split.length + 1)
                    .reverse()
                    .slice(0, depth)
                    .concat(["*", "file"])
                    .reverse()
                    .join(".");
            });

        // Deduplicate paths and also remove similar paths
        const dedupe = (list: string[]) => {
            const set = new Set<string>();

            // Add all items to set
            list.forEach((item) => set.add(item));

            // Remove items that are similar to other items
            list.forEach((item) => {
                if (!item.includes("*")) return;
                const similar = item.replace(".*", "");
                if (set.has(similar)) set.delete(similar);
            });

            return Array.from(set);
        };

        const cs = structuredClone(coverageStats);

        cs.lists.boxes.covered = dedupe(process(cs.lists.boxes.covered));
        cs.lists.boxes.under_consideration = dedupe(process(cs.lists.boxes.under_consideration));
        cs.lists.boxes.not_covered = dedupe(process(cs.lists.boxes.not_covered)).filter(
            (path) => !cs.lists.boxes.covered.includes(path)
        );

        setProcessedCoverageStats(cs);

        // Create Fuse instances
        const fuseOptions: Fuse.IFuseOptions<string> = {
            threshold: 0.4,
            ignoreLocation: true,
            ignoreFieldNorm: true,
            useExtendedSearch: true
        };

        setFuses({
            boxes: {
                covered: new Fuse(cs.lists.boxes.covered, fuseOptions),
                not_covered: new Fuse(cs.lists.boxes.not_covered, fuseOptions),
                under_consideration: new Fuse(cs.lists.boxes.under_consideration, fuseOptions)
            },
            features: {
                covered: new Fuse(cs.lists.features.covered, fuseOptions),
                not_covered: new Fuse(cs.lists.features.not_covered, fuseOptions),
                under_consideration: new Fuse(cs.lists.features.under_consideration, fuseOptions)
            }
        });

        return () => {
            setFuses(undefined);
            setProcessedCoverageStats(undefined);
        };
    }, [coverageStats, depth]);

    // Apply current search query to all lists
    const results: CoverageResults = useMemo(() => {
        if (!fuses || !processedCoverageStats)
            return {
                boxes: {
                    covered: [],
                    not_covered: [],
                    under_consideration: []
                },
                features: {
                    covered: [],
                    not_covered: [],
                    under_consideration: []
                }
            };

        if (throttledSearch === "") {
            const wrapInFuseResult = (arr: string[]) =>
                arr.map((item) => ({ item, refIndex: 0, score: 0 }));

            return {
                boxes: {
                    covered: wrapInFuseResult(processedCoverageStats.lists.boxes.covered),
                    not_covered: wrapInFuseResult(processedCoverageStats.lists.boxes.not_covered),
                    under_consideration: wrapInFuseResult(
                        processedCoverageStats.lists.boxes.under_consideration
                    )
                },
                features: {
                    covered: wrapInFuseResult(processedCoverageStats.lists.features.covered),
                    not_covered: wrapInFuseResult(
                        processedCoverageStats.lists.features.not_covered
                    ),
                    under_consideration: wrapInFuseResult(
                        processedCoverageStats.lists.features.under_consideration
                    )
                }
            };
        }

        const boxes = {
            covered: fuses.boxes.covered.search(throttledSearch),
            not_covered: fuses.boxes.not_covered.search(throttledSearch),
            under_consideration: fuses.boxes.under_consideration.search(throttledSearch)
        };
        const features = {
            covered: fuses.features.covered.search(throttledSearch),
            not_covered: fuses.features.not_covered.search(throttledSearch),
            under_consideration: fuses.features.under_consideration.search(throttledSearch)
        };

        return { boxes, features };
    }, [fuses, processedCoverageStats, throttledSearch]);

    const maxDepth = useMemo(() => {
        let max = 0;
        if (!coverageStats) return max;
        coverageStats.lists.boxes.covered.forEach((path) => {
            const split = path.split(".");
            if (split.length > max) max = split.length;
        });
        coverageStats.lists.boxes.not_covered.forEach((path) => {
            const split = path.split(".");
            if (split.length > max) max = split.length;
        });
        coverageStats.lists.boxes.under_consideration.forEach((path) => {
            const split = path.split(".");
            if (split.length > max) max = split.length;
        });
        return max;
    }, [coverageStats]);

    // If screen is smaller than 1000px, then #root should have height: auto
    useEffect(() => {
        if (mobile) document.getElementById("root")?.style.setProperty("height", "auto");
        else document.getElementById("root")?.style.setProperty("height", "100vh");
    }, [mobile]);

    // Show a loading indicator if coverage stats are not loaded yet
    if (!processedCoverageStats || !coverageStats)
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <AiOutlineLoading className="animate-spin text-9xl" />
            </div>
        );

    return (
        <>
            <NavigationBar />
            <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-[1] flex-col items-start gap-3 p-2 xs:gap-4 xs:p-6">
                <div className="flex w-full flex-col gap-4">
                    <CoverageTables
                        coverageStats={coverageStats}
                        depth={depth}
                        processedCoverageStats={processedCoverageStats}
                    />
                </div>
                <div className="flex w-full flex-col items-start gap-2">
                    <input
                        className="w-full rounded-md border-1 border-black px-3 py-2"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSearch((e.target as HTMLInputElement).value)
                        }
                        placeholder="Start by typing a feature or box fourcc..."
                        type="text"
                        value={search}
                    />
                    <span className="ml-1 text-xs text-gray-600">
                        <span className="font-semibold">Note:</span> You can use unix-style search
                        operators. For example, type <code className="basic">avcC$</code> to search
                        for features/boxes ending in <code className="basic">avcC</code>.
                    </span>
                    <div className="flex w-full flex-row items-center gap-4">
                        <span className="text-2xl font-bold">Depth Setting</span>
                        <Slider
                            className="basis-1/2 lg:basis-1/3"
                            defaultValue={3}
                            marks
                            max={maxDepth}
                            min={1}
                            onChange={(_, value) => setDepth(value as number)}
                            step={1}
                            valueLabelDisplay="auto"
                        />
                    </div>
                </div>
                <div className="flex w-full flex-col items-stretch gap-8 overflow-auto lg:flex-row lg:items-start">
                    <Tables results={results} />
                </div>
            </div>
        </>
    );
}
