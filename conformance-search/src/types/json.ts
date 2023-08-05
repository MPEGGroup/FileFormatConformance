export type Coverage = {
    lists: {
        boxes: {
            covered: Array<string>;
            not_covered: Array<string>;
            under_consideration: Array<string>;
        };
        features: {
            covered: Array<string>;
            not_covered: Array<string>;
            under_consideration: Array<string>;
        };
    };
    path_file_map: {
        count: number;
        non_empty: number;
        overall_coverage: number;
        published: {
            count: number;
            coverage: number;
        };
        under_consideration: {
            count: number;
            coverage: number;
        };
    };
    feature_file_map: {
        count: number;
        published_features: number;
        under_consideration_features: number;
        features_from_spec: number;
        features_from_file: number;
    };
    files: {
        count: number;
        published_count: number;
        under_consideration_count: number;
    };
    boxes: {
        count: number;
    };
    spec_info: Array<{
        ISO: string;
        name: string;
        version: number;
        amendmends?: Array<string>;
        corrigenda?: Array<string>;
    }>;
};

export type FileMetadata = {
    contributor: string;
    description: string;
    license: string;
    md5: string;
    rel_filepath: string;
    abs_filepath: string;
    version: number;
    published: boolean;
    associated_files: string[];
    mdms_number: string;
    features: string[];
    conforms_to: {
        ISO: string;
        version: number;
        amendmends?: Array<string>;
        corrigenda?: Array<string>;
    }[];
    notes:
        | string
        | {
              [key: string]: unknown;
          };
};

export type FeatureFileMap = {
    key: string;
    description: string;
    spec: string;
    added_from_file: "spec" | "file";
    files: string[];
};

export type Files = {
    not_found: string[];
    path_file_map: {
        [path: string]: {
            [variant: string]: string[];
        };
    };
    feature_file_map: {
        [feature: string]: FeatureFileMap;
    };
    file_metadata: {
        [file: string]: FileMetadata;
    };
    boxes: {
        [box: string]: string[][];
    };
};

export type Dictionary = {
    fourccs: string[];
    types: string[];
    specs: string[];
    registered_types: string[];
};

export type Hierarchy = {
    [key: string]: Hierarchy;
};
