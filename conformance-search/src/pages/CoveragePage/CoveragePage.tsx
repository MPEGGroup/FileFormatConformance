import { Slider } from "@mui/material";
import Fuse from "fuse.js";
import React, { useEffect, useMemo, useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { useAsync } from "react-use";
import { Coverage } from "@/types/json";
import { NavigationBar } from "@/components";
import { CoverageResults } from "@/types";
import useMobile from "./useMobile";
import Tables from "./Tables";
import CoverageHeader from "./CoverageHeader";

export default function CoveragePage() {
    const mobile = useMobile();
    const [processedCoverageStats, setProcessedCoverageStats] = useState<Coverage>();
    const [search, setSearch] = useState("");
    const [depth, setDepth] = useState(1);
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
        return (await import("../../../data/coverage.json").then(
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

        if (search === "") {
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
            covered: fuses.boxes.covered.search(search),
            not_covered: fuses.boxes.not_covered.search(search),
            under_consideration: fuses.boxes.under_consideration.search(search)
        };
        const features = {
            covered: fuses.features.covered.search(search),
            not_covered: fuses.features.not_covered.search(search),
            under_consideration: fuses.features.under_consideration.search(search)
        };

        return { boxes, features };
    }, [fuses, processedCoverageStats, search]);

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
                <CoverageHeader
                    coverageStats={coverageStats}
                    depth={depth}
                    processedCoverageStats={processedCoverageStats}
                />
                <div className="flex w-full flex-col items-start gap-2">
                    <input
                        className="w-full rounded border-1 bg-transparent px-3 py-2 shadow-md"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSearch((e.target as HTMLInputElement).value)
                        }
                        placeholder="Start by typing a feature or box fourcc..."
                        type="search"
                        value={search}
                    />
                    <span className="ml-1 text-xs text-gray-600">
                        <span className="font-semibold">Note:</span> You can use unix-style search
                        operators. For example, type <code className="basic">avcC$</code> to search
                        for features/boxes ending in <code className="basic">avcC</code>.
                    </span>
                    <div className="flex w-full flex-row items-center gap-4">
                        <span className="whitespace-nowrap text-xl font-bold">Depth Setting</span>
                        <Slider
                            className="mr-1 grow lg:grow-0 lg:basis-1/3"
                            defaultValue={1}
                            max={maxDepth}
                            min={1}
                            onChange={(_, value) => setDepth(value as number)}
                            step={1}
                            valueLabelDisplay="auto"
                        />
                    </div>
                </div>
                <div className="flex w-full grow flex-col items-stretch gap-8 overflow-auto lg:flex-row lg:items-start">
                    <Tables results={results} />
                </div>
            </div>
        </>
    );
}
