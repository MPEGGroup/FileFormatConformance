# Conformance file features and description

Each conformance file is associated with 2 metadata files:

1. description metadata
2. auto-generated file structure

If you conribute a file to the FF conformance suite, you need to provide the description file `[FILENAME].json` with a unique file name in the following format:

```json
{
  "contributor": "...",
  "description": "...",
  "md5": "...",
  "filepath": "...",
  "version": 1,
  "features": [
    "...",
    "..."
  ]
}
```

- contributor: source of the file
- descrtiption: description of the file
- md5: md5 checksum of the file
- file: path to the file relative to the base URL https://conformance.mpeg.expert/ISOBMFF/
- version: version of the file
- features: set of feature names as defined in [standards_features](../standard_features) directory

The second file `[FILENAME]_strucure.json` is generated automatically based on the information provided in `[FILENAME].json`.
Also make sure that your file is uploaded to MEPG FS server and is accessible from [MPEG FS public URL](https://conformance.mpeg.expert/ISOBMFF).
