"""
File scanner service
"""
from typing import TypedDict

from django.conf import settings

import requests

# pylint: disable=broad-except


class ScanFileResult(TypedDict):
    """
    Response type from file scanner server
    """

    id: str
    status: str


class FileScanner:
    """
    File scanner repository interacting with external file scanner service
    """

    def __init__(self):

        self.url = settings.FILE_SCANNER_SERVER

    def scan_file(self, file) -> ScanFileResult:
        """
        Sending file buffer to a server and returning its result
        """
        try:
            response = requests.post(self.url, files={"file": file})

            return response.json()
        except Exception:
            return {"status": "error", "id": None}
