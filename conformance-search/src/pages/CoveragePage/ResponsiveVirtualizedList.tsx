import React, { ComponentType } from "react";
import Fuse from "fuse.js";
import { FixedSizeList as List } from "react-window";
import type { ListChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

const ITEM_SIZE = 24;

export default function ResponsiveVirtualizedList({
    items,
    children,
    itemComponent
}: {
    items: Fuse.FuseResult<string>[];
    children: React.ReactNode;
    itemComponent: ComponentType<ListChildComponentProps<Fuse.FuseResult<string>[]>>;
}) {
    return (
        <div
            className="flex flex-col last:grow [&:nth-of-type(even)]:mt-6"
            style={{
                minHeight: `${Math.min(items.length + 1, 16) * ITEM_SIZE}px`
            }}
        >
            {children}
            <AutoSizer>
                {({ height, width }) => {
                    return (
                        <List
                            height={(height || 0) - ITEM_SIZE} // There is one sticky header row
                            itemCount={items.length}
                            itemData={items}
                            itemSize={ITEM_SIZE}
                            width={width || 0}
                        >
                            {itemComponent}
                        </List>
                    );
                }}
            </AutoSizer>
        </div>
    );
}
