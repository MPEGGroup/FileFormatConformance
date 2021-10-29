import argparse

def extract_file_features():
    parser = argparse.ArgumentParser(description='Extract features from conformance files')
    parser.add_argument('-i', '--input', help='Input directory', required=True)
    parser.add_argument('-o', '--out', help='Output directory where files will be written to', default='./out')
    args = parser.parse_args()

    # TODO: implement me
