import { useMedia } from "react-use";

export default function useMobile() {
    const oneColumnH = useMedia("(max-height: 1500px)");
    const twoColumnH = useMedia("(max-height: 1100px)");
    const twoColumnW = useMedia("(max-width: 1024px)");
    const mobile = twoColumnW ? oneColumnH : twoColumnH;
    return mobile;
}
