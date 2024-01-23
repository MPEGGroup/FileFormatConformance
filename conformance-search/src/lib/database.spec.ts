import { Box, SearchResultRefined } from "@/types";
import Database from "./database";
import Search from "./search";

describe("Database", () => {
    let database: Database;
    let search: Search;
    beforeAll(async () => {
        database = await Database.getInstance();
        search = await Search.getInstance();
    });

    function getBox(fourcc: string, type?: string): SearchResultRefined<Box> {
        let box;
        if (type !== undefined) {
            box = database.boxes.find((obox: Box) => obox.fourcc === fourcc && obox.type === type);
        } else {
            box = database.boxes.find((obox: Box) => obox.fourcc === fourcc);
        }

        if (!box) throw new Error(`Box ${fourcc} not found in database`);
        return {
            item: box,
            refIndex: -1,
            actualScore: 0,
            score: 0,
            count: 0,
            exclude: false,
            type: "box"
        };
    }

    describe("get files with version and flags", () => {
        beforeEach(async () => {
            await database.updateDatabase([]);
        });

        it("with a 0x1 flag on trun", () => {
            const box: SearchResultRefined<Box> = {
                ...getBox("trun"),
                // Add refinements
                refinements: {
                    variant: {
                        versions: {
                            value: []
                        },
                        flags: {
                            value: ["0x1"],
                            exact: true
                        },
                        metadata: {}
                    }
                }
            };

            const results = database.getMatchingFilesByBox([box]);

            expect(results.length).toEqual(3);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });

        it("with a 0x773 flag on trun", () => {
            const box: SearchResultRefined<Box> = {
                ...getBox("trun"),
                // Add refinements
                refinements: {
                    variant: {
                        versions: {
                            value: []
                        },
                        flags: {
                            value: ["0x1", "0x4", "0x100", "0x200"],
                            exact: true
                        },
                        metadata: {}
                    }
                }
            };

            const results = database.getMatchingFilesByBox([box]);

            expect(results.length).toEqual(2);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });

        it("with a 0x773 flag on trun (no exact match)", () => {
            const box: SearchResultRefined<Box> = {
                ...getBox("trun"),
                // Add refinements
                refinements: {
                    variant: {
                        versions: {
                            value: []
                        },
                        flags: {
                            value: ["0x1", "0x4", "0x100", "0x200"],
                            exact: false
                        },
                        metadata: {}
                    }
                }
            };

            const results = database.getMatchingFilesByBox([box]);

            expect(results.length).toEqual(9);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });

        it("with version 0 on trun", () => {
            const box: SearchResultRefined<Box> = {
                ...getBox("trun"),
                // Add refinements
                refinements: {
                    variant: {
                        versions: {
                            value: [0]
                        },
                        flags: {
                            value: [],
                            exact: false
                        },
                        metadata: {}
                    }
                }
            };

            const results = database.getMatchingFilesByBox([box]);

            expect(results.length).toEqual(18);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });

        it("with version 1 on trun", () => {
            const box: SearchResultRefined<Box> = {
                ...getBox("trun"),
                // Add refinements
                refinements: {
                    variant: {
                        versions: {
                            value: [1]
                        },
                        flags: {
                            value: [],
                            exact: false
                        },
                        metadata: {}
                    }
                }
            };

            const results = database.getMatchingFilesByBox([box]);

            expect(results.length).toEqual(3);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });

        it("with a 0x773 flag and version 0 on trun", () => {
            const box: SearchResultRefined<Box> = {
                ...getBox("trun"),
                // Add refinements
                refinements: {
                    variant: {
                        versions: {
                            value: [0]
                        },
                        flags: {
                            value: ["0x1", "0x4", "0x100", "0x200"],
                            exact: true
                        },
                        metadata: {}
                    }
                }
            };

            const results = database.getMatchingFilesByBox([box]);

            expect(results.length).toEqual(2);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });

        it("with a 0x773 flag and version 0 on trun (no exact match)", () => {
            const box: SearchResultRefined<Box> = {
                ...getBox("trun"),
                // Add refinements
                refinements: {
                    variant: {
                        versions: {
                            value: [0]
                        },
                        flags: {
                            value: ["0x1", "0x4", "0x100", "0x200"],
                            exact: false
                        },
                        metadata: {}
                    }
                }
            };

            const results = database.getMatchingFilesByBox([box]);

            expect(results.length).toEqual(7);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });
    });

    describe("get files with metadata", () => {
        beforeEach(async () => {
            await database.updateDatabase([]);
        });

        it("get all flavors of 'iso6'", () => {
            const box = getBox("iso6");
            const results = database.getMatchingFilesByBox([box]);

            expect(results.length).toEqual(24);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });

        it("get major brands of 'iso6'", () => {
            const box: SearchResultRefined<Box> = {
                ...getBox("iso6"),
                // Add refinements
                refinements: {
                    variant: {
                        versions: {
                            value: []
                        },
                        flags: {
                            value: [],
                            exact: false
                        },
                        metadata: {
                            BrandFlavor: "Major"
                        }
                    }
                }
            };

            const results = database.getMatchingFilesByBox([box]);

            expect(results.length).toEqual(9);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });
    });

    describe("files", () => {
        beforeEach(async () => {
            await database.updateDatabase([]);
        });

        it("should return 3 files for stz2", () => {
            const results = database.getMatchingFilesByBox([getBox("stz2")]);

            expect(results.length).toEqual(3);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });

        it("should return 2 files for meta under trak", async () => {
            await database.updateDatabase([{ container: "$trak" }]);
            const results = database.getMatchingFilesByBox([getBox("meta", "FullBox")]);

            expect(results.length).toEqual(2);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });

        it("should return 12 files for idat under =file.meta", async () => {
            await database.updateDatabase([{ container: "=$file.$meta" }]);
            const results = database.getMatchingFilesByBox([getBox("idat")]);

            expect(results.length).toEqual(12);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });

        it("should return 14 files for idat under file.meta", async () => {
            await database.updateDatabase([{ container: "$file.$meta" }]);
            const results = database.getMatchingFilesByBox([getBox("idat")]);

            expect(results.length).toEqual(14);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });

        it("should return 5 files for hdlr under moov.FullBox", async () => {
            await database.updateDatabase([{ container: "$moov.#FullBox" }]);
            const results = database.getMatchingFilesByBox([getBox("hdlr")]);

            expect(results.length).toEqual(5);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });

        it("should return 5 files for hdlr under moov.meta", async () => {
            await database.updateDatabase([{ container: "$moov.$meta" }]);
            const results = database.getMatchingFilesByBox([getBox("hdlr")]);

            expect(results.length).toEqual(5);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });

        it("should return 3 files for hdlr under =moov.meta", async () => {
            await database.updateDatabase([{ container: "=$moov.$meta" }]);
            const results = database.getMatchingFilesByBox([getBox("hdlr")]);

            expect(results.length).toEqual(3);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });

        it("should return 2 files for hdlr under =moov.trak.meta", async () => {
            await database.updateDatabase([{ container: "=$moov.$trak.$meta" }]);
            const results = database.getMatchingFilesByBox([getBox("hdlr")]);

            expect(results.length).toEqual(2);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });

        it("should return 3 files for meta under =moov", async () => {
            await database.updateDatabase([{ container: "=$moov" }]);
            const results = database.getMatchingFilesByBox([getBox("meta", "FullBox")]);

            expect(results.length).toEqual(3);
            expect(results.map((r) => r.item.abs_filepath)).toMatchSnapshot();
        });

        it("should return more than 0 files after removing a container filter", async () => {
            await search.search("meta", [{ type: "container", value: "$trak" }]);
            const { boxes } = await search.search("mvex", []);
            const wrappedBoxes = boxes.map((box) => getBox(box.item.fourcc));

            const files = database.getMatchingFilesByBox(wrappedBoxes);

            expect(files.length).toBeGreaterThan(0);
        });
    });

    describe("dictionary", () => {
        it("should return a correct snapshot for =$trak", async () => {
            await database.updateDatabase([{ container: "=$trak" }]);
            const sorted = {
                fourccs: database.dictionary.fourccs.sort(),
                types: database.dictionary.types.sort()
            };
            expect(sorted).toMatchSnapshot();
        });

        it("should return a correct snapshot for =$moov", async () => {
            await database.updateDatabase([{ container: "=$moov" }]);
            const sorted = {
                fourccs: database.dictionary.fourccs.sort(),
                types: database.dictionary.types.sort()
            };
            expect(sorted).toMatchSnapshot();
        });
    });
});
