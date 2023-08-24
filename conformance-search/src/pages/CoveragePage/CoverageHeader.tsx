import { Coverage } from "@/types/json";
import SpecsCovered from "@/components/SpecsCovered";

export default function CoverageHeader({
    coverageStats,
    processedCoverageStats,
    depth
}: {
    coverageStats: Coverage;
    processedCoverageStats: Coverage;
    depth: number;
}) {
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

    return (
        <div className="flex w-full flex-col flex-wrap items-start gap-4 border-b-2 border-black pb-6 text-sm xs:text-base md:flex-row">
            <table className="max-md:w-full">
                <thead>
                    <tr>
                        <th colSpan={2}>File Statistics</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>Count</th>
                        <th>Attribute</th>
                    </tr>
                    <tr>
                        <td>{coverageStats.files.count}</td>
                        <td>Files submitted</td>
                    </tr>
                    <tr>
                        <td>{coverageStats.files.published_count}</td>
                        <td>Published</td>
                    </tr>
                    <tr>
                        <td>{coverageStats.files.under_consideration_count}</td>
                        <td>Under consideration</td>
                    </tr>
                </tbody>
            </table>
            <table className="max-md:w-full">
                <thead>
                    <tr>
                        <th colSpan={2}>Boxes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>Count</th>
                        <th>Attribute</th>
                    </tr>
                    <tr>
                        <td>{processedCoverageStats.path_file_map.count}</td>
                        <td>All possible box locations</td>
                    </tr>
                    <tr>
                        <td>
                            {(
                                (processedCoverageStats.lists.boxes.covered.length /
                                    (processedCoverageStats.lists.boxes.not_covered.length +
                                        processedCoverageStats.lists.boxes.covered.length)) *
                                100
                            ).toFixed(2)}
                            %
                        </td>
                        <td>Coverage percentage (depth={depth})</td>
                    </tr>
                    <tr>
                        <td>{processedCoverageStats.path_file_map.non_empty}</td>
                        <td>Unique box locations in files</td>
                    </tr>
                    <tr>
                        <td>{processedCoverageStats.path_file_map.published.count}</td>
                        <td>Published</td>
                    </tr>
                    <tr>
                        <td>{processedCoverageStats.path_file_map.under_consideration.count}</td>
                        <td>Under consideration</td>
                    </tr>
                </tbody>
            </table>
            <table className="max-md:w-full">
                <thead>
                    <tr>
                        <th colSpan={2}>User Defined Features</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>Count</th>
                        <th>Attribute</th>
                    </tr>
                    <tr>
                        <td>{processedCoverageStats.feature_file_map.count}</td>
                        <td>Total number of features</td>
                    </tr>
                    <tr>
                        <td>{processedCoverageStats.feature_file_map.published_features}</td>
                        <td>Published</td>
                    </tr>
                    <tr>
                        <td>
                            {processedCoverageStats.feature_file_map.under_consideration_features}
                        </td>
                        <td>Under consideration</td>
                    </tr>
                </tbody>
            </table>
            <div className="flex grow flex-col items-center max-md:w-full md:items-start">
                <SpecsCovered compact />
            </div>
            <button
                className="rounded-md border-1 bg-white px-3 py-2 shadow-md hover:shadow-sm"
                onClick={download}
                type="button"
            >
                Download Coverage Report
            </button>
        </div>
    );
}
