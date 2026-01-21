"""
Class ErrorResponseFactory returning error response
"""

from rest_framework.response import Response


class ErrorResponseFactory:
    """Create response with error well formatted"""

    @staticmethod
    def create_error_415(extension):
        """Create error response when media is not in an app supported format"""
        return Response(
            status=415,
            data={
                "code": "error_file_format_forbidden",
                "errors": [f"Uploaded File cannot be in {extension} format."],
            },
        )

    @staticmethod
    def create_error_file_scan_ko():
        """Create error response when file scanner detects a virus"""
        return Response(
            status=422,
            data={
                "code": "error_file_scan_ko",
                "errors": ["Uploaded File failed to pass file scanner inspection."],
            },
        )

    @staticmethod
    def create_default_error():
        """Create default error"""
        return Response(
            status=400,
            data={
                "code": "error_unknown",
            },
        )

    @staticmethod
    def create_error(message):
        """Create error with custom message"""
        return Response(
            status=400,
            data={
                "message": message,
            },
        )
