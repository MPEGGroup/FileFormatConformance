import { Tooltip } from "@mui/material";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { FiDownload } from "react-icons/fi";
import { MdClose } from "react-icons/md";
import { RiNodeTree } from "react-icons/ri";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import json from "react-syntax-highlighter/dist/esm/languages/hljs/json";
import codeStyle from "react-syntax-highlighter/dist/esm/styles/hljs/github";
import urlJoin from "url-join";
import { FileMetadata } from "@/types/json";
import { FileSearchResult } from "@/types";
import Drawer from "./Drawer";
import { spec_info as specs } from "../../data/coverage.json";

SyntaxHighlighter.registerLanguage("json", json);

function getDownloadURL(file: FileMetadata, relativeFile?: string) {
    const BASE_URL = new URL(window.location.origin + window.location.pathname);
    const DOWNLOAD_URL = new URL(urlJoin(BASE_URL.href, `/files/${file.abs_filepath}`));
    if (relativeFile) return new URL(relativeFile, DOWNLOAD_URL).href;
    return DOWNLOAD_URL.href;
}

function DetailItem({
    label,
    children,
    noTruncate,
    className
}: {
    label: string;
    children: string | React.ReactNode;
    noTruncate?: boolean;
    className?: string;
}) {
    return (
        <div className={clsx("flex flex-col", className)}>
            <span className="select-none text-sm font-bold text-gray-500">{label}</span>
            <span className="table w-full table-fixed">
                {children === "" ? (
                    <span className="table-cell select-none truncate text-sm text-gray-500">
                        Not available
                    </span>
                ) : (
                    <span className={clsx("table-cell text-sm", !noTruncate && "truncate")}>
                        {children}
                    </span>
                )}
            </span>
        </div>
    );
}

DetailItem.defaultProps = {
    className: "",
    noTruncate: false
};

