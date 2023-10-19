export type Coverage = {
    not_found: {
        count: number;
        percentage: number;
        boxes: string[];
        missing_extensions: string[];
        paths: {
            [path: string]: string[];
        };
    };
    lists: {
        boxes: {
            covered: string[];
            not_covered: string[];
            under_consideration: string[];
        };
        features: {
            covered: string[];
            not_covered: string[];
            under_consideration: string[];
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
    };
    files: {
        count: number;
        published_count: number;
        under_consideration_count: number;
    };
    boxes: {
        count: number;
    };
    spec_info: {
        ISO: string;
        name: string;
        version: number;
        date: number;
        mp4ra_reference: string[];
        link: string;
        amendmends?: string[];
        corrigenda?: string[];
    }[];
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
        amendmends?: string[];
        corrigenda?: string[];
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
