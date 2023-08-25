# File Format Conformance Framework

[![Test](https://github.com/MPEGGroup/FileFormatConformance/actions/workflows/test.yml/badge.svg)](https://github.com/MPEGGroup/FileFormatConformance/actions/workflows/test.yml)

## Overview

Welcome to the File Format Conformance Framework, a repository dedicated to supporting the conformance resources for specifications developed by the MPEG Systems File Format group. This framework is based on ISO/IEC 14496-32 and contains conformance files for various specifications, such as:

- ISOBMFF: 14496-12
- MP4: 14496-14
- NALUFF: 14496-15
- Text: 14496-30
- HEIF: 23008-12

The main goals for the File Format Conformance Framework are:

- to provide a way to contribute new files to the conformance suite.
- to manage existing files and gather additional metadata associated with the files.
- to create a dump of the contents of the files by utilizing automation tools with the ability to add additional information which could not be automatically determined.
- to export all features (e.g. boxes, sample groups, etc.) from our specifications to a json format which we can later use to map conformance files to them which claim to be conformant to these features.
- to utilize automation tools to check for validity of contributed files by checking the metadata extracted from specifications (this metadata includes checking box types, version, flags, location of the boxes, user defined features from specifications which files claim to be conformant to, etc.).
  > NOTE: This framework **DOES NOT** validate the conformance of each feature, but rather provides a mapping from contributed files to features that are defined in our specifications. We check for correct box definitions and locations as well as defined versions and flags.
- to automate validation of the registered boxes from [MP4RA](https://mp4ra.org/).
- to provide visualization of existing files and its mapping to specifications, as well as providing a search tool to quickly find files with desired features.
- to visualize the coverage page, which shows how many features can be found in files contributed to the framework. This information is used to understand the current status of the files that we have currently in our suite and how many files we still need to gather to provide example files to every feature defined our specifications.

Conformance files themselves are stored on [this GitHub repository](https://github.com/MPEGGroup/FileFormatConformance) using the Git Large File Storage (LFS).

The design of the framework allows for easy extensions to support new specifications and file formats. The addition of new specifications or amendments to the framework is as simple as providing the necessary metadata.

## Contributing

We encourage your contributions! If you identify any issues with the metadata or the functionality of this framework or if you can contribute conformance files, feel free to [open an issue](https://github.com/MPEGGroup/FileFormatConformance/issues) or contribute directly to [the project on GitHub](https://github.com/MPEGGroup/FileFormatConformance). Please refer to our [CONTRIBUTING.md](CONTRIBUTING.md) for information on the process for submitting new conformance files to this repository (MPEG Members only).

## License

This project operates under the Clear BSD License. For more details, please see our [LICENSE](LICENSE) file.
