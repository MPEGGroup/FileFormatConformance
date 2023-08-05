import clsx from "clsx";
import { useEffect, useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { useMedia } from "react-use";
import { Coverage } from "@/types/json";
import SpecsCovered from "./SpecsCovered";

function Number({ value, percentage }: { value: number; percentage?: boolean }) {
    return (
        <span
            className={clsx(
                "mr-1 text-2xl font-extrabold tracking-tight text-sky-500 md:text-3xl lg:text-4xl",
                percentage && "text-red-600",
                percentage && value > 0.25 && "text-orange-600",
                percentage && value > 0.75 && "text-green-600"
            )}
        >
            {(value * (percentage ? 100 : 1)).toFixed(percentage ? 2 : 0)} {percentage && "%"}
        </span>
    );
}

Number.defaultProps = {
    percentage: false
};

export default function CoverageSummary({ className }: { className?: string }) {
    const mobile = useMedia("(max-width: 768px)");
    const [coverageStats, setCoverageStats] = useState<Coverage>();

    useEffect(() => {
        const init = async () => {
            setCoverageStats(
                (await import("../../data/coverage.json").then(
                    (module) => module.default
                )) as Coverage
            );
        };

        init().catch(console.error);
    }, []);

    if (!coverageStats)
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <AiOutlineLoading className="animate-spin text-9xl" />
            </div>
        );

    return (
        <div className={clsx("flex flex-col items-center justify-center overflow-auto", className)}>
            <h1 className="text-center text-xl font-extrabold capitalize md:text-2xl">
                File Format Conformance Framework
            </h1>
            <h2 className="text-center text-lg font-light capitalize tracking-tight md:text-xl">
                Coverage Statistics
            </h2>
            <div className="mt-3 grid w-full max-w-4xl grid-cols-2 place-items-center justify-center text-lg md:mt-6">
                <div className="my-1.5 flex flex-col items-center justify-center md:my-3">
                    <Number value={coverageStats.files.published_count} />
                    <span className="text-center text-sm font-extralight uppercase tracking-wide md:text-lg">
                        Files Submitted
                    </span>
                </div>
                <div className="my-1.5 flex flex-col items-center justify-center md:my-3">
                    <Number value={coverageStats.files.under_consideration_count} />
                    <span className="text-center text-sm font-extralight uppercase tracking-wide md:text-lg">
                        Files Under Consideration
                    </span>
                </div>
                <div className="my-1.5 flex flex-col items-center justify-center md:my-3">
                    <Number value={coverageStats.boxes.count} />
                    <span className="text-center text-sm font-extralight uppercase tracking-wide md:text-lg">
                        Boxes
                    </span>
                </div>
                <div className="my-1.5 flex flex-col items-center justify-center md:my-3">
                    <Number value={coverageStats.feature_file_map.count} />
                    <span className="text-center text-sm font-extralight uppercase tracking-wide md:text-lg">
                        Features
                    </span>
                </div>
                <SpecsCovered className="col-span-2 mt-3 md:mt-6" compact={mobile} />
            </div>
        </div>
    );
}

CoverageSummary.defaultProps = {
    className: ""
};
