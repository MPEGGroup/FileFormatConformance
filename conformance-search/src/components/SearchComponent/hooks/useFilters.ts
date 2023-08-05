import { useState } from "react";
import { useAsync } from "react-use";
import Search from "@/lib/search";
import { Filter } from "@/types";

const useFilters = (): [
    Filter[],
    {
        addFilter: () => void;
        removeFilter: (index: number) => Promise<void>;
        updateFilter: (index: number, value?: string, type?: string) => Promise<void>;
        resetFilters: (filters?: Filter[]) => void;
    }
] => {
    const [filters, setFilters] = useState<Filter[]>([]);
    const { value: search } = useAsync(async () => {
        return Search.getInstance();
    }, []);

    const addFilter = () => {
        setFilters((prevFilters: Filter[]) => [
            ...prevFilters,
            {
                type: prevFilters.find((f) => f.type === "container") ? "type" : "container",
                value: ""
            }
        ]);
    };

    const removeFilter = async (index: number) => {
        if (!search) return;

        const newFilters = [...filters];
        newFilters.splice(index, 1);
        setFilters(newFilters);

        // Flush the new filters
        await search.flushFilters(newFilters);
    };

    const updateFilter = async (index: number, value?: string, type?: string) => {
        if (!search) return;

        const newFilters = [...filters];
        newFilters[index] = {
            type: type !== undefined ? type : newFilters[index].type,
            // eslint-disable-next-line no-nested-ternary
            value: type !== undefined ? "" : value !== undefined ? value : ""
        };

        // Flush the new filters
        setFilters(newFilters);
        await search.flushFilters(newFilters);
    };

    const resetFilters = (newFilters?: Filter[]) => {
        setFilters(newFilters || []);
    };

    return [
        filters,
        {
            addFilter,
            removeFilter,
            updateFilter,
            resetFilters
        }
    ];
};

export default useFilters;
