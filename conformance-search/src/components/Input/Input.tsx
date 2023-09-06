import React from "react";
import { Filter } from "@/types";
import { ContainerInput, SelectInput } from "./variants";

export default function Input({
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
    // If the filter is a registered_type or spec, render as a select
    if (filter.type === "registered_type" || filter.type === "spec") {
        return <SelectInput filter={filter} index={index} updateFilter={updateFilter} />;
    }

    // If not a container, render as a normal input
    if (filter.type !== "container")
        return (
            <input
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus={filter.value !== ""}
                className="grow rounded-none bg-transparent px-3 text-sm focus:outline-none"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    updateFilter(index, (e.target as HTMLInputElement).value)
                }
                placeholder={placeholder}
                type="search"
                value={filter.value}
            />
        );

    return (
        <ContainerInput
            filter={filter}
            index={index}
            placeholder={placeholder}
            updateFilter={updateFilter}
        />
    );
}
