import clsx from "clsx";
import Fuse from "fuse.js";
import React, { useEffect, useRef, useState } from "react";
import { useClickAway } from "react-use";
import Search from "@/lib/search";
import { Chip } from "@/components";
import { Filter } from "@/types";
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

    // Dropdown menu
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);

    const handleClickOutside = () => {
        setOpen(false);
    };

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

    useClickAway(dropdownRef, handleClickOutside);

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
                    "flex max-w-[250px] flex-row flex-nowrap overflow-scroll shadow-sm",
                    parsed.length > 0 && "mr-2"
                )}
            >
                {parsed.map((value, i) => (
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
                ))}
            </div>
            <div ref={dropdownRef} className="relative flex h-full grow flex-row">
                <input
                    className="w-full focus:outline-none"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setQuery((e.target as HTMLInputElement).value)
                    }
                    onClick={() => setOpen(true)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    type="text"
                    value={query}
                />
                {fuse && (
                    <Dropdown
                        fuse={fuse}
                        hidden={!open || query === ""}
                        parseValue={parseValue}
                        query={query}
                    />
                )}
            </div>
        </div>
    );
}
