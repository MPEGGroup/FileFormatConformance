import argparse
import subprocess
import sys
import os
import bs4
from git import Repo


MP4RA_PATH = './mp4ra'
MP4RA_URL = 'https://github.com/mp4ra/mp4ra.github.io.git'

SPEC_ENTRY = {
    'feature_type': '...',
    'type': '4CC',
    'descritpion': 'bla bla',
    'container': 'list of 4CCs'
}

SPECS = {
    '14496-12': {
        'aliases': ['ISO', 'p12'],
        'mp4ra': [],
        'gpac': []
    },
    '14496-15': {
        'aliases': ['NALu Video', 'p15'],
        'mp4ra': [],
        'gpac': []
    },
    '14496-30': {
        'aliases': ['ISO-Text', 'p30'],
        'mp4ra': [],
        'gpac': []
    },
    '23008-12': {
        'aliases': ['HEIF', 'iff'],
        'mp4ra': [],
        'gpac': []
    }
}

FEATURE_TYPES = ['track_references', 'track_groups', 'item_references', 'sample_groups', 'boxes']


def execute_cmd(cmd_string):
    ret_code = subprocess.call(cmd_string, shell=True)
    if not ret_code == 0:
        print(f'ERROR: {cmd_string} returned {ret_code}')
    return ret_code


def feature_spec_gpac():
    print('Extract boxes using GPACs MP4Box and group them by the spec')

    parser = argparse.ArgumentParser(description='Use GPAC MP4Box to create a set of standard features')
    parser.add_argument('-o', '--out', help='Output directory where files will be written to')
    args = parser.parse_args()

    ret_code = execute_cmd('MP4Box')
    if not ret_code == 0:
        print('MP4Box is not installed on your system')
        sys.exit(-1)

    # get/update MP4RA source
    if not os.path.exists(MP4RA_PATH):
        print(f'clone MP4RA repo {MP4RA_URL} to {MP4RA_PATH}')
        Repo.clone_from(MP4RA_URL, MP4RA_PATH, branch='dev')
    # else:
    #     print(f'pull MP4RA in {MP4RA_PATH}')
    #     repo = Repo(MP4RA_PATH)
    #     repo.remotes.origin.pull()

    # pipe MP4Box -boxes to stdout and store it in out
    process = subprocess.Popen(['MP4Box', '-boxes'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = process.communicate()

    soup = bs4.BeautifulSoup(out, 'lxml')

    trefs = soup.find_all('trackreferencetypebox')
    irefs = soup.find_all('itemreferencebox')
    sgpds = soup.find_all('samplegroupdescriptionbox')
    trgrs = soup.find_all('trackgrouptypebox')

    print(f'number of tref = {len(trefs)}')
    specs = set()
    for box in soup.boxes:
        if not isinstance(box, bs4.Tag):
            continue
        # print(f'box: {box}')
        if box.has_attr('specification'):
            # print(box['specification'])
            specs.add(box['specification'])
    for spec in specs:
        print(spec)
