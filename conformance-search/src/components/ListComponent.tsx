import clsx from "clsx";
import React from "react";
import { MdCancel } from "react-icons/md";

export default function ListComponent({
    children,
    className
}: {
    children: React.JSX.Element[];
    className?: string;
}) {
    if (children.length === 0)
        return (
            <div className={clsx(className, "flex flex-col items-center justify-center gap-4")}>
                <MdCancel className="text-6xl text-red-600" />
                <span className="text-2xl">No results found for this query</span>
                <p className="text-center text-sm">
                    Try changing your filters or search query.
                    <br />
                    If you are sure that this is a bug, please report it on{" "}
                    <a
                        className="text-blue-500 hover:underline"
                        href="https://github.com/MPEGGroup/FileFormatConformance/issues/new/choose"
                        onClick={() => {
                            window.open(
                                "https://github.com/MPEGGroup/FileFormatConformance/issues/new/choose",
                                "_blank",
                                "noopener noreferrer"
                            );
                        }}
                    >
                        GitHub
                    </a>
                    .
                </p>
            </div>
        );
    return (
        <div
            className={clsx(className, "flex flex-col items-center justify-between gap-4")}
            data-testid="list-view"
        >
            <span className="w-full self-start px-2">
                Search resulted in <b>{children.length}</b> hits
            </span>
            <ul className="flex w-full grow flex-col gap-4 overflow-y-auto p-2 pt-0">
                {children.map((item) => {
                    return (
                        <li key={item.key} data-testid="list-item">
                            {item}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

ListComponent.defaultProps = {
    className: ""
};
