import clsx from "clsx";
import { useContext, useEffect, useState } from "react";
import { ImCheckboxChecked, ImCheckboxUnchecked } from "react-icons/im";

import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import js from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import codeStyle from "react-syntax-highlighter/dist/esm/styles/hljs/github";
import { useMedia } from "react-use";
import { Box, SearchResultRefined } from "@/types";
import RefinementContext from "@/contexts/RefinementContext";
import Chip from "./Chip";
import Drawer from "./Drawer";

SyntaxHighlighter.registerLanguage("javascript", js);

/**
 * Constructs a description for the box.
 * @param box
 */
function getMetadata(box: SearchResultRefined<Box>) {
    let containerType: "any" | "mixed" | "normal" | "type" = "any";
    const counts = {
        type: 0,
        normal: 0
    };

    box.item.containers.every((container) => {
        if (
            container.type === "*" &&
            container.fourcc === "*" &&
            box.item.containers.length === 1
        ) {
            // free, skip, uuid
            containerType = "any";
            return false;
        }

        if (container.fourcc === "*" && container.type !== "*") {
            containerType = containerType === "any" ? "type" : "mixed";
            counts.type += 1;
        } else if (container.fourcc !== "*" && container.type !== "*") {
            containerType = containerType === "any" ? "normal" : "mixed";
            counts.normal += 1;
        }
        return true;
    });

    let description = "";
    if (containerType === "any") {
        if (box.item.fourcc === "file") description = "This box is the root of the file.";
        else description = "This box can be found anywhere.";
    } else if (containerType === "type" && counts.type === 1) {
        description = `This box can only be found in <b>${box.item.containers[0].type}</b> types.`;
    } else if (containerType === "type" && counts.type > 1) {
        description = `This box can be found under <b>${counts.type}</b> types of boxes.`;
    } else if (containerType === "normal" && counts.normal === 1) {
        description = `This box can only be found under <b>${box.item.containers[0].fourcc}</b> box.`;
    } else if (containerType === "normal" && counts.normal > 1) {
        description = `This box can be found under <b>${counts.normal}</b> boxes.`;
    } else if (containerType === "mixed") {
        description = "This box can be found under ";
        if (counts.type > 0) {
            if (counts.type > 1) {
                description += `<b>${counts.type}</b> types of boxes`;
            } else {
                description += `<b>${box.item.containers[0].type}</b> type of boxes`;
            }
        }
        if (counts.normal > 0 && counts.type > 0) {
            description += " and ";
        }
        if (counts.normal > 0) {
            if (counts.normal > 1) {
                description += `<b>${counts.normal}</b> boxes`;
            } else {
                description += `<b>${box.item.containers[0].fourcc}</b> boxes`;
            }
        }
        description += ".";
    }

    return { counts, description };
}

