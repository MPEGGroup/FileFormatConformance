import _ from "lodash";
import { Box, SearchResult } from "@/types";
import Database from "./database";
import Search from "./search";

describe("Search", () => {
    describe("sanity checks", async () => {
        let search: Search;
        beforeAll(async () => {
            search = await Search.getInstance();
        });

        it("search every box", async () => {
            const allBoxes = (await Database.getInstance()).boxes;

            const notFound: string[] = [];
            // eslint-disable-next-line no-restricted-syntax
            for await (const box of allBoxes) {
                const { boxes } = await search.search(`="${box.fourcc}"`, [
                    {
                        type: "type",
                        value: `="${box.type}"`
                    }
                ]);
                if (box.fourcc !== "file" && boxes.length !== 1) {
                    notFound.push(box.fourcc);
                }
            }

            expect(notFound).toEqual([]);
        });

        it("should not return anything", async () => {
            expect(await search.search("")).toEqual({
                boxes: [],
                features: []
            });
        });
    });

    describe("search of 'meta'", () => {
        let search: Search;
        beforeAll(async () => {
            search = await Search.getInstance();
        });

        it("without any filters", async () => {
            const { boxes } = await search.search("meta");

            expect(boxes.length).toBeGreaterThan(0);
            expect(
                _.some(boxes, (r: SearchResult<Box>) => r.item.fourcc === "meta" && r.score === 0)
            ).toBeTruthy();
            expect(boxes.map((r) => r.item.fourcc)).toMatchSnapshot();
        });

        it("with a filter", async () => {
            const { boxes } = await search.search("meta", [{ type: "type", value: "=FullBox" }]);

            expect(boxes.length).toBeGreaterThan(0);
            expect(
                _.some(boxes, (r: SearchResult<Box>) => r.item.fourcc === "meta" && r.score === 0)
            ).toBeTruthy();
            expect(boxes.map((r) => r.item.type)).not.toContain("Box");
            expect(boxes.map((r) => r.item.fourcc)).toMatchSnapshot();
        });

        it("with a filter that has no value", async () => {
            const { boxes } = await search.search("meta", [{ type: "type", value: "" }]);

            expect(boxes.length).toBeGreaterThan(0);
            expect(
                _.some(boxes, (r: SearchResult<Box>) => r.item.fourcc === "meta" && r.score === 0)
            ).toBeTruthy();
            expect(boxes.map((r) => r.item.fourcc)).toMatchSnapshot();
        });

        it("with multiple filters of same type", async () => {
            const { boxes } = await search.search("meta", [
                { type: "type", value: "FullBox" },
                { type: "type", value: "Box" }
            ]);

            expect(boxes.length).toBeGreaterThan(0);
            expect(
                _.some(boxes, (r: SearchResult<Box>) => r.item.fourcc === "meta" && r.score === 0)
            ).toBeTruthy();
            expect(boxes.map((r) => r.item.fourcc)).toMatchSnapshot();
        });
    });

    describe("search with other filters", () => {
        let search: Search;
        beforeAll(async () => {
            search = await Search.getInstance();
        });

        it("with a spec filter", async () => {
            const { boxes } = await search.search("", [{ type: "spec", value: "14496-12" }]);

            expect(boxes.length).toBeGreaterThan(0);
            expect(boxes.map((r) => r.item.fourcc)).toMatchSnapshot();
        });
    });

    describe("search with container filter", () => {
        let search: Search;
        beforeAll(async () => {
            search = await Search.getInstance();
        });

        it("$mdat > '=free'", async () => {
            const { boxes } = await search.search("=free", [{ type: "container", value: "$mdat" }]);

            expect(boxes.length).toEqual(1);
            expect(
                _.some(boxes, (r: SearchResult<Box>) => r.item.fourcc === "free" && r.score === 0)
            ).toBeTruthy();
        });

        it("$trak > 'encf'", async () => {
            const { boxes } = await search.search("encf", [{ type: "container", value: "$trak" }]);

            expect(boxes.length).toEqual(1);
            expect(
                _.some(boxes, (r: SearchResult<Box>) => r.item.fourcc === "encf" && r.score === 0)
            ).toBeTruthy();
        });

        it("$avcC > ''", async () => {
            const { boxes } = await search.search("", [{ type: "container", value: "$avcC" }]);

            expect(boxes.length).toEqual(3);
            expect(boxes.map((r) => r.item.fourcc)).toMatchSnapshot();
        });

        it("$file > $meta > 'idat'", async () => {
            const { boxes } = await search.search("idat", [
                { type: "container", value: "$file.$meta" }
            ]);

            expect(boxes.length).toEqual(1);
            expect(
                _.some(boxes, (r: SearchResult<Box>) => r.item.fourcc === "idat" && r.score === 0)
            ).toBeTruthy();
            expect(boxes.map((r) => r.item.fourcc)).toMatchSnapshot();
        });

        it("(exact) $file > $moov > 'trak'", async () => {
            const { boxes } = await search.search("trak", [
                { type: "container", value: "=$file.$moov" }
            ]);

            expect(boxes.length).toEqual(1);
            expect(
                _.some(boxes, (r: SearchResult<Box>) => r.item.fourcc === "trak" && r.score === 0)
            ).toBeTruthy();
            expect(boxes.map((r) => r.item.fourcc)).toMatchSnapshot();
        });

        it("(exact) $moov > $trak > $meta > 'hdlr'", async () => {
            const { boxes } = await search.search("hdlr", [
                { type: "container", value: "=$moov.$trak.$meta" }
            ]);

            expect(boxes.length).toEqual(1);
            expect(
                _.some(boxes, (r: SearchResult<Box>) => r.item.fourcc === "hdlr" && r.score === 0)
            ).toBeTruthy();
            expect(boxes.map((r) => r.item.fourcc)).toMatchSnapshot();
        });

        it("(exact) $trak > ''", async () => {
            const { boxes } = await search.search("", [{ type: "container", value: "=$trak" }]);

            expect(boxes.length).toEqual(11);
            expect(boxes.map((r) => r.item.fourcc)).toMatchSnapshot();
        });

        it("$moov > $edts > 'elst'", async () => {
            it("exact match", async () => {
                const { boxes } = await search.search("elst", [
                    { type: "container", value: "=$moov.$edts" }
                ]);

                expect(boxes.length).toEqual(0);
            });

            it("normal match", async () => {
                const { boxes } = await search.search("elst", [
                    { type: "container", value: "$moov.$edts" }
                ]);

                expect(boxes.length).toEqual(1);
                expect(
                    _.some(
                        boxes,
                        (r: SearchResult<Box>) => r.item.fourcc === "elst" && r.score === 0
                    )
                ).toBeTruthy();
                expect(boxes.map((r) => r.item.fourcc)).toMatchSnapshot();
            });
        });

        it("$mdat > $free > ''", async () => {
            const { boxes } = await search.search("=free", [
                { type: "container", value: "$mdat.$free" }
            ]);

            expect(boxes.length).toEqual(0);
        });

        it("$moov > $meta > 'xml'", async () => {
            const { boxes } = await search.search("xml", [
                { type: "container", value: "$moov.$meta" }
            ]);

            expect(boxes.length).toEqual(2);
            expect(
                _.some(boxes, (r: SearchResult<Box>) => r.item.fourcc === "xml " && r.score === 0)
            ).toBeTruthy();
            expect(boxes.map((r) => r.item.fourcc)).toMatchSnapshot();
        });

        it("#VisualSampleEntry > ''", async () => {
            const { boxes } = await search.search("", [
                { type: "container", value: "#VisualSampleEntry" }
            ]);

            expect(boxes.length).toBeGreaterThan(0);
            expect(
                _.some(boxes, (r: SearchResult<Box>) => r.item.fourcc === "seii" && r.score === 0)
            ).toBeTruthy();
            expect(boxes.map((r) => r.item.fourcc)).toMatchSnapshot();
        });

        it("entering container value one by one", async () => {
            await Database.getInstance(true);
            search = await Search.getInstance(true);

            await search.search("", [{ type: "container", value: "" }]);
            await search.search("", [{ type: "container", value: "=$file" }]);
            await search.search("", [{ type: "container", value: "=$file.$moov" }]);
            const { boxes: result1 } = await search.search("trak", [
                { type: "container", value: "=$file.$moov" }
            ]);

            expect(result1.length).toEqual(1);
            expect(
                _.some(result1, (r: SearchResult<Box>) => r.item.fourcc === "trak" && r.score === 0)
            ).toBeTruthy();

            await search.search("", [{ type: "container", value: "" }]);
            await search.search("", [{ type: "container", value: "=$moov" }]);
            await search.search("", [{ type: "container", value: "=$moov.$trak" }]);
            await search.search("", [{ type: "container", value: "=$moov.$trak.$meta" }]);
            const { boxes: result2 } = await search.search("hdlr", [
                { type: "container", value: "=$moov.$trak.$meta" }
            ]);

            expect(result2.length).toEqual(1);
            expect(
                _.some(result2, (r: SearchResult<Box>) => r.item.fourcc === "hdlr" && r.score === 0)
            ).toBeTruthy();
        });

        it("caches previous calculations", async () => {
            // Just for cache
            await search.search("xml", [{ type: "container", value: "$moov.$meta" }]);

            const { boxes } = await search.search("", [{ type: "container", value: "$moov" }]);

            expect(boxes.length).toBeGreaterThan(0);
            expect(
                _.some(boxes, (r: SearchResult<Box>) => r.item.fourcc === "avcp" && r.score === 0)
            ).toBeTruthy();
            expect(boxes.map((r) => r.item.fourcc)).toMatchSnapshot();
        });
    });
});
