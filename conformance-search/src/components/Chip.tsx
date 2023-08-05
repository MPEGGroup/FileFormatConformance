import clsx from "clsx";
import React from "react";

export default function Chip({
    children,
    type,
    className,
    active,
    score,
    onClick
}: {
    children: React.JSX.Element | string;
    type: string;
    className?: string;
    active?: boolean;
    score?: number;
    onClick?: () => void;
}) {
    return (
        <button
            className={clsx(
                "px-2 py-1",
                "hover:brightness-90",
                type === "fourcc" ? "bg-blue-200" : "bg-rose-200",
                score && score > 0.1 && "opacity-70",
                active && "border-2 border-black",
                className
            )}
            onClick={onClick}
            type="button"
        >
            <span>{children}</span>
        </button>
    );
}

Chip.defaultProps = {
    active: false,
    className: "",
    onClick: () => {},
    score: 0
};
