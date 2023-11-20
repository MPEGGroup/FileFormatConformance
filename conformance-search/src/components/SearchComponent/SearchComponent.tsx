import React, { useEffect, useState } from "react";

import { AiOutlineLoading } from "react-icons/ai";
import { MdAddCircle, MdClose, MdFilterAlt, MdRemoveCircle } from "react-icons/md";

import clsx from "clsx";
import { useDebounce } from "react-use";
import { Input, Select } from "@/components";
import Search, { FILTER_OPTIONS } from "@/lib/search";
import { Box, Feature, Filter, SearchResult } from "@/types";
import useFilters from "./hooks/useFilters";
import useQueryParams from "./hooks/useQueryParams";

export default function SearchComponent({
    className,
    onResult
}: {
    className?: string;
    onResult: (boxes: SearchResult<Box>[], features: SearchResult<Feature>[]) => Promise<void>;
}) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [queryParams, setQueryParams] = useQueryParams();
    const [query, setQuery] = useState("");
    const [ready, setReady] = useState(false);

    // Filters
    const [filters, { addFilter, removeFilter, updateFilter, resetFilters }] = useFilters();
    const activeFilters = filters.filter((f) => f.value !== "");

    // Load the search state from the URL
    useEffect(() => {
        if (queryParams && !ready) {
            setQuery(queryParams.query);
            resetFilters(queryParams.filters);
        }
    }, [queryParams, ready]);

    // Remove container filter if it already exists
    const getFilterOptions = (currentFilter: string) => {
        const options = { ...FILTER_OPTIONS };

        if (filters.find((f) => f.type === "container") && currentFilter !== "container")
            delete options.container;

        return options;
    };

    // Execute search
    useDebounce(
        async () => {
            const search = await Search.getInstance();
            setReady(true);

            // Update URL
            setQueryParams(query, filters);
            const { boxes, features } = await search.search(query, filters);
            await onResult(boxes, features);
            setLoading(false);
        },
        250,
        [query, filters]
    );

    // Show/hide title
    useEffect(() => {
        const newState = filters.length > 0 && open;
        setOpen(newState);

        // If open, disable scroll
        if (newState) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "auto";
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
                            className="h-16 min-w-0 grow rounded-tl-md bg-transparent px-5 text-lg only:rounded-t-md focus:outline-none disabled:bg-gray-100"
                            disabled={!ready}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                setQuery((e.target as HTMLInputElement).value);
                                setLoading(true);
                            }}
                            placeholder={!ready ? "Loading..." : "Start by typing a search term..."}
                            spellCheck="false"
                            type="text"
                            value={query}
                        />
                        {ready && !loading && (query || filters.length > 0) && (
                            <button
                                className="flex w-14 flex-col items-center justify-center"
                                onClick={() => {
                                    setQuery("");
                                    resetFilters();
                                }}
                                type="button"
                            >
                                <MdClose className="text-2xl" />
                                <span className="text-[10px] font-semibold">Reset</span>
                            </button>
                        )}

                        {(!ready || loading) && (
                            <div className="flex w-14 items-center justify-center">
                                <AiOutlineLoading className="animate-spin text-2xl" />
                            </div>
                        )}
                    </div>
                    <div className="absolute left-0 top-16 flex w-full flex-col gap-1">
                        <div className="divide-y-1 rounded-b-md border-1 border-gray-300 bg-white shadow-md">
                            {open &&
                                filters.map((filter: Filter, index: number) => (
                                    <div
                                        // eslint-disable-next-line react/no-array-index-key
                                        key={`${filter.value || filter.type}-${index}`}
                                        className="flex flex-row items-stretch divide-x-1 overflow-x-scroll px-3"
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
                                            activeFilters.length > 0 && "text-blue-400"
                                        )}
                                        onClick={() => {
                                            if (filters.length === 0) addFilter();
                                            setOpen(true);
                                        }}
                                        type="button"
                                    >
                                        <MdFilterAlt className="text-xl" />
                                        <span className="text-xs font-semibold">
                                            {activeFilters.length === 0
                                                ? "Add a filter"
                                                : `${activeFilters.length} filter${
                                                      activeFilters.length > 1 ? "s" : ""
                                                  } active, click here to edit them`}
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
