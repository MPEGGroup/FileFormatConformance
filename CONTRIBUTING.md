# How to contribute to this resository

## 1. How to contribute new conformance files (for file contributors)

In order to contribute new conformance files to the framework the contributor needs to follow these steps:

- Make sure files are **small in size**. Only file format features are of interest. Follow the best practices to reduce the file size, e.g. for video use small resolution etc.
- Don't use spaces in folders or filenames.
- Bring an input contribution to MPEG which describes the files you are contributing.
  - For each file there **shall** be the following information:
    - Short description of the file.
    - Copyright information
  - For each file there _should_ be the following information
    - List of user defined features taken from specifications. E.g. ISOBMFF [user_defined.json](./data/standard_features/14496-12/user_defined.json)
    - Associated files (if applicable). These are files which are required for processing of the conformance file.
- Upload files (either in a zip together with the contribution or by providing a URL which can be used to obtain the files).

During the MPEG meeting the File Format group will collect and review the files and open a pull request to the conformance repository using the above information. After opening the PR, automation scripts will run GPAC's MP4Box and export the metadata from each file into a JSON with a suffix `_gpac.json`.

Because the MP4Box will not be able to parse new features which are currently being standardized, the contributor of the files will need to provide additional information about features / boxes the files are containing. This step comes after the PR has been opened for the conformance files to be contributed. The contributor has to follow these steps to appropriately fix the possible issues with the MP4Box’s output:

- Checkout the branch associated with the contributor’s PR
- For each contribution’s MP4Box extension file (suffix with `_gpac.ext.json`)
  - If the file does not exist, then there wasn't any unknown boxes found in the file. If you are modifying a known box then crete the file manually and add the box to the extension file.
  - Go through all the unknown boxes and provide the structure of that box and its descedants.
  - If a node is not related to your contribution, you can just skip it.
  - Add the relevant boxes to the standard features as well. Without that this contribution wouldn't be shown in the conformance search tool.
- If necessary for each conformance metadata file `<filename>.json` add or edit other fields. In particular check `associated_files`, `features`, `license` or add additional information to `notes`.
- Commit and push your modifications to that branch.
- CI scripts will validate the structure of the file and run tests to see if it’s okay to use it.

The PR will be accepted after all edits are done to completely describe conformance files in the associated PR. When the File Format group decides the file should be published, the published flag will be changed to true and the file will move from [under_consideration](./data/file_features/under_consideration/) directory to a [published](./data/file_features/published/) directory.

## 2. How to open a new PR for new conformance files

This is most likely a task of a conformance coordinator or a File Format Group Chair.

### 2.1 Install required tools (first time use)

- install [python-poetry](https://python-poetry.org/docs/)
- install [GPAC](https://gpac.wp.imt.fr/downloads/gpac-nightly-builds/)

Make sure both are added to your `PATH` environment variable, so you can call `poetry` and `MP4Box` from any directory using terminal.

### 2.2 Prepare new branch

- Create a new branch:  
  The best practice is to name the branch including the MPEG document number which was used to provide an input contribution to MPEG e.g. `m12345_isobmff_samplegroups`.
- Checkout this new branch.

### 2.3 Initialize file features json files

Let's say you have gathered files from an input contribution `m12345` in a folder like (sub-directories are also allowed):

```shell
compact_sample_groups
├── samplegroups_defrag_compact.mp4
├── samplegroups_defrag_normal.mp4
└── samplegroups_fragmeted.mp4
```

and now you want to add them to a new branch `m12345_<spec>_<feature>` which you already checked out.

Go to the `src` folder and run the `contribute-files` command:

```shell
cd src
poetry install #(if you are using for the first time)
poetry run contribute-files -i <path_to_your_files_dir>
```

The script will ask you several questions. e.g.: who is the contributor (company name), ask for a short description of each file and will create (or update) the json files inside `file_features` directory.

### 2.4 Create a pull request

Create a pull request with the new (or modified) files.

## 3. How to update specifications

TBD

## 4. How to add new specifications

TBD
