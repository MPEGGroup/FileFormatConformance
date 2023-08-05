import clsx from "clsx";
import { Coverage } from "@/types/json";
import { spec_info as specs } from "../../data/coverage.json";

export default function SpecsCovered({
    compact,
    className
}: {
    compact?: boolean;
    className?: string;
}) {
    return (
        <div className={clsx("rounded-md border-1 border-gray-300 bg-white shadow-md", className)}>
            <div className={clsx("border-b-2 px-3 py-2", !compact && "text-lg")}>
                <b>{specs.length}</b> specifications covered
            </div>
            <div className="max-h-[250px] max-w-xl divide-y-1 overflow-y-auto">
                {specs.map((info: Coverage["spec_info"][0]) => (
                    <div
                        key={info.ISO}
                        className={clsx(
                            "truncate px-3 py-2 font-light hover:bg-gray-100",
                            compact && "!py-1 text-sm font-normal"
                        )}
                    >
                        ISO/IEC {info.ISO} (<span className="font-bold">{info.name}</span>): ver
                        {info.version}
                        {info.amendmends &&
                            info.amendmends.length > 0 &&
                            `, ${info.amendmends.join(", ")}`}
                        {info.corrigenda &&
                            info.corrigenda.length > 0 &&
                            `, ${info.corrigenda.join(", ")}`}
                    </div>
                ))}
            </div>
        </div>
    );
}

SpecsCovered.defaultProps = {
    className: "",
    compact: false
};
