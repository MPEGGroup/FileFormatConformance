import { FaExpandAlt } from "react-icons/fa";
import { Link } from "react-router-dom";

export default function HighlightBox({ children }: { children: string }) {
    const path = children.split(".").slice(0, -1).join(".");
    const last = children.split(".").slice(-1)[0];
    return (
        <div className="table w-full table-fixed text-sm xs:text-base">
            <span className="table-cell truncate text-left" style={{ direction: "rtl" }}>
                <span className="text-neutral-500">
                    {path.includes("*") ? (
                        <>
                            {path.split("*")[0]}
                            <FaExpandAlt className="z-0 mx-1 inline-block rotate-45 text-xl text-red-400" />
                            {path.split("*")[1]}
                        </>
                    ) : (
                        path
                    )}
                    .
                </span>
                <Link
                    className="font-bold duration-200 hover:text-blue-400"
                    state={{
                        query: `="${last}"`,
                        filters: []
                    }}
                    to="/"
                >
                    {last}
                </Link>
            </span>
        </div>
    );
}
