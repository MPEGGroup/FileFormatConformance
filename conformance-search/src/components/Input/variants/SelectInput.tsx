import { Select } from "@/components";
import Database from "@/lib/database";
import { Filter } from "@/types";
import stripSpecialChars from "../helpers";

export default function SelectInput({
    filter,
    index,
    updateFilter
}: {
    filter: Filter;
    index: number;
    updateFilter: (i: number, value?: string, type?: string) => Promise<void>;
}) {
    const items = () => {
        const database = Database.getInstanceSync();
        const stype = filter.type === "registered_type" ? "registered_types" : "specs";
        const ditems = database.dictionary[stype];
        return Object.fromEntries(ditems.map((item) => [item, { name: item }]));
    };

    return (
        <Select
            items={items()}
            onChange={(value) => updateFilter(index, `="${value}"`)}
            value={stripSpecialChars(filter.value)}
        />
    );
}
