import clsx from "clsx";
import { useRef, useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import { useClickAway } from "react-use";

export default function Select({
    className,
    items,
    value,
    onChange
}: {
    className?: string;
    items: {
        [key: string]: { name: string };
    };
    value: string;
    onChange: (newValue: string) => void;
}) {
    const ref = useRef(null);
    const [open, setOpen] = useState(false);

    const handleClickOutside = () => {
        setOpen(false);
    };

    useClickAway(ref, handleClickOutside);

    // Get the longest option
    const longestOption = Math.max(
        16,
        Object.values(items)
            .map((item) => item.name)
            .reduce((a, b) => (a.length > b.length ? a : b)).length
    );

    return (
        <div ref={ref} className="relative" style={{ width: `${longestOption * 0.7}rem` }}>
            <div
                className={clsx(
                    "flex h-full cursor-pointer flex-row items-center justify-evenly whitespace-nowrap pl-4 pr-12 text-sm",
                    className
                )}
                onClick={() => setOpen(!open)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        setOpen(!open);
                    }
                }}
                role="menu"
                tabIndex={0}
            >
                <span>{value === "" ? "Select one..." : items[value].name}</span>
                <IoChevronDown className="absolute right-4" />
            </div>
            {open && (
                <div className="absolute bottom-[-1px] z-10 w-full translate-y-full bg-white shadow-lg outline outline-1 outline-gray-200">
                    <ul>
                        {value === "" && (
                            <li className="cursor-pointer px-4 py-2 text-sm transition-all duration-75 hover:bg-neutral-200">
                                Select one...
                            </li>
                        )}
                        {Object.entries(items).map(([key, item], i) => (
                            <li
                                key={key}
                                className="cursor-pointer px-4 py-2 text-sm transition-all duration-75 hover:bg-neutral-200"
                                onClick={() => {
                                    onChange(key);
                                    setOpen(false);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        onChange(key);
                                        setOpen(false);
                                    }
                                }}
                                role="menuitem"
                                tabIndex={i + 1}
                            >
                                {item.name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

Select.defaultProps = {
    className: ""
};
