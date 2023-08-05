import Fuse from "fuse.js";
import { FileMetadata } from "./json";

export type Box = {
    fourcc: string;
    spec: string;
    codec: string;
    description: string;
    type: string;
    versions: number[];
    flags: (
        | {
              name: string;
              value: string;
              description: string;
          }
        | {
              wildcard: string;
          }
    )[];
    containers: {
        fourcc: string;
        type: string;
    }[];
    syntax: string;
};

export type Feature = {
    name: string;
    description: string;
    spec: string;
};

export type Filter = {
    type: string;
    value: string;
};

export type FilterConverted = {
    [key: string]: string;
};

export type SearchResult<T> = {
    item: T;
    score: number;
    actualScore: number;
    refIndex: number;
};

export type SearchResultRefined<T> = SearchResult<T> & {
    count: number;
    type: string;
    exclude: boolean;
    refinements?: {
        variant: {
            versions: {
                value: number[];
            };
            flags: {
                value: string[];
                exact: boolean;
            };
        };
    };
};

export type FuseSearchWithScore<T> = Fuse.FuseResult<T> & {
    score: number;
    actualScore: number;
};

export type FileSearchResult = {
    item: FileMetadata;
    matches: {
        type: string;
        value: string;
    }[];
};

export type CoverageResults = {
    boxes: {
        covered: Fuse.FuseResult<string>[];
        not_covered: Fuse.FuseResult<string>[];
        under_consideration: Fuse.FuseResult<string>[];
        [key: string]: Fuse.FuseResult<string>[];
    };
    features: {
        covered: Fuse.FuseResult<string>[];
        not_covered: Fuse.FuseResult<string>[];
        under_consideration: Fuse.FuseResult<string>[];
        [key: string]: Fuse.FuseResult<string>[];
    };
};
