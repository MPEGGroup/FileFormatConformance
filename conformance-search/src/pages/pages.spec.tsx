// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Search from "@/lib/search";
import CoverageView from "@/pages/CoveragePage";
import HomeView from "@/pages/SearchPage";

Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
    }))
});

Object.defineProperty(window, "scrollTo", {
    writable: true,
    value: vi.fn()
});

describe("Views", () => {
    it("should render HomeView", async () => {
        render(
            <BrowserRouter>
                <HomeView />
            </BrowserRouter>
        );
        const text = await screen.findByText(/Coverage Statistics/i);
        expect(text).toBeInTheDocument();
    });

    it("should render CoverageView", async () => {
        render(
            <BrowserRouter>
                <CoverageView />
            </BrowserRouter>
        );
        const text = await screen.findByText(/File Statistics/i);
        expect(text).toBeInTheDocument();
    });
});

// FIXME: GitHub Actions fails on this test
describe.skip("Search", () => {
    const search = async (query: string) => {
        // Render
        act(() => {
            render(
                <BrowserRouter>
                    <HomeView />
                </BrowserRouter>
            );
        });

        // Search for the query and wait for the results to appear
        const input = await screen.findByTestId(/search-input/i);
        act(() => {
            fireEvent.input(input, {
                target: { value: query }
            });
        });
    };

    const validate = async (query: string | number[]) => {
        let resultCounts = query;
        if (typeof query === "string") {
            await act(async () => {
                // Get actual result counts
                const mSearch = await Search.getInstance();
                const { boxes, features } = await mSearch.search(query);
                const { files } = mSearch.refine(
                    boxes.map((box) => ({
                        ...box,
                        exclude: false,
                        count: 0,
                        type: "box"
                    })),
                    features.map((feature) => ({
                        ...feature,
                        exclude: false,
                        count: 0,
                        type: "feature"
                    })),
                    true
                );
                resultCounts = [boxes.length + features.length, files.length];
            });
        }

        // Wait for the results to appear
        await waitFor(() => screen.getAllByTestId(/list-view/i));
        const lists = await screen.findAllByTestId(/list-view/i);
        expect(lists.length).toBe(2);

        // Left list
        const llist = lists[0];
        const lelements = within(llist).getAllByTestId("list-item");
        const lresults = within(llist).getAllByTestId("list-item-key");
        const lresultTitle = within(llist).getByText(/Search resulted in/i, {
            exact: false
        });
        expect(lresultTitle.textContent).toBe(`Search resulted in ${resultCounts[0]} hits`);
        expect(lresults.length).toBe(resultCounts[0]);

        const rlist = lists[1];
        const relements = within(rlist).getAllByTestId("list-item");
        const rresults = within(rlist).getAllByTestId("list-item-key");
        const rresultTitle = within(rlist).getByText(/Search resulted in/i, {
            exact: false
        });
        expect(rresultTitle.textContent).toBe(`Search resulted in ${resultCounts[1]} hits`);
        expect(rresults.length).toBe(resultCounts[1]);

        return {
            lists: [lresults, rresults],
            elements: [lelements, relements],
            resultCounts
        };
    };

    it("should perform a search", async () => {
        await search("=trun");
        const {
            lists: [lresult, rresult]
        } = await validate("=trun");

        // Check that first result is trun box
        expect(lresult[0].textContent).toBe("trun");

        // Check that second file result is 21_segment.mp4
        expect(rresult[1].textContent).toBe("21_segment.mp4");
    });

    it("should be able to select/unselect a result", async () => {
        await search("trun");
        const {
            elements: [lelements],
            resultCounts
        } = await validate("trun");

        // Uncheck the first result
        const checkbox = within(lelements[1]).getByTestId(/list-item-checkbox/i);
        act(() => {
            fireEvent.click(checkbox);
        });

        // Check that box order and files are updated
        const newCounts: number[] = resultCounts as number[];
        newCounts[1] += 1;
        await validate(newCounts);
    });

    it("should be able to select version 0", async () => {
        await search("=trun");
        const {
            elements: [lelements]
        } = await validate("=trun");

        // Open versions drawer
        const drawerButton = await within(lelements[0]).findByText(/Versions/i);
        act(() => {
            fireEvent.click(drawerButton);
        });

        // Wait for drawer to open
        const firstVersion = await within(lelements[0]).findByTestId(/list-item-version-0/i);
        act(() => {
            fireEvent.click(firstVersion);
        });

        // Check that files are updated
        const {
            lists: [, rresult]
        } = await validate([1, 18]);

        // Check that first file result is a4-tone-fragmented.mp4
        expect(rresult[1].textContent).toBe("a4-tone-fragmented.mp4");
    });

    it("should be able to select first flag", async () => {
        await search("=trun");
        const {
            elements: [lelements]
        } = await validate("=trun");

        // Open versions drawer
        const drawerButton = await within(lelements[0]).findByText(/Flags/i);
        act(() => {
            fireEvent.click(drawerButton);
        });

        // Wait for drawer to open
        const firstFlag = await within(lelements[0]).findByTestId(/list-item-flag-0/i);
        act(() => {
            fireEvent.click(firstFlag);
        });

        // Check that files are updated
        const {
            lists: [, rresult]
        } = await validate([1, 3]);

        // Check that first file result is a4-tone-fragmented.mp4
        expect(rresult[0].textContent).toBe("a4-tone-fragmented.mp4");
    });
});
