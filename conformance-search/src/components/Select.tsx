import { Popper } from "@mui/material";
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
    const ref = useRef<HTMLUListElement>(null);
    const refContainer = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);

    useClickAway(
        refContainer,
        (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (ref.current?.contains(target)) return;
            setOpen(false);
        },
        ["mouseup"]
    );

    // Get the longest option
    const longestOption = Math.max(
        16,
        Object.values(items)
            .map((item) => item.name)
            .reduce((a, b) => (a.length > b.length ? a : b)).length
    );

    return (
        <div className="relative" style={{ minWidth: `${longestOption * 0.7}rem` }}>
            <div
                ref={refContainer}
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
            <Popper anchorEl={refContainer.current} className="z-20" open={open} placement="bottom">
                <div
                    className="mt-[1.5px] bg-white shadow-lg outline outline-1 outline-gray-200"
                    style={{
                        minWidth: `calc(${longestOption * 0.7}rem - 1px)`
                    }}
                >
                    <ul ref={ref}>
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
            </Popper>
        </div>
    );
}

Select.defaultProps = {
    className: ""
};
