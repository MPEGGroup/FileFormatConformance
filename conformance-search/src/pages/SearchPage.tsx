import { Tab, Tabs } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useMedia } from "react-use";
import {
    BoxComponent,
    CoverageSummary,
    FeatureComponent,
    FileComponent,
    ListComponent,
    NavigationBar,
    SearchComponent
} from "@/components";
import RefinementContext from "@/contexts/RefinementContext";
import Search from "@/lib/search";
import { Box, Feature, FileSearchResult, SearchResult, SearchResultRefined } from "@/types";

export default function SearchPage() {
    const [tab, setTab] = useState(0);
    const [state, setState] = useState<{
        boxes: SearchResultRefined<Box>[];
        features: SearchResultRefined<Feature>[];
        files: FileSearchResult[];
    }>();

    // When a result is received, refine the search results
    const onResult = async (inBoxes: SearchResult<Box>[], inFeatures: SearchResult<Feature>[]) => {
        const search = await Search.getInstance();
        setState(
            search.refine(
                inBoxes.map((box) => ({
                    ...box,
                    exclude: false,
                    count: 0,
                    type: "box"
                })),
                inFeatures.map((feature) => ({
                    ...feature,
                    exclude: false,
                    count: 0,
                    type: "feature"
                })),
                true
            )
        );
    };

    // Combine boxes and features into a single array and sort them
    const combinedResults = [...(state?.boxes || []), ...(state?.features || [])].sort(
        (a: SearchResultRefined<Box | Feature>, b: SearchResultRefined<Box | Feature>) => {
            // Follow this order:
            // 1. count: 0 is always last
            // 2. Lowest score is first
            // 3. Highest count is first
            // 4. excluded: false comes first
            // 5. Alphabetical order
            if (a.count === 0 && b.count !== 0) return 1;
            if (a.count !== 0 && b.count === 0) return -1;
            if (a.score < b.score) return -1;
            if (a.score > b.score) return 1;
            if (a.count > b.count) return -1;
            if (a.count < b.count) return 1;
            if (a.exclude && !b.exclude) return 1;
            if (!a.exclude && b.exclude) return -1;
            if ("fourcc" in a.item && "fourcc" in b.item)
                return (a.item as Box).fourcc.localeCompare((b.item as Box).fourcc);
            if ("name" in a.item && "name" in b.item)
                return (a.item as Feature).name.localeCompare((b.item as Feature).name);
            return 0;
        }
    );

    // Refine handler for the refinement context
    const refineHandler = useCallback(
        async (result: SearchResultRefined<Box | Feature>, type: "box" | "feature") => {
            if (!state) return;
            const search = await Search.getInstance();

            // Find and replace the result
            if (type === "box") state.boxes[result.refIndex] = result as SearchResultRefined<Box>;
            else state.features[result.refIndex] = result as SearchResultRefined<Feature>;

            setState(search.refine(state.boxes, state.features));
        },
        [state]
    );

    // If screen is smaller than 700px, then #root should have height: auto
    const mobileH = useMedia("(max-height: 800px)");
    const mobileW = useMedia("(max-width: 800px)");
    useEffect(() => {
        if (mobileH) document.getElementById("root")?.style.setProperty("height", "auto");
        else document.getElementById("root")?.style.setProperty("height", "100vh");
    }, [mobileH]);

    return (
        <RefinementContext.Provider value={refineHandler}>
            <NavigationBar />
            <div className="flex min-h-0 flex-[1] flex-col items-center gap-6 p-2 xs:p-6">
                <SearchComponent
                    className="z-20 flex w-full max-w-2xl select-none flex-col p-2"
                    onResult={onResult}
                />
                {combinedResults.length > 0 && mobileW && (
                    <Tabs
                        classes={{
                            root: "w-full shrink-0 max-w-7xl -mb-4 p-2"
                        }}
                        onChange={(_, value) => setTab(value)}
                        value={tab}
                        variant="fullWidth"
                    >
                        <Tab label="Boxes &amp; Features" />
                        <Tab label="Files" />
                    </Tabs>
                )}
                <div className="flex min-h-0 w-full max-w-7xl grow flex-row gap-6 overflow-y-auto">
                    {state && combinedResults.length > 0 && (
                        <>
                            {(tab === 0 || !mobileW) && (
                                <ListComponent className="flex-[1]">
                                    {combinedResults.map(
                                        (result: SearchResultRefined<Box | Feature>) => {
                                            if (result.type === "box")
                                                return (
                                                    <BoxComponent
                                                        key={`${(result.item as Box).type}:${
                                                            (result.item as Box).fourcc
                                                        }`}
                                                        box={result as SearchResultRefined<Box>}
                                                    />
                                                );
                                            return (
                                                <FeatureComponent
                                                    key={(result.item as Feature).name}
                                                    feature={result as SearchResultRefined<Feature>}
                                                />
                                            );
                                        }
                                    )}
                                </ListComponent>
                            )}
                            {(tab === 1 || !mobileW) && (
                                <ListComponent className="flex-[1]">
                                    {state?.files.map((file: FileSearchResult) => (
                                        <FileComponent key={file.item.rel_filepath} file={file} />
                                    ))}
                                </ListComponent>
                            )}
                        </>
                    )}
                    {(!state || combinedResults.length === 0) && (
                        <CoverageSummary className="flex-[1]" />
                    )}
                </div>
            </div>
        </RefinementContext.Provider>
    );
}
