import { Coverage } from "@/types/json";
import SpecsCovered from "@/components/SpecsCovered";
import clsx from "clsx";
import { Button, Modal, Tooltip } from "@mui/material";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { useState } from "react";
import { MdClose } from "react-icons/md";

function StatisticDisplay({
    label,
    alt,
    info,
    value,
    total,
    excluded = 0
}: {
    label: string;
    alt: string;
    info?: string;
    value: number;
    total: number;
    excluded?: number;
}) {
    const [open, setOpen] = useState(false);
    const adjustedTotal = total - excluded;
    let level = "low";
    if (value / total >= 0.75) {
        level = "high";
    } else if (value / total >= 0.25) {
        level = "med";
    }

    return (
        <div className="flex grow flex-col gap-1 lg:grow-0">
            <div className="flex items-center gap-2 font-bold">
                <span>{label}</span>
                {info && (
                    <Tooltip
                        arrow
                        onClose={() => setOpen(false)}
                        onOpen={() => setOpen(true)}
                        open={open}
                        placement="top"
                        title={info}
                    >
                        <button onClick={() => setOpen(true)} type="submit">
                            <AiOutlineInfoCircle />
                        </button>
                    </Tooltip>
                )}
            </div>
            <div className="relative flex min-w-[180px] items-center gap-4 lg:min-w-[250px]">
                <progress className={clsx("h-5 w-full", level)} max={adjustedTotal} value={value} />
                <span className="absolute right-1 font-semibold">
                    {((value / adjustedTotal) * 100).toFixed(0)}%
                </span>
            </div>
            <span className="text-xs font-light">
                {value} of {adjustedTotal} {alt} {alt.includes("file") ? "published" : "covered"}
            </span>
            {excluded > 0 && (
                <span className="text-xs font-light">
                    {excluded} {alt} are <u>under consideration</u> (excluded)
                </span>
            )}
        </div>
    );
}

StatisticDisplay.defaultProps = {
    excluded: 0,
    info: ""
};

export default function CoverageHeader({
    coverageStats,
    processedCoverageStats,
    depth
}: {
    coverageStats: Coverage;
    processedCoverageStats: Coverage;
    depth: number;
}) {
    const [open, setOpen] = useState(false);
    const download = () => {
        const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(coverageStats)
        )}`;
        const downloadAnchorNode = document.createElement("a");
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `coverage-${BUILD_TIMESTAMP}.json`);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const sumValues = (obj: Record<string, string[]>) => {
        return Object.values(obj).reduce((acc, val) => acc + val.length, 0);
    };

    return (
        <div className="flex w-full flex-col gap-4">
            <div className="flex flex-wrap items-stretch gap-4">
                <StatisticDisplay
                    alt="files"
                    label="Conformance Files"
                    total={processedCoverageStats.files.count}
                    value={processedCoverageStats.files.published_count}
                />
                <StatisticDisplay
                    alt="features"
                    excluded={processedCoverageStats.lists.features.under_consideration.length}
                    label="Features"
                    total={sumValues(processedCoverageStats.lists.features)}
                    value={processedCoverageStats.lists.features.covered.length}
                />
                <StatisticDisplay
                    alt="box paths"
                    excluded={processedCoverageStats.lists.boxes.under_consideration.length}
                    info={`This calculation is based on selected depth value of ${depth}`}
                    label="Box Paths"
                    total={sumValues(processedCoverageStats.lists.boxes)}
                    value={processedCoverageStats.lists.boxes.covered.length}
                />
            </div>
            <Button onClick={() => setOpen(true)} variant="outlined">
                More information
            </Button>
            <Modal
                className="flex items-center justify-center"
                onClose={() => setOpen(false)}
                open={open}
            >
                <div className="flex flex-col items-stretch gap-6 rounded-lg bg-white p-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold">More Information</h1>
                        <button onClick={() => setOpen(false)} type="button">
                            <MdClose className="text-3xl font-thin" />
                        </button>
                    </div>
                    <div className="flex grow flex-col items-center max-md:w-full md:items-start">
                        <SpecsCovered compact />
                    </div>
                    <Button onClick={download} variant="outlined">
                        Download Coverage Report
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