export default function BoxComponent({ box }: { box: SearchResultRefined<Box> }) {
    const mobile = useMedia("(max-width: 320px)");
    const [checked, setChecked] = useState(!box.exclude && box.count > 0);
    useEffect(() => setChecked(!box.exclude && box.count > 0), [box]);
    const refineHandler = useContext(RefinementContext);
    const { counts, description } = getMetadata(box);

    return (
        <div
            className={clsx(
                "relative flex w-full flex-col divide-y-1 overflow-hidden rounded-md bg-white shadow-md",
                box.score === 0 && "border-l-4 border-green-400",
                box.score > 0 && "border-l-4 border-yellow-400",
                box.count === 0 && "border-l-4 !border-red-400 opacity-40"
            )}
        >
            <div className="flex flex-row items-start p-3 !pb-0">
                <div className="grow">
                    <h3 className="-mb-1 text-xs font-bold">
                        {box.item.type || "N/A"} &bull; {box.item.spec}
                    </h3>
                    <h2 className="text-4xl font-extralight tracking-tight">{box.item.fourcc}</h2>
                    <p className="text-justify text-sm italic text-neutral-500">
                        {box.item.description}
                    </p>
                </div>
                <button
                    className="flex flex-col items-start text-xl"
                    onClick={() => {
                        setChecked(!checked);
                        refineHandler(
                            {
                                ...box,
                                exclude: !!checked
                            },
                            "box"
                        );
                    }}
                    type="button"
                >
                    {checked ? <ImCheckboxChecked /> : <ImCheckboxUnchecked />}
                </button>
            </div>
            <div>
                <p
                    className="px-3 py-1 text-sm"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: description }}
                />
                <Drawer
                    hidden={
                        box.item.containers.length === 0 ||
                        (counts.normal === 1 && counts.type === 1) ||
                        (counts.normal === 1 && counts.type === 0) ||
                        (counts.normal === 0 && counts.type === 1)
                    }
                    title="Containers"
                >
                    <div className="flex flex-row flex-wrap gap-3 p-3">
                        {box.item.containers.map((container) => (
                            <Chip
                                key={`${container.type}-${container.fourcc}`}
                                className="cursor-default rounded-md shadow-sm"
                                type={container.fourcc === "*" ? "type" : "fourcc"}
                            >
                                <>
                                    {container.fourcc === "*" ? container.type : container.fourcc}{" "}
                                    {container.type !== "*" && container.fourcc !== "*" && (
                                        <span className="text-xs text-neutral-500">{`(${container.type})`}</span>
                                    )}
                                </>
                            </Chip>
                        ))}
                    </div>
                </Drawer>
                <Drawer hidden={box.item.versions.length < 1} title="Versions">
                    <ul className="p-3">
                        {box.item.versions.map((version) => (
                            <li key={version} className="flex flex-row items-center gap-2">
                                <button
                                    className="flex flex-col items-start"
                                    onClick={() => {
                                        // Create refinements object if it doesn't exist
                                        let { refinements } = box;
                                        if (!refinements)
                                            refinements = {
                                                variant: {
                                                    versions: {
                                                        value: []
                                                    },
                                                    flags: {
                                                        value: [],
                                                        exact: false
                                                    }
                                                }
                                            };

                                        // Toggle the version
                                        if (refinements.variant.versions.value.includes(version))
                                            refinements.variant.versions.value =
                                                refinements.variant.versions.value.filter(
                                                    (v) => v !== version
                                                );
                                        else refinements.variant.versions.value.push(version);

                                        refineHandler(
                                            {
                                                ...box,
                                                refinements
                                            },
                                            "box"
                                        );
                                    }}
                                    type="button"
                                >
                                    {box.refinements &&
                                    box.refinements.variant.versions.value.includes(version) ? (
                                        <ImCheckboxChecked />
                                    ) : (
                                        <ImCheckboxUnchecked />
                                    )}
                                </button>
                                Version {version}
                            </li>
                        ))}
                    </ul>
                </Drawer>
                <Drawer
                    hidden={box.item.flags.filter((f) => !("wildcard" in f)).length < 1}
                    title="Flags"
                >
                    <ul className="p-3">
                        {box.item.flags.map((flag) => {
                            if ("wildcard" in flag) return null;
                            const { name, value, description: flagDescription } = flag;
                            return (
                                <li
                                    key={name}
                                    className="mt-2 flex flex-row items-center gap-2 first:mt-0"
                                >
                                    <button
                                        className="flex flex-col items-start"
                                        onClick={() => {
                                            // Create refinements object if it doesn't exist
                                            let { refinements } = box;
                                            if (!refinements)
                                                refinements = {
                                                    variant: {
                                                        versions: {
                                                            value: []
                                                        },
                                                        flags: {
                                                            value: [],
                                                            exact: false
                                                        }
                                                    }
                                                };

                                            // Toggle the flag
                                            if (refinements.variant.flags.value.includes(value))
                                                refinements.variant.flags.value =
                                                    refinements.variant.flags.value.filter(
                                                        (v) => v !== value
                                                    );
                                            else refinements.variant.flags.value.push(value);

                                            refineHandler(
                                                {
                                                    ...box,
                                                    refinements
                                                },
                                                "box"
                                            );
                                        }}
                                        type="button"
                                    >
                                        {box.refinements &&
                                        box.refinements.variant.flags.value.includes(value) ? (
                                            <ImCheckboxChecked />
                                        ) : (
                                            <ImCheckboxUnchecked />
                                        )}
                                    </button>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">
                                            {name} <code className="basic">{value}</code>
                                        </span>
                                        <span className="text-xs text-neutral-500">
                                            {flagDescription || "No description."}
                                        </span>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    <div
                        className={clsx(
                            "flex-row items-center gap-2 border-t-1 p-3",
                            box.item.flags.length < 2 ? "hidden" : "flex"
                        )}
                    >
                        <button
                            className="flex flex-col items-start"
                            onClick={() => {
                                // Create refinements object if it doesn't exist
                                let { refinements } = box;
                                if (!refinements)
                                    refinements = {
                                        variant: {
                                            versions: {
                                                value: []
                                            },
                                            flags: {
                                                value: [],
                                                exact: false
                                            }
                                        }
                                    };

                                // Toggle the flag
                                refinements.variant.flags.exact = !refinements.variant.flags.exact;
                                refineHandler(
                                    {
                                        ...box,
                                        refinements
                                    },
                                    "box"
                                );
                            }}
                            type="button"
                        >
                            {box.refinements && box.refinements.variant.flags.exact ? (
                                <ImCheckboxChecked />
                            ) : (
                                <ImCheckboxUnchecked />
                            )}
                        </button>
                        <span className="text-sm">
                            Combined flags must match exactly (no extra flags).
                        </span>
                    </div>
                </Drawer>
                <Drawer hidden={box.item.syntax === null} title="Syntax">
                    <SyntaxHighlighter
                        customStyle={{
                            fontSize: "0.75rem",
                            overflowY: "hidden",
                            margin: mobile ? 0 : "0.75rem"
                        }}
                        language="javascript"
                        style={codeStyle}
                        wrapLines
                        wrapLongLines
                    >
                        {box.item.syntax}
                    </SyntaxHighlighter>
                </Drawer>
            </div>
        </div>
    );
}
