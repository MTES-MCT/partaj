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
