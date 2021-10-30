import argparse
import subprocess
import sys
import copy
import os
import bs4
import csv
from git import Repo
from .utils import make_dirs_from_path, execute_cmd, dump_to_json

MP4RA_PATH = './mp4ra'
MP4RA_URL = 'https://github.com/mp4ra/mp4ra.github.io.git'

SPEC_FEATURES = {
    'track_references': {
        'description': 'Track reference types',
        'entries': [],
        'gpac_only_entries': []
    },
    'track_groups': {
        'description': 'Track grouping types',
        'entries': [],
        'gpac_only_entries': []
    },
    'item_references': {
        'description': 'Item reference types',
        'entries': [],
        'gpac_only_entries': []
    },
    'sample_groups': {
        'description': 'Sample group types',
        'entries': [],
        'gpac_only_entries': []
    },
    'boxes': {
        'description': 'Boxes (also called atoms)',
        'entries': [],
        'gpac_only_entries': []
    }
}

SPECS = {
    '14496-12': {
        'aliases': ['ISO', 'p12'],
        'features': copy.deepcopy(SPEC_FEATURES),
    },
    '14496-15': {
        'aliases': ['NALu Video', 'p15'],
        'features': copy.deepcopy(SPEC_FEATURES),
    },
    '14496-30': {
        'aliases': ['ISO-Text', 'p30'],
        'features': copy.deepcopy(SPEC_FEATURES),
    },
    '23008-12': {
        'aliases': ['HEIF', 'iff'],
        'features': copy.deepcopy(SPEC_FEATURES),
    }
}


def csv_to_spec(csv_file, feature_type):
    code_idx = 0
    description_idx = 1
    spec_idx = 2
    if feature_type == 'item_references' or feature_type == 'sample_groups':
        spec_idx = 3
    csv_reader = csv.reader(csv_file, delimiter=',')
    line_idx = 0
    for row in csv_reader:
        line_idx += 1
        if line_idx == 1:
            continue
        code = row[code_idx].strip()
        code = code.replace('$20', ' ')
        description = row[description_idx].strip()
        specification = row[spec_idx].strip()
        entry = {
            'fourcc': code,
            'description': description,
            'containers': []
        }
        if specification == 'ISO':
            SPECS['14496-12']['features'][feature_type]['entries'].append(entry)
        elif specification == 'NALu Video':
            SPECS['14496-15']['features'][feature_type]['entries'].append(entry)
        elif specification == 'ISO-Text':
            SPECS['14496-30']['features'][feature_type]['entries'].append(entry)
        elif specification == 'HEIF':
            SPECS['23008-12']['features'][feature_type]['entries'].append(entry)


def extract_spec_features_mp4ra():
    print('Extract specification features using MP4RA repository')
    # get/update MP4RA source
    if not os.path.exists(MP4RA_PATH):
        print(f'clone MP4RA repo {MP4RA_URL} to {MP4RA_PATH}')
        Repo.clone_from(MP4RA_URL, MP4RA_PATH, branch='dev')
    # else:
    #     print(f'pull MP4RA in {MP4RA_PATH}')
    #     repo = Repo(MP4RA_PATH)
    #     repo.remotes.origin.pull()

    # track references
    tmp_path = os.path.join(MP4RA_PATH, 'CSV', 'track-references.csv')
    with open(tmp_path, 'r') as f:
        csv_to_spec(f, 'track_references')
    # track groups
    tmp_path = os.path.join(MP4RA_PATH, 'CSV', 'track-groups.csv')
    with open(tmp_path, 'r') as f:
        csv_to_spec(f, 'track_groups')
    # item references
    tmp_path = os.path.join(MP4RA_PATH, 'CSV', 'item-references.csv')
    with open(tmp_path, 'r') as f:
        csv_to_spec(f, 'item_references')
    # sample groups
    tmp_path = os.path.join(MP4RA_PATH, 'CSV', 'sample-groups.csv')
    with open(tmp_path, 'r') as f:
        csv_to_spec(f, 'sample_groups')
    # boxes
    tmp_path = os.path.join(MP4RA_PATH, 'CSV', 'boxes.csv')
    with open(tmp_path, 'r') as f:
        csv_to_spec(f, 'boxes')


