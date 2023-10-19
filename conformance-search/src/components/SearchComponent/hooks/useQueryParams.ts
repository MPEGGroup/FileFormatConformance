import { useEffect, useState } from "react";
import { Filter } from "@/types";
import { useLocation } from "react-router-dom";

type QueryParams = {
    query: string;
    filters: Filter[];
};

export default function useQueryParams(): [
    QueryParams,
    (query?: string, filters?: Filter[]) => void
] {
    const { state } = useLocation();
    const [params, setParams] = useState<QueryParams>({
        query: "",
        filters: []
    });

    const encodeFilters = (filters: Filter[]): string => {
        return filters
            .filter((filter) => filter.value !== "")
            .reduce((acc: string[], filter) => {
                const { type, value } = filter;
                return acc.concat([`${type}:${value}`]);
            }, [])
            .join(",");
    };

    const decodeFilters = (filters: string | null): Filter[] => {
        if (!filters) return [];
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
        // Check the state
        let { query, filters } = state || {};

        // If no state in history, check the URL
        if (window.location.search !== "") {
            const rawParams = new URLSearchParams(window.location.search);
            query ||= rawParams.get("query");
            filters ||= decodeFilters(rawParams.get("filters"));
        }

        // Update the state
        setParams((prev) => ({
            query: query || prev.query,
            filters: filters || prev.filters
        }));
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
            if (filters && filters.length > 0 && filters.some((filter) => filter.value !== ""))
                rawParams.set("filters", encodeFilters(filters));

            const base = window.location.pathname;

            // If no query or filters, remove them from the URL
            if (rawParams.toString() === "") {
                window.history.replaceState({}, "", base);
            } else window.history.replaceState({}, "", `${base}?${rawParams.toString()}`);
        }
    };

    return [params, setQuery];
}
