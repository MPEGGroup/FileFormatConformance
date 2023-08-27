// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { SearchComponent } from "@/components";
import Search from "@/lib/search";
import { StaticRouter } from "react-router-dom/server";

describe("Search Component", () => {
    beforeEach(async () => {
        // Normally it is expected that the search instance is already loaded
        await Search.getInstance();
    });

    it("should be possible to apply a container filter", async () => {
        const onResult = vi.fn();
        render(
            <StaticRouter location="/">
                <SearchComponent onResult={onResult} />
            </StaticRouter>
        );

        // Wait for component to load
        await screen.findByPlaceholderText(/Start by/i);

        // Find and click the filter button
        const filterButton = await screen.findByText(/Add a filter/i);
        fireEvent.click(filterButton);

        // Wait for filter input to appear
        const filterInput = await screen.findByPlaceholderText(/Start by typing a box/i);

        // Type in a filter
        fireEvent.input(filterInput, {
            target: { value: "trak" }
        });

        // We should have a list of results in a dropdown
        const dropdown = await screen.findByTestId("dropdown");
        const results = await within(dropdown).findAllByTestId("dropdown-item");

        // trak should be the first result
        expect(results[0].textContent).toBe("trak");

        // Go down by pressing down arrow
        fireEvent.keyDown(filterInput, { key: "ArrowDown" });
        // Now press enter
        fireEvent.keyDown(filterInput, { key: "Enter" });

        // Check that the filter is applied
        const filter = await screen.findByText(/trak/i);

        expect(filter).toBeInTheDocument();
    });
});
