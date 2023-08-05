import React, { useEffect, useState } from "react";

import { AiOutlineLoading } from "react-icons/ai";
import { MdAddCircle, MdClose, MdFilterAlt, MdRemoveCircle } from "react-icons/md";

import clsx from "clsx";
import { useThrottle } from "react-use";
import { Input, Select } from "@/components";
import Search, { FILTER_OPTIONS } from "@/lib/search";
import { Box, Feature, Filter, SearchResult } from "@/types";
import useFilters from "./hooks/useFilters";

export default function SearchComponent({
    className,
    onResult
}: {
    className?: string;
    onResult: (boxes: SearchResult<Box>[], features: SearchResult<Feature>[]) => Promise<void>;
}) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [filters, { addFilter, removeFilter, updateFilter, resetFilters }] = useFilters();
    const [query, setQuery] = useState("");
    const [ready, setReady] = useState(false);

    // Throttle query
    const throttleQuery = useThrottle(query, 250);

    // Load the search state from the URL
    useEffect(() => {
        // Load query and filters from URL
        if ("URLSearchParams" in window) {
            const params = new URLSearchParams(window.location.search);
            const state = params.get("s");
            if (!state) return;

            try {
                const { query: queryFromURL, filters: filtersFromURL } = JSON.parse(
                    window.atob(state)
                );
                if (queryFromURL) setQuery(queryFromURL);
                if (filtersFromURL) resetFilters(filtersFromURL);
            } catch (_) {
                window.history.replaceState({}, "", window.location.pathname);
            }
        }
    }, []);

    // Remove container filter if it already exists
    const getFilterOptions = (currentFilter: string) => {
        const options = { ...FILTER_OPTIONS };

        if (filters.find((f) => f.type === "container") && currentFilter !== "container")
            delete options.container;

        return options;
    };

    // Execute search
    useEffect(() => {
        const execute = async () => {
            const search = await Search.getInstance();
            setReady(true);

            if ("URLSearchParams" in window) {
                if (query || filters.length > 0) {
                    const params = new URLSearchParams(window.location.search);
                    params.set("s", window.btoa(JSON.stringify({ query, filters })));
                    window.history.replaceState({}, "", `${window.location.pathname}?${params}`);
                } else window.history.replaceState({}, "", window.location.pathname);
            }

            setLoading(true);
            const { boxes, features } = await search.search(query, filters);
            await onResult(boxes, features);
            setLoading(false);
        };

        execute().catch(console.error);
    }, [throttleQuery, filters]);

    // Show/hide title
    useEffect(() => {
        const newState = filters.length > 0 && open;
        setOpen(newState);
    }, [open, filters]);

    return (
        <>
            <div className={className}>
                <div className="relative flex h-36 flex-col">
                    {open && (
                        <div className="absolute -top-3 flex w-full -translate-y-full flex-row items-center justify-between px-4">
                            <span className="text-3xl font-thin text-white">Edit search query</span>
                            <button onClick={() => setOpen(false)} type="button">
                                <MdClose className="text-4xl font-thin text-white" />
                            </button>
                        </div>
                    )}
                    <div className="flex flex-row items-stretch divide-x-1 rounded-t-md border-x-1 border-t-1 border-gray-300 bg-white shadow-md">
                        <input
                            autoCapitalize="off"
                            autoComplete="off"
                            autoCorrect="off"
                            className="h-16 min-w-0 grow rounded-md px-5 text-sm focus:outline-none disabled:bg-transparent"
                            data-testid="search-input"
                            disabled={!ready}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setQuery((e.target as HTMLInputElement).value)
                            }
                            placeholder={!ready ? "Loading..." : "Start by typing a search term..."}
                            spellCheck="false"
                            type="text"
                            value={query}
                        />
                        <button
                            className={clsx(
                                "flex-col items-center justify-center px-3",
                                !query && filters.length === 0 ? "hidden" : "flex"
                            )}
                            disabled={!ready || loading}
                            onClick={() => {
                                setQuery("");
                                resetFilters();
                            }}
                            type="button"
                        >
                            <MdClose className="text-2xl" />
                            <span className="text-[10px] font-semibold">Reset</span>
                        </button>
                        {!ready && (
                            <div className="flex items-center justify-center px-3">
                                <AiOutlineLoading className="animate-spin text-2xl" />
                            </div>
                        )}
                    </div>
                    <div className="absolute left-0 top-16 flex w-full flex-col gap-1">
                        <div className="divide-y-1 rounded-b-md border-1 border-gray-300 bg-white shadow-md">
                            {open &&
                                filters.map((filter: Filter, index: number) => (
                                    <div
                                        key={filter.value}
                                        className="flex flex-row items-stretch divide-x-1 px-3"
                                    >
                                        <button
                                            className="my-3 mr-3 cursor-pointer"
                                            onClick={async () => removeFilter(index)}
                                            type="button"
                                        >
                                            <MdRemoveCircle className="text-xl text-red-500" />
                                        </button>
                                        <Select
                                            items={getFilterOptions(filter.type)}
                                            onChange={(value: string) => {
                                                updateFilter(index, undefined, value);
                                            }}
                                            value={filter.type}
                                        />
                                        <Input
                                            filter={filter}
                                            index={index}
                                            placeholder={
                                                getFilterOptions(filter.type)[filter.type]
                                                    .placeholder
                                            }
                                            updateFilter={updateFilter}
                                        />
                                    </div>
                                ))}
                            {!open ? (
                                <div className="flex flex-row px-3">
                                    <button
                                        className={clsx(
                                            "my-3 flex cursor-pointer flex-row items-center gap-2",
                                            filters.length > 0 && "text-blue-400"
                                        )}
                                        onClick={() => {
                                            if (filters.length === 0) addFilter();
                                            setOpen(true);
                                        }}
                                        type="button"
                                    >
                                        <MdFilterAlt className="text-xl" />
                                        <span className="text-xs font-semibold">
                                            {filters.length === 0
                                                ? "Add a filter"
                                                : `${filters.length} filters active, click here to edit them`}
                                        </span>
                                    </button>
                                </div>
                            ) : (
                                filters.length < 6 && (
                                    <div className="flex flex-row px-3">
                                        <button
                                            className="my-3 flex cursor-pointer flex-row items-center gap-2"
                                            onClick={addFilter}
                                            type="button"
                                        >
                                            <MdAddCircle className="text-xl text-green-500" />
                                            <span className="text-xs font-semibold">
                                                Add a filter
                                            </span>
                                        </button>
                                    </div>
                                )
                            )}
                        </div>
                        <span className={clsx("ml-2 text-xs text-gray-600", open && "text-white")}>
                            <span className="font-semibold">Note:</span> You can use unix-style
                            search operators. For example, type <code className="basic">=moof</code>{" "}
                            to search exactly for <code className="basic">moof</code> box.
                        </span>
                    </div>
                </div>
            </div>
            {open && (
                <div
                    aria-label="Close search"
                    className="fixed left-0 top-0 z-10 h-screen w-screen bg-black/60 backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                        if (e.key === "Escape") setOpen(false);
                    }}
                    role="button"
                    tabIndex={0}
                />
            )}
        </>
    );
}

SearchComponent.defaultProps = {
    className: ""
};
