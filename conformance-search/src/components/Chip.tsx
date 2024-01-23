import { Tooltip } from "@mui/material";
import clsx from "clsx";
import React from "react";

export default function Chip({
    children,
    alt,
    type,
    className,
    active,
    score,
    onClick
}: {
    children: React.JSX.Element | string;
    alt?: string;
    className?: string;
    type?: string | undefined;
    active?: boolean;
    score?: number;
    onClick?: () => void;
}) {
    return (
        <Tooltip placement="bottom" title={alt}>
            <button
                className={clsx(
                    "px-2 py-1",
                    "hover:brightness-90",
                    "bg-gray-200",
                    type === "fourcc" && "!bg-blue-200",
                    type === "type" && "!bg-rose-200",
                    score && score > 0.1 && "opacity-70",
                    active && "border-2 border-black",
                    className
                )}
                onClick={onClick}
                type="button"
            >
                <span>{children}</span>
            </button>
        </Tooltip>
    );
}

Chip.defaultProps = {
    active: false,
    alt: "",
    className: "",
    onClick: () => {},
    score: 0,
    type: undefined
};
