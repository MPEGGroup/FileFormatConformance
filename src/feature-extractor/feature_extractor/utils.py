import os
import hashlib
import subprocess
import json


def execute_cmd(cmd_string):
    ret_code = subprocess.call(cmd_string, shell=True)
    if not ret_code == 0:
        print(f'ERROR: {cmd_string} returned {ret_code}')
    return ret_code


def make_dirs_from_path(dir_or_file_path):
    """
    Make all directories from a path. If a path includes a filename with extension, ignore the filename
    """
    base, ext = os.path.splitext(dir_or_file_path)
    if ext == '' and not os.path.exists(dir_or_file_path):
        os.makedirs(dir_or_file_path)
    else:
        dir_path, filename = os.path.split(dir_or_file_path)
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)


def compute_file_md5(file_path):
    with open(file_path, 'rb') as f:
        file_hash = hashlib.md5()
        while chunk := f.read(8192):
            file_hash.update(chunk)
    return file_hash.hexdigest()


def dump_to_json(out_file, obj):
    with open(out_file, 'w') as f:
        json.dump(obj, f, indent=2)

def read_json(in_file):
    with open(in_file, 'r') as f:
        data = json.load(f)
        return data
