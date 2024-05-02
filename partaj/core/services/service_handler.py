"""
Multiple classes that perform operations on files
"""

from django.conf import settings

from ..services.mocks.repositories.file_scanner import FileScannerMock
from ..services.repositories.file_scanner import FileScanner


class ServiceHandler:
    """Return instanciated services depending on setup or params"""

    @staticmethod
    def get_file_scanner_service():
        """Get file scanner repository service depending on setup"""

        return FileScannerMock() if settings.OFFLINE else FileScanner()
