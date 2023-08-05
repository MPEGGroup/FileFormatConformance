import { createContext } from "react";
import { Box, Feature, SearchResultRefined } from "@/types";

const RefinementContext = createContext<
    (result: SearchResultRefined<Box | Feature>, type: "box" | "feature") => void
>(() => {});

export default RefinementContext;
