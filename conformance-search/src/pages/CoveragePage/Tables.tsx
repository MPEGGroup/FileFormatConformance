import React from "react";
import Fuse from "fuse.js";
import { CoverageResults } from "@/types";
import HighlightBox from "./HighlightBox";
import ResponsiveVirtualizedList from "./ResponsiveVirtualizedList";

function BoxRow({
    data,
    index,
    style
}: {
    data: Fuse.FuseResult<string>[];
    index: number;
    style: React.CSSProperties;
}) {
    const { item } = data[index];
    return (
        <li
            key={item}
            className="flex items-center border-x-1 border-b-1 border-black bg-white first:border-t-1"
            style={style}
        >
            <span className="px-2">
                <HighlightBox>{item}</HighlightBox>
            </span>
        </li>
    );
}

function FeatureRow({
    data,
    index,
    style
}: {
    data: Fuse.FuseResult<string>[];
    index: number;
    style: React.CSSProperties;
}) {
    const { item } = data[index];
    return (
        <li
            key={item}
            className="block border-x-1 border-b-1 border-black bg-white first:border-t-1"
            style={style}
        >
            <span className="table w-full table-fixed items-center">
                <span className="table-cell truncate px-2 font-bold">{item}</span>
            </span>
        </li>
    );
}

export default function Tables({ results }: { results: CoverageResults }) {
    return (
        <>
            {["covered", "not_covered", "under_consideration"].map((type) => {
                if (!results) return null;
                if (results.boxes[type].length === 0 && results.features[type].length === 0)
                    return null;
                return (
                    <div
                        key={type}
                        className="flex flex-1 flex-col items-stretch justify-start lg:h-full"
                    >
                        <span className="sticky top-0 z-10 bg-black text-center font-bold capitalize text-white">
                            {type.replace("_", " ")} (
                            {results.boxes[type].length + results.features[type].length})
                        </span>
                        {results.boxes[type].length > 0 && (
                            <ResponsiveVirtualizedList
                                itemComponent={BoxRow}
                                items={results.boxes[type]}
                            >
                                <span className="sticky top-6 z-10 bg-red-500 text-center font-bold text-white">
                                    Boxes ({results.boxes[type].length})
                                </span>
                            </ResponsiveVirtualizedList>
                        )}
                        {results.features[type].length > 0 && (
                            <ResponsiveVirtualizedList
                                itemComponent={FeatureRow}
                                items={results.features[type]}
                            >
                                <span className="sticky top-6 z-10 bg-blue-500 text-center font-bold text-white">
                                    Features ({results.features[type].length})
                                </span>
                            </ResponsiveVirtualizedList>
                        )}
                    </div>
                );
            })}
        </>
    );
}
