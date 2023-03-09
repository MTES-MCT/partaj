# pylint: disable=too-many-nested-blocks
"""
Class to transform rich text view front component to text format
"""
import json

from fpdf import FPDF, HTMLMixin
from sentry_sdk import capture_message


class MyFPDF(FPDF, HTMLMixin):
    """
    custom fpdf class
    """


class TransformProsemirrorPdf:
    """
    Transform objects with properties that contain ProseMirror-formatted text to a text.
    """

    list_type = {"bullet_list": "List Bullet", "ordered_list": "List Number"}
    list_type_open = {"bullet_list": "<ul>", "ordered_list": "<ol>"}
    list_type_close = {"bullet_list": "</ul>", "ordered_list": "</ol>"}

    def __init__(self):
        self.html = ""

    def referral_to_pdf(self, text):
        """
        Transform Referral into a text
        """
        self.transform_richtext(text)
        pdf = MyFPDF()
        pdf.add_page()
        pdf.write_html(self.html.replace("’", r"'"))

        pdf.output("reponse.pdf")

    def referral_to_pdf2(self, text):
        """
        Transform Referral into a text
        """

        self.transform_richtext(text)
        pdf = MyFPDF()
        pdf.add_page()
        pdf.write_html(self.html.replace("’", r"'"))

        return pdf

    def transform_richtext(self, text):
        """
        Transform text from prosemirror format to docx format.
        """
        try:
            data = json.loads(text)
            for paragraph in data["doc"]["content"]:
                if paragraph["type"] == "paragraph":
                    if "content" in paragraph:
                        for content in paragraph["content"]:
                            if content["type"] == "text":
                                self.transform_text(content)
                        self.html = self.html + "<br/>"

                elif paragraph["type"] in self.list_type:
                    self.transform_list(paragraph["content"])

                elif paragraph["type"] == "blockquote":
                    self.transform_blockquote(paragraph["content"])

                elif paragraph["type"] == "heading":
                    self.transform_heading(paragraph)
                else:
                    capture_message(
                        f"Transform prosemirror pdf PARAGRAPH not handling {paragraph['type']}",
                        "error",
                    )

        except ValueError:
            self.html = text
            return

    def transform_heading(self, heading):
        """
        Transform heading to html heading
        """
        self.html = self.html + "<H" + str(heading["attrs"]["level"]) + ">"
        self.html = self.html + heading["content"][0]["text"]
        self.html = self.html + "<H" + str(heading["attrs"]["level"]) + "/>"

    def transform_text(self, text):
        """
        Transform text to docx text format.
        """

        if "marks" in text:
            for mark in text["marks"]:
                if mark["type"] == "strong":
                    self.html = self.html + "<b>" + text["text"] + "</b>"
                elif mark["type"] == "em":
                    self.html = self.html + "<i>" + text["text"] + "</i>"
                elif mark["type"] == "underline":
                    self.html = self.html + "<u>" + text["text"] + "</u>"
                else:
                    capture_message(
                        f"Transform prosemirror pdf TEXT not handling {mark['type']}",
                        "error",
                    )
        else:
            self.html = self.html + text["text"]

    def transform_list(self, list_to_transform):
        """
        Transform recursively list to text.
        """
        for list_item in list_to_transform:
            for list_item_content in list_item["content"]:
                if (
                    list_item_content["type"] in self.list_type
                ):  # if list  => transform list
                    self.transform_list(list_item_content["content"])
                elif list_item_content["type"] == "paragraph":
                    self.html = self.html + "<br/>"
                    if "content" in list_item_content:
                        for item_text in list_item_content["content"]:
                            self.html = self.html + item_text["text"] + "<br/>"
                else:
                    capture_message(
                        f"Transform prosemirror pdf LIST not handling {list_item_content['type']}",
                        "error",
                    )

    def transform_blockquote(self, blockquote_list):
        """
        Transform recursively blockquote to docx blockquote format.
        """
        for blockquote_item in blockquote_list:
            if blockquote_item["type"] == "paragraph":
                self.html = self.html + "<br/>"

                if "content" in blockquote_item:
                    for content in blockquote_item["content"]:
                        if content["type"] == "text":
                            self.html = self.html + content["text"]

            elif blockquote_item["type"] == "blockquote":  # if text  => transform text
                self.transform_blockquote(blockquote_item["content"])

            elif (
                blockquote_item["type"] in self.list_type
            ):  # if list   => transform list
                # add new paragraph
                self.transform_list(blockquote_item["content"])

            else:
                capture_message(
                    f"Transform prosemirror pdf PARAGRAPH not handling {blockquote_item['type']}",
                    "error",
                )
