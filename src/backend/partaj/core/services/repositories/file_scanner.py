from typing import TypedDict

import requests


class ScanFileResult(TypedDict):
    id: str
    status: str


class FileScanner:
    def __init__(self):
        self.url = 'https://partaj-filescanner-staging.osc-fr1.scalingo.io/api/scan/file/'

    def scan_file(self, file) -> ScanFileResult:
        try:
            response = requests.post(self.url, files={'file': file})

            return response.json()
        except Exception as e:
            return {
                'status': 'error',
                'id': None
            }