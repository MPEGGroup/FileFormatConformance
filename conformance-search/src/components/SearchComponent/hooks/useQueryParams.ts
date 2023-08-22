import { useEffect, useState } from "react";
import { Filter } from "@/types";

type QueryParams = {
    query: string;
    filters: Filter[];
};

export default function useQueryParams(): [
    QueryParams,
    (query?: string, filters?: Filter[]) => void
] {
    const [params, setParams] = useState<QueryParams>({
        query: "",
        filters: []
    });

    const encodeFilters = (filters: Filter[]): string => {
        return filters
            .reduce((acc: string[], filter) => {
                const { type, value } = filter;
                return acc.concat([`${type}:${value}`]);
            }, [])
            .join(",");
    };

    const decodeFilters = (filters: string): Filter[] => {
        return filters
            .split(",")
            .map((filter) => {
                const [type, value] = filter.split(":");
                return { type, value };
            })
            .filter((filter) => filter.type && filter.value);
    };

    // Load the search state from the URL
    useEffect(() => {
        if ("URLSearchParams" in window) {
            const newParams: QueryParams = {
                query: "",
                filters: []
            };

            const rawParams = new URLSearchParams(window.location.search);

            // Query
            newParams.query = rawParams.get("query") || "";

            // Filters
            const filters = rawParams.get("filters") || "";
            newParams.filters = decodeFilters(filters);

            // Update state
            setParams(newParams);
        }
    }, []);

    const setQuery = (query?: string, filters?: Filter[]) => {
        setParams((prev) => ({
            query: query || prev.query,
            filters: filters || prev.filters
        }));

        // Update URL
        if ("URLSearchParams" in window) {
            const rawParams = new URLSearchParams(window.location.search);

            // Query
            rawParams.delete("query");
            if (query) rawParams.set("query", query);

            // Filters
            rawParams.delete("filters");
            if (filters && filters.length > 0) rawParams.set("filters", encodeFilters(filters));

            const base = window.location.pathname;

            // If no query or filters, remove them from the URL
            if (rawParams.toString() === "") {
                window.history.replaceState({}, "", base);
            } else window.history.replaceState({}, "", `${base}?${rawParams.toString()}`);
        }
    };

    return [params, setQuery];
}
