import clsx from "clsx";
import React, { useRef, useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import { useClickAway } from "react-use";

export default function Drawer({
    title,
    hidden,
    children
}: {
    title: string;
    hidden?: boolean;
    children?: React.JSX.Element | React.JSX.Element[];
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useClickAway(
        ref,
        (e: MouseEvent) => {
            // Get target test id
            const target = e.target as HTMLElement;
            const testId = target.getAttribute("data-testid");
            // If the target is the drawer button, ignore
            if (testId === "drawer-button") setOpen(false);
        },
        ["mouseup"]
    );

    if (hidden) return null;
    return (
        <div ref={ref} className="sticky">
            <div
                className={clsx("sticky top-0 border-t-1 bg-white px-3 py-1", open && "border-b-1")}
            >
                <button
                    className="flex select-none flex-row items-center gap-1.5"
                    data-testid="drawer-button"
                    onClick={() => setOpen(!open)}
                    type="button"
                >
                    <IoChevronDown
                        className={clsx(!open && "-rotate-90", "transition-all duration-100")}
                    />
                    {title}
                </button>
            </div>
            {open && children}
        </div>
    );
}

Drawer.defaultProps = {
    children: null,
    hidden: false
};
