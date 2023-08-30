import clsx from "clsx";
import { useContext, useEffect, useState } from "react";
import { ImCheckboxChecked, ImCheckboxUnchecked } from "react-icons/im";
import { Feature, SearchResultRefined } from "@/types";
import RefinementContext from "@/contexts/RefinementContext";

export default function FeatureComponent({ feature }: { feature: SearchResultRefined<Feature> }) {
    const [checked, setChecked] = useState(!feature.exclude && feature.count > 0);
    useEffect(() => setChecked(!feature.exclude && feature.count > 0), [feature]);
    const refineHandler = useContext(RefinementContext);

    return (
        <div
            className={clsx(
                "relative flex w-full flex-col divide-y-1 rounded-md bg-white shadow-md",
                feature.score === 0 && "border-l-4 border-green-400",
                feature.score > 0 && "border-l-4 border-yellow-400",
                feature.count === 0 && "border-l-4 border-red-400 opacity-40"
            )}
        >
            <div className="flex flex-row items-start p-3 !pb-0">
                <div className="grow">
                    <h3 className="-mb-1 text-xs font-bold">Feature &bull; {feature.item.spec}</h3>
                    <h2 className="text-3xl font-extralight tracking-tight">{feature.item.name}</h2>
                </div>
                <button
                    className="ml-2 flex flex-col items-start text-xl"
                    onClick={() => {
                        setChecked(!checked);
                        refineHandler(
                            {
                                ...feature,
                                exclude: !!checked
                            },
                            "feature"
                        );
                    }}
                    type="button"
                >
                    {checked ? <ImCheckboxChecked /> : <ImCheckboxUnchecked />}
                </button>
            </div>
            <p className="px-3 py-1 text-justify text-sm italic text-neutral-500">
                {feature.item.description || "N/A"}
            </p>
        </div>
    );
}
