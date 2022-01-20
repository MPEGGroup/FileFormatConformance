# How to contribute new files to conformance suite

## 1. Install required tools

- install [python-poetry](https://python-poetry.org/docs/)
- install [GPAC](https://gpac.wp.imt.fr/downloads/gpac-nightly-builds/)

Make sure both are added to your `PATH` environment variable, so you can call `poetry` and `MP4Box` from any directory using terminal.

## 2. Prepare your files

Put all the files you want to contribute into a single directory (sub-directories are also allowed). E.g.:

```shell
compact_sample_groups
├── samplegroups_defrag_compact.mp4
├── samplegroups_defrag_normal.mp4
└── samplegroups_fragmeted.mp4
```

Also upload this folder to MPEG **conformance** file server under `/MPEG-04/Part32-FF_Conformance/under_consideration`.

## 3. Initialize file features json files

Go to feature extractor folder and run the `contribute-files` command:

```shell
cd src/feature-extractor
poetry install #(if you are using for the first time)
poetry run contribute-files -i <path_to_your_file_dir>
```

The script will ask you several questions. e.g.: who is the contributor (your company name), ask for a short description of each file and will create (or update) the json files inside `file_features` directory.

## 4. Add more information (whenever possible)

You can manually add additional information to generated json files. For example you can edit the following entries:

- `associated_files`: provide a list of files related to this file (created from, needed for processing, etc.)
- `features`: list of user-defined features (This should be automatically extracted in the future)
- `notes`: Any other notes which would allow people to understand the conformance files better.

## 5. Create a pull request

Create a pull request with the new (or modified) files.
