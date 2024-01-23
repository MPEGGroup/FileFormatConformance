import Fuse from "fuse.js";
import React, { forwardRef, useEffect, useState } from "react";
import { useEvent, useIntersection } from "react-use";
import { normalizeResultScores } from "@/utils";
import { Chip } from "@/components";
import { FuseSearchWithScore } from "@/types";

function Dropdown(
    {
        query,
        fuse,
        parseValue
    }: {
        query: string;
        fuse: {
            fourccs: Fuse<string>;
            types: Fuse<string>;
        };
        parseValue: (value: string) => Promise<void>;
    },
    ref: React.ForwardedRef<HTMLDivElement>
) {
    const [activeIndex, setActiveIndex] = useState(-1);
    const [results, setResults] = useState<{
        fourccs: FuseSearchWithScore<string>[];
        types: FuseSearchWithScore<string>[];
    }>({
        fourccs: [],
        types: []
    });

    // Check if the dropdown is visible
    const intersection = useIntersection(ref as React.MutableRefObject<HTMLDivElement>, {
        root: null,
        rootMargin: "0px",
        threshold: 0.1
    });
    const isVisible = !!intersection?.isIntersecting;

    // Submit the value
    const submit = async (item: string, type: string) => {
        if (type === "fourcc") await parseValue(`$${item}`);
        else await parseValue(`#${item}`);
    };

    // Capture keydown events
    const onKeyDown = async (e: KeyboardEvent) => {
        if (!isVisible && process.env.NODE_ENV === "production") return;

        if (["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) e.preventDefault();
        else return;

        // Flatten results
        const flattenedResults = [
            ...results.fourccs.map((result) => ({
                type: "fourcc",
                value: result.item
            })),
            ...results.types.map((result) => ({
                type: "type",
                value: result.item
            }))
        ];

        let newActiveIndex = activeIndex;
        if (e.key === "ArrowDown") {
            newActiveIndex = Math.min(flattenedResults.length - 1, newActiveIndex + 1);
        } else if (e.key === "ArrowUp") {
            newActiveIndex = Math.max(-1, newActiveIndex - 1);
        } else if (e.key === "Enter") {
            const result = flattenedResults[newActiveIndex];
            if (!result) return;

            await submit(result.value, result.type);
        }
        setActiveIndex(newActiveIndex);
    };
    useEvent("keydown", onKeyDown);

    // Update results when the query changes
    useEffect(() => {
        if (!fuse || !fuse.fourccs || !fuse.types) return;

        setResults({
            fourccs: normalizeResultScores(
                fuse.fourccs.search(query, {
                    limit: 5
                }) as FuseSearchWithScore<string>[]
            ),
            types: normalizeResultScores(
                fuse.types.search(query, {
                    limit: 5
                }) as FuseSearchWithScore<string>[]
            )
        });
    }, [query, fuse]);

    // Reset active index when the dropdown is hidden
    useEffect(() => {
        if (!isVisible) setActiveIndex(-1);
    }, [isVisible]);

    // Function to render a dropdown section
    const dropdownSection = ({
        type,
        _results,
        previousLength = 0
    }: {
        type: string;
        _results: FuseSearchWithScore<string>[];
        previousLength?: number;
    }) => {
        if (_results.length === 0) return undefined;

        // Check how many results were there
        let localActiveIndex = activeIndex;
        if (activeIndex >= previousLength) localActiveIndex = activeIndex - previousLength;
        else localActiveIndex = -1;

        return (
            <div>
                <h2 className="border-b-1 border-black text-sm font-bold uppercase">{type}</h2>
                <ul className="mt-1 flex flex-col items-start gap-1">
                    {_results.map((result, index) => (
                        <li key={result.item} data-testid="dropdown-item">
                            <Chip
                                active={index === localActiveIndex}
                                onClick={async () => submit(result.item, type.slice(0, -1))}
                                score={result.score}
                                type={type.slice(0, -1)}
                            >
                                {result.item}
                            </Chip>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div
            ref={ref}
            className="mt-[1.5px] flex flex-col gap-3 bg-white p-3 shadow-lg outline outline-1 outline-gray-200 empty:hidden"
            data-testid="dropdown"
        >
            {dropdownSection({
                type: "fourccs",
                _results: results.fourccs
            })}
            {dropdownSection({
                type: "types",
                _results: results.types,
                previousLength: results.fourccs.length
            })}
        </div>
    );
}

export default forwardRef(Dropdown);
