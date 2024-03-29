import clsx from "clsx";
import Fuse from "fuse.js";
import React, { useEffect, useRef, useState } from "react";
import { useClickAway } from "react-use";
import Search from "@/lib/search";
import { Chip } from "@/components";
import { Filter } from "@/types";
import { Popper } from "@mui/material";
import Dropdown from "../Dropdown";
import stripSpecialChars from "../helpers";

export default function ContainerInput({
    filter,
    index,
    placeholder,
    updateFilter
}: {
    filter: Filter;
    index: number;
    placeholder: string;
    updateFilter: (i: number, value?: string, type?: string) => Promise<void>;
}) {
    // Parsed value
    const [search, setSearch] = useState<Search>();
    const [query, setQuery] = useState("");
    const [parsed, setParsed] = useState<string[]>([]);
    const [fuse, setFuse] = useState<{
        fourccs: Fuse<string>;
        types: Fuse<string>;
    }>();

    // Exact match
    const [exactMatch, setExactMatch] = useState(
        filter.value.length > 0 && filter.value[0] === "="
    );

    const updateFuse = (updatedSearch: Search) => {
        setFuse({
            fourccs: new Fuse(updatedSearch.dictionary.fourccs, {
                includeScore: true,
                threshold: 0.3
            }),
            types: new Fuse(updatedSearch.dictionary.types, {
                includeScore: true,
                threshold: 0.3
            })
        });
    };

    // Update the filter if exact match option changes
    useEffect(() => {
        if (!search) return;

        const init = async () => {
            await updateFilter(
                index,
                `${exactMatch && parsed.length > 0 ? "=" : ""}${parsed.join(".")}`
            );
            updateFuse(search);
        };

        init().catch(console.error);
    }, [exactMatch]);

    const parseValue = async (value: string, replace = false) => {
        // split the value into an array of strings
        const valueSplit = value.split(".").filter((v) => v !== "");
        const newParsed = [...(!replace ? parsed : []), ...valueSplit];

        setQuery("");
        await updateFilter(
            index,
            `${exactMatch && newParsed.length > 0 ? "=" : ""}${newParsed.join(".")}`
        );
        setParsed(newParsed);
    };

    // Scroll to end of chips when parsed changes
    const chipsRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!chipsRef.current) return;
        chipsRef.current.scrollLeft = chipsRef.current.scrollWidth;
    }, [parsed]);

    useEffect(() => {
        const init = async () => {
            await parseValue(stripSpecialChars(filter.value));
            setSearch(await Search.getInstance());
        };

        init().catch(console.error);
    }, []);

    useEffect(() => {
        if (!search) return;
        updateFuse(search);
    }, [parsed, search]);

    // Focus the input when the parsed value changes
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (parsed.length > 0) inputRef.current?.focus();
    }, [parsed]);

    // Dropdown menu
    const dropdownContainerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);

    // Capture delete key
    const onKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
            if (query !== "") return;
            e.preventDefault();

            // Remove the last element
            const valueSplit = stripSpecialChars(filter.value).split(".");

            if (valueSplit.length === 0) return;

            valueSplit.pop();
            await parseValue(valueSplit.join("."), true);
        }
    };

    useClickAway(
        dropdownContainerRef,
        (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (dropdownRef.current?.contains(target)) return;
            setOpen(false);
        },
        ["mouseup"]
    );

    return (
        <div className="relative flex grow flex-row items-center pl-3 text-sm">
            <div className="mr-3 flex h-full items-center justify-center">
                <button
                    className={clsx(
                        "h-full font-bold",
                        exactMatch ? "text-blue-400" : "text-gray-600"
                    )}
                    onClick={() => setExactMatch(!exactMatch)}
                    type="button"
                >
                    Exact
                </button>
            </div>
            <div
                ref={chipsRef}
                className={clsx(
                    "flex-row flex-nowrap shadow-sm",
                    parsed.length > 0 && "mr-2 flex",
                    parsed.length === 0 && "hidden"
                )}
            >
                {parsed.length > 4 && (
                    <Chip
                        alt={parsed
                            .slice(0, parsed.length - 4)
                            .map((value) => value.substring(1))
                            .join(".")}
                        className="rounded-l-sm"
                    >
                        &hellip;
                    </Chip>
                )}
                {parsed.slice(-4).map((value, idx) => {
                    const i = parsed.length > 4 ? idx + 1 : idx;
                    return (
                        <Chip
                            key={value}
                            className={clsx(
                                "rounded-l-sm",
                                i === 0 && parsed.length > 1 && "rounded-r-none",
                                i === parsed.length - 1 && "rounded-r-sm",
                                i > 0 &&
                                    parsed.length > 1 &&
                                    "rounded-none border-l-1 border-neutral-500"
                            )}
                            type={value[0] === "$" ? "fourcc" : "type"}
                        >
                            {value.substring(1)}
                        </Chip>
                    );
                })}
            </div>
            <div ref={dropdownContainerRef} className="relative flex h-full grow flex-row">
                <input
                    ref={inputRef}
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    className="w-fit bg-transparent focus:outline-none xs:w-full"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setQuery((e.target as HTMLInputElement).value);
                        setOpen(true);
                    }}
                    onClick={() => setOpen(true)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    spellCheck="false"
                    type="search"
                    value={query}
                />
                {fuse && (
                    <Popper
                        anchorEl={inputRef.current}
                        className="z-20"
                        open={open && query !== ""}
                        placement="bottom-start"
                    >
                        <Dropdown
                            ref={dropdownRef}
                            fuse={fuse}
                            parseValue={parseValue}
                            query={query}
                        />
                    </Popper>
                )}
            </div>
        </div>
    );
}