function DetailsModal({ file }: { file: FileMetadata }) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        document.body.style.overflow = open ? "hidden" : "auto";
        return () => {};
    }, [open]);

    return (
        <>
            <Tooltip title="Details">
                <button onClick={() => setOpen(true)} type="submit">
                    <AiOutlineInfoCircle className="text-2xl" />
                </button>
            </Tooltip>
            {open && (
                <div className="absolute left-0 top-0 z-20 flex h-screen w-screen items-center justify-center">
                    <div className="z-10 flex h-full max-h-full w-full flex-col bg-white child:p-3 md:h-auto md:max-h-[60%] md:w-1/2 md:overflow-hidden md:rounded-md md:shadow-md xl:w-2/5">
                        <div className="flex items-center gap-2">
                            <span className="grow select-none text-2xl font-thin leading-tight">
                                File Details
                            </span>
                            <button
                                className="self-end"
                                onClick={() => setOpen(false)}
                                type="button"
                            >
                                <MdClose className="text-4xl font-thin" />
                            </button>
                        </div>
                        <div className="flex items-center border-y-1">
                            <span className="table w-full table-fixed">
                                <h2 className="table-cell truncate text-2xl font-extralight tracking-tight">
                                    {file.rel_filepath.split("/").pop()}
                                </h2>
                            </span>
                            <a
                                className="flex grow flex-row items-center gap-2 px-3 py-2 max-xs:justify-center"
                                download
                                href={getDownloadURL(file)}
                            >
                                <FiDownload className="text-xl" />
                            </a>
                        </div>
                        <div className="relative flex w-full flex-col overflow-y-auto !p-0">
                            <div className="grid grid-cols-2 gap-4 p-3">
                                <DetailItem label="Contributor">{file.contributor}</DetailItem>
                                <DetailItem label="MDMS Number">{file.mdms_number}</DetailItem>
                                <DetailItem label="Published">
                                    {file.published ? "Yes" : "No"}
                                </DetailItem>
                                <DetailItem label="Version">{file.version.toFixed(0)}</DetailItem>
                                <DetailItem className="col-span-2" label="MD5 Checksum">
                                    <code>{file.md5}</code>
                                </DetailItem>
                                <DetailItem
                                    className="col-span-2 whitespace-pre-line"
                                    label="Description"
                                    noTruncate
                                >
                                    {file.description}
                                </DetailItem>
                            </div>
                            <div>
                                <Drawer hidden={file.license === ""} title="License">
                                    <div className="flex flex-col p-3">
                                        <p className="whitespace-break-spaces rounded-sm bg-gray-100 p-1 text-justify text-sm text-neutral-800">
                                            {file.license}
                                        </p>
                                    </div>
                                </Drawer>
                                <Drawer
                                    hidden={file.associated_files.length === 0}
                                    title="Associated Files"
                                >
                                    <ul className="flex flex-col divide-y-1">
                                        {file.associated_files.map((associatedFile) => (
                                            <li
                                                key={associatedFile}
                                                className="flex flex-row items-center gap-2 px-3 py-1"
                                            >
                                                <span className="table w-full table-fixed">
                                                    <h2 className="table-cell truncate font-light tracking-tight">
                                                        {associatedFile.split("/").pop()}
                                                    </h2>
                                                </span>
                                                <a
                                                    className="flex grow flex-row items-center gap-2 px-3 py-2 max-xs:justify-center"
                                                    download
                                                    href={getDownloadURL(file, associatedFile)}
                                                >
                                                    <FiDownload />
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </Drawer>
                                <Drawer hidden={file.conforms_to.length === 0} title="Conforms To">
                                    <ul className="flex flex-col divide-y-1">
                                        {file.conforms_to.map((conformsTo) => {
                                            const relatedSpec = specs.find(
                                                (spec) =>
                                                    spec.ISO === conformsTo.ISO &&
                                                    spec.version === conformsTo.version
                                            );

                                            if (!relatedSpec) {
                                                console.error(
                                                    `Could not find spec ${conformsTo.ISO} ver ${conformsTo.version}`
                                                );
                                                return null;
                                            }

                                            return (
                                                <li
                                                    key={conformsTo.ISO + conformsTo.version}
                                                    className="flex flex-row items-center px-3 py-1"
                                                >
                                                    <span className="table w-full table-fixed">
                                                        <h2 className="table-cell truncate font-light tracking-tight">
                                                            ISO/IEC {relatedSpec.ISO} (
                                                            <span className="font-bold">
                                                                {relatedSpec.name}
                                                            </span>
                                                            ): ver
                                                            {relatedSpec.version}
                                                            {conformsTo.amendmends &&
                                                                conformsTo.amendmends.length > 0 &&
                                                                `, ${conformsTo.amendmends.join(
                                                                    ", "
                                                                )}`}
                                                            {conformsTo.corrigenda &&
                                                                conformsTo.corrigenda.length > 0 &&
                                                                `, ${conformsTo.corrigenda.join(
                                                                    ", "
                                                                )}`}
                                                        </h2>
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </Drawer>
                                <Drawer hidden={file.features.length === 0} title="Features">
                                    <ul className="flex flex-col divide-y-1">
                                        {file.features.map((feature) => (
                                            <li
                                                key={feature}
                                                className="flex flex-row items-center px-3 py-1"
                                            >
                                                <span className="table w-full table-fixed">
                                                    <h2 className="table-cell truncate font-light tracking-tight">
                                                        {feature}
                                                    </h2>
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </Drawer>
                                <Drawer
                                    hidden={
                                        typeof file.notes === "object"
                                            ? Object.keys(file.notes).length === 0
                                            : file.notes === ""
                                    }
                                    title="Notes"
                                >
                                    <div className="flex flex-col p-3">
                                        <p className="whitespace-break-spaces rounded-sm bg-gray-100 p-1 text-justify text-sm text-neutral-800">
                                            {typeof file.notes === "string" ? (
                                                file.notes
                                            ) : (
                                                <SyntaxHighlighter
                                                    customStyle={{
                                                        fontSize: "0.75rem",
                                                        overflowY: "hidden"
                                                    }}
                                                    language="javascript"
                                                    style={codeStyle}
                                                    wrapLines
                                                    wrapLongLines
                                                >
                                                    {JSON.stringify(file.notes, null, 2)}
                                                </SyntaxHighlighter>
                                            )}
                                        </p>
                                    </div>
                                </Drawer>
                            </div>
                        </div>
                    </div>
                    <div
                        aria-label="Close search"
                        className="fixed left-0 top-0 h-screen w-screen bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                            if (e.key === "Escape") setOpen(false);
                        }}
                        role="button"
                        tabIndex={0}
                    />
                </div>
            )}
        </>
    );
}

export default function FileComponent({ file }: { file: FileSearchResult }) {
    let inspectEnabled = true;
    if (typeof file.item.notes === "object") {
        if ("compressed" in file.item.notes) {
            inspectEnabled = file.item.notes.compressed === false;
        }
    }

    return (
        <div className="flex w-full flex-col divide-y-1 rounded-md bg-white shadow-md">
            <div className="flex flex-row p-3">
                <div className="flex flex-col items-start">
                    <div className="flex flex-row flex-wrap gap-2">
                        <span
                            className={clsx(
                                "flex h-4 items-center justify-center whitespace-nowrap rounded-full px-2 text-xs font-bold text-white",
                                file.item.published ? "bg-green-500" : "bg-orange-500"
                            )}
                        >
                            {file.item.published ? "Published" : "Under Consideration"}
                        </span>
                        {file.matches.slice(0, 4).map((match) => {
                            return (
                                <span
                                    key={match.value}
                                    className={clsx(
                                        "flex h-4 items-center justify-center whitespace-nowrap rounded-full px-2 text-xs font-bold text-white",
                                        match.type === "box" ? "bg-gray-500" : "bg-blue-500"
                                    )}
                                >
                                    {match.value}
                                </span>
                            );
                        })}
                        {file.matches.length > 4 && (
                            <span className="flex h-4 items-center justify-center whitespace-nowrap rounded-full bg-gray-500 px-2 text-xs font-bold text-white opacity-40">
                                +{file.matches.length - 4} more
                            </span>
                        )}
                    </div>
                    <span className="table w-full table-fixed">
                        <h2 className="table-cell truncate text-2xl font-extralight tracking-tight">
                            {file.item.rel_filepath.split("/").pop()}
                        </h2>
                    </span>
                </div>
                <div className="ml-3 flex flex-row items-center">
                    <DetailsModal file={file.item} />
                </div>
            </div>
            <div className="flex flex-col items-stretch justify-between divide-y-1 xs:flex-row xs:divide-x-1 xs:divide-y-0">
                <div className="flex flex-col p-3">
                    <p className="text-justify text-sm text-neutral-800">
                        {file.item.contributor === "" ? (
                            <span className="text-gray-500">No contributor provided.</span>
                        ) : (
                            <>
                                <span className="mr-1">Contributor:</span>
                                <b>{file.item.contributor}</b>
                            </>
                        )}
                    </p>
                    <p className="line-clamp-3 whitespace-pre-line text-sm text-neutral-800">
                        {file.item.description === "" ? (
                            <span className="text-gray-500">No description available.</span>
                        ) : (
                            <>
                                <span className="mr-1">Description:</span>
                                <b>{file.item.description}</b>
                            </>
                        )}
                    </p>
                    <p className="text-justify text-sm text-neutral-800">
                        <span className="mr-1">Version:</span>
                        <b>{file.item.version}</b>
                    </p>
                </div>
                <div className="flex flex-row divide-x-1 xs:flex-col xs:divide-x-0 xs:divide-y-1">
                    <a
                        className="flex grow flex-row items-center gap-2 px-3 py-2 max-xs:justify-center"
                        download
                        href={getDownloadURL(file.item)}
                    >
                        <FiDownload className="text-lg" /> Download
                    </a>
                    {inspectEnabled && (
                        <a
                            className="flex grow flex-row items-center gap-2 px-3 py-2 max-xs:justify-center"
                            href={`${MP4BOX_BASE}?${getDownloadURL(file.item)}`}
                            rel="noreferrer"
                            target="_blank"
                        >
                            <RiNodeTree className="text-lg" /> Inspect
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