def update_entry_from_gpac(specification, feature_type, gpac_entry):
    if specification not in SPECS:
        print(f'No such specification found: {specification}')
        sys.exit(-1)
    if feature_type not in SPECS[specification]['features']:
        print(f'Feature type is not supported: {feature_type}')
        sys.exit(-1)
    entries = SPECS[specification]['features'][feature_type]['entries']
    gpac_only_entries = SPECS[specification]['features'][feature_type]['gpac_only_entries']

    # find entry of the same type
    entry = None
    if gpac_entry['type'] == 'sgpd':
        if gpac_entry.has_attr('grouping_type'):
            entry = next((item for item in entries if item['fourcc'] == gpac_entry['grouping_type']), None)
    else:
        entry = next((item for item in entries if item['fourcc'] == gpac_entry['type']), None)

    if entry is not None:
        # we have this entry, update container if needed
        containers = gpac_entry['container'].split(' ')
        for container in containers:
            if container not in entry['containers']:
                entry['containers'].append(container)
    else:
        if gpac_entry['type'] == '00000000':
            return
        print(f'Not found: {gpac_entry["type"]} is missing in MP4RA {specification}:{feature_type}')
        # add the missing entry to gpac_only list
        if gpac_entry['type'] == 'sgpd':
            if gpac_entry.has_attr('grouping_type'):
                gpac_only_entry = {
                    'fourcc': gpac_entry['grouping_type'],
                    'containers': gpac_entry['container'].split(' ')
                }
                gpac_only_entries.append(gpac_only_entry)
        else:
            gpac_only_entry = {
                'fourcc': gpac_entry['type'],
                'containers': gpac_entry['container'].split(' ')
            }
            gpac_only_entries.append(gpac_only_entry)


def extract_spec_features_gpac():
    print('Extract specification features using GPACs MP4Box')

    ret_code = execute_cmd('MP4Box')
    if not ret_code == 0:
        print('MP4Box is not installed on your system')
        sys.exit(-1)

    # pipe MP4Box -boxes to stdout and store it in out
    process = subprocess.Popen(['MP4Box', '-boxes'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = process.communicate()

    soup = bs4.BeautifulSoup(out, 'lxml')

    for box in soup.boxes:
        if not isinstance(box, bs4.Tag):
            continue
        if not box.has_attr('specification'):
            continue
        specification = None
        if box['specification'] == 'p12':
            specification = '14496-12'
        elif box['specification'] == 'p15':
            specification = '14496-15'
        elif box['specification'] == 'p30':
            specification = '14496-30'
        elif box['specification'] == 'iff':
            specification = '23008-12'

        if box.name == 'trackreferencetypebox':
            feature_type = 'track_references'
        elif box.name == 'trackgrouptypebox':
            feature_type = 'track_groups'
        elif box.name == 'itemreferencebox':
            feature_type = 'item_references'
        elif box.name == 'samplegroupdescriptionbox':
            feature_type = 'sample_groups'
        else:
            # TODO: everyting else is treated as a box, however we might want to split to other types,
            #  e.g. sample entry, entity groups, etc.
            feature_type = 'boxes'

        if specification is None or feature_type is None:
            print(f'skip {box["specification"]}:{box.name}')
            continue

        update_entry_from_gpac(specification, feature_type, box)


def write_spec_features(output_dir):
    for spec in SPECS:
        for feature in SPECS[spec]['features']:
            out_file = os.path.join(output_dir, spec, feature + '.json')
            make_dirs_from_path(out_file)
            dump_to_json(out_file, SPECS[spec]['features'][feature])


def extract_spec_features():
    parser = argparse.ArgumentParser(description='Use MP4RA and GPAC MP4Box to create a set of standard features')
    parser.add_argument('-o', '--out', help='Output directory where files will be written to', default='./out')
    args = parser.parse_args()

    extract_spec_features_mp4ra()
    extract_spec_features_gpac()
    write_spec_features(args.out)
