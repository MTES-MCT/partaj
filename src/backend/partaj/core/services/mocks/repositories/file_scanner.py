from ...repositories import ScanFileResult


class FileScannerMock:
    def scan_file(self, file) -> ScanFileResult:
        return {
            'id': '12345',
            'status': 'OK'
        }