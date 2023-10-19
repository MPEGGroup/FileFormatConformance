import os
import sys
from loguru import logger as _logger


class LoggerWrapper:
    DEDUPLICATE = ["debug", "info", "success", "warning", "error", "critical"]

    def __init__(self):
        self.messages = set()

    def _process(self, severity, message, **kwargs):
        if message not in self.messages:
            self.messages.add(message)
            function = getattr(_logger, severity)
            function(message, **kwargs)

    def __getattribute__(self, __name: str):
        if __name in ["_process", "messages"]:
            return object.__getattribute__(self, __name)

        if __name in LoggerWrapper.DEDUPLICATE:
            return lambda message, **kwargs: self._process(__name, message, **kwargs)
        return getattr(_logger, __name)


logger = LoggerWrapper()

# If running in CI, don't add colors
if "CI" in os.environ:
    fmt = "{level: <8}: {message}"
else:
    fmt = "<level>{level: <8}: {message}</level>"

# Remove default sink
logger.remove(0)

# Add sinks
logger.add(sys.stderr, format=fmt)
logger.add("/tmp/construct.log", format=fmt, level="ERROR")
