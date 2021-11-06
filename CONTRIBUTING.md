# Contributing new file to conformance suite

Let's ssay you want to add `FOO.mp4` to the conformance suite. The general apporach would look something like this:

- upload `FOO.mp4` to MPEG conformance file server: /MPEG-04/Part32-FF_Conformance
  - if the file is approved by the MPEG FF group, upload it to `published` directory
  - if the file is under consideration (TuC) upload it to `under_consideration` directory
- run the helper script on your file to generate `FOO.json`
- manually add or update information in `FOO.json`
- run the helper script on your `FOO.json` to generate `FOO_structure.json` file
- create a new pull request to this repository where you add `FOO.json` and `FOO_strucure.json` to [file_features](./file_features) folder

TODO: provide more details on the tools and how to use them

After PR is submitted GitHub acion is executed to check for errors. It will go through all `filepath` entries which were modified and probe (HTTP HEAD) if files are accessible from `https://conformance.mpeg.expert/ISOBMFF/ + filepath`.
