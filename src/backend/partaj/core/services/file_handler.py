"""
Multiple classes that perform operations on files
"""
from io import BytesIO

import mammoth
from pdfminer.high_level import extract_text


class TextExtractor:
    """Extract files text"""

    @staticmethod
    def from_pdf(document):
        """Extract pdf text"""
        with document.file.open("rb") as file:
            text = extract_text(BytesIO(file.read()))

        return text

    @staticmethod
    def from_docx(document):
        """Extract docx text"""
        with document.file.open("rb") as file:
            result = mammoth.extract_raw_text(file)
        return result.value


class HtmlConverter:
    """Convert files to html"""

    @staticmethod
    def from_docx(document):
        """Convert docx to html"""
        with document.file.open("rb") as file:
            result = mammoth.convert_to_html(file)

        return result.value, result.messages


class ExtensionValidator:
    """Check if file extension is valid"""

    WHITELIST = [
        "doc",
        "docx",
        "xls",
        "csv",
        "xlsx",
        "pdf",
        "odt",
        "ods",
        "png",
        "jpeg",
        "jpg",
        "ppt",
        "pptx",
        "ai",
        "eps",
        "psd",
        "tiff",
        "mp4",
        "eml",
    ]

    @staticmethod
    def validate_format(extension):
        """Check file extension"""
        return 0 if extension not in ExtensionValidator.WHITELIST else 1

    @staticmethod
    def get_extension(filename):
        """Get file extension"""
        splitted_filename = filename.split(".")
        if len(splitted_filename) == 1:
            return 0
        return splitted_filename[-1].lower()
