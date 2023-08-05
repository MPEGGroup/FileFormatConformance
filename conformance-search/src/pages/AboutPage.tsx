/* eslint-disable tailwindcss/no-custom-classname */
import "github-markdown-css/github-markdown-light.css";
import { NavigationBar } from "@/components";

export default function AboutPage() {
    return (
        <>
            <NavigationBar />
            <div className="markdown-body container mx-auto max-w-7xl bg-paper p-8">
                <h2>Overview</h2>
                <p>
                    Welcome to the File Format Conformance Framework, a repository dedicated to
                    supporting the conformance resources for specifications developed by the MPEG
                    Systems File Format group. This framework is based on ISO/IEC 14496-32 and
                    contains conformance files for various specifications, such as:
                </p>
                <ul className="list-disc">
                    <li>ISOBMFF: 14496-12</li>
                    <li>MP4: 14496-14</li>
                    <li>NALUFF: 14496-15</li>
                    <li>Text: 14496-30</li>
                    <li>HEIF: 23008-12</li>
                </ul>
                <p>The main goals for the File Format Conformance Framework are:</p>
                <ul className="list-disc">
                    <li>to provide a way to contribute new files to the conformance suite.</li>
                    <li>
                        to manage exising files and gather additional metadata associated with the
                        files.
                    </li>
                    <li>
                        to create a dump of the contents of the files by utiilzing automation tools
                        with the ability to add additional information which could not be
                        automatically determined.
                    </li>
                    <li>
                        to export all features (e.g. boxes, sample groups, etc.) from our
                        specifications to a json format which we can later use to map conformance
                        files to them which claim to be conformant to these features.
                    </li>
                    <li>
                        to utilize automation tools to check for validity of contributed files by
                        checking the metadata extracted from specifications (this metadata includes
                        checking box types, version, flags, location of the boxes, user defined
                        features from specifications which files claim to be conformant to, etc.).
                        <blockquote>
                            <p>
                                NOTE: This framework <strong>DOES NOT</strong> validate the
                                conformance of each feature, but rather provides a mapping from
                                contributed files to features that are defined in our
                                specifications. We check for correct box definitions and locations
                                as well as defined versions and flags.
                            </p>
                        </blockquote>
                    </li>
                    <li>
                        to automate validation of the registered boxes from{" "}
                        <a href="https://mp4ra.org/">MP4RA</a>.
                    </li>
                    <li>
                        to provide visualization of exising files and its mapping to specifications,
                        as well as providing a search tool to quickly find files with desired
                        features.
                    </li>
                    <li>
                        to visualize the coverage page, which shows how many features can be found
                        in files contributed to the framework. This information is used to
                        understand the current status of the files that we have currently in our
                        suite and how many files we still need to gather to provide example files to
                        every feature defined our specifications.
                    </li>
                </ul>
                <p>
                    Conformance files themselves are stored on{" "}
                    <a href="https://github.com/MPEGGroup/FileFormatConformance">
                        this GitHub repository
                    </a>{" "}
                    using the Git Large File Storage (LFS).
                </p>
                <p>
                    The design of the framework allows for easy extensions to support new
                    specifications and file formats. The addition of new specifications or
                    amendments to the framework is as simple as providing the necessary metadata.
                </p>
                <h2>Contributing</h2>
                <p>
                    We encourage your contributions! If you identify any issues with the metadata or
                    the functionality of this framework or if you can contribute conformance files,
                    feel free to{" "}
                    <a href="https://github.com/MPEGGroup/FileFormatConformance/issues">
                        open an issue
                    </a>{" "}
                    or contribute directly to{" "}
                    <a href="https://github.com/MPEGGroup/FileFormatConformance">
                        the project on GitHub
                    </a>
                    . Please refer to our{" "}
                    <a href="https://github.com/MPEGGroup/FileFormatConformance/blob/main/CONTRIBUTING.md">
                        CONTRIBUTING.md
                    </a>{" "}
                    for information on the process for submitting new conformance files to this
                    repository (MPEG Members only).
                </p>
                <h2>License</h2>
                <p>
                    This project operates under the Clear BSD License. For more details, please see
                    our{" "}
                    <a href="https://github.com/MPEGGroup/FileFormatConformance/blob/main/LICENSE">
                        LICENSE
                    </a>{" "}
                    file.
                </p>
            </div>
        </>
    );
}
