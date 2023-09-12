from loguru import logger

from construct.boxes import main as construct_boxes_main
from construct.dictionary import main as construct_dictionary_main
from construct.hierarchy import main as construct_hierarchy_main
from construct.files import main as construct_files_main

from common import check_logs_for_ci


def main():
    construct_boxes_main()
    logger.success("Construct boxes")
    construct_hierarchy_main()
    logger.success("Construct hierarchy")
    construct_files_main()
    logger.success("Construct files")
    construct_dictionary_main()
    logger.success("Construct dictionary")

    check_logs_for_ci()


if __name__ == "__main__":
    main()
