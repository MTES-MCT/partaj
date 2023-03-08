"""
Class to transform rich text view front component to text format
"""
import json

from sentry_sdk import capture_message


class TransformProsemirrorText:
    """
    Transform objects with properties that contain ProseMirror-formatted text to a text.
    """

    list_type = {"bullet_list": "List Bullet", "ordered_list": "List Number"}

    def __init__(self):
        self.raw_text = ""

    def referral_to_text(self, text):
        """
        Transform Referral into a text
        """

        self.transform_richtext(text)

        return self.raw_text

    def transform_richtext(self, text):
        """
        Transform text from prosemirror format to text.
        """
        try:
            data = json.loads(text)
            print(data)
        except ValueError:
            self.raw_text = text
            return

        for paragraph in data["doc"]["content"]:
            if paragraph["type"] == "paragraph":
                self.raw_text = self.raw_text + "\n"
                if "content" in paragraph:
                    for content in paragraph["content"]:
                        if content["type"] == "text":
                            self.raw_text = self.raw_text + content["text"]

            if paragraph["type"] in self.list_type:
                self.transform_list(paragraph["content"])

            if paragraph["type"] == "blockquote":
                self.transform_blockquote(paragraph["content"])

            if paragraph["type"] == "heading":
                for content in paragraph["content"]:
                    if content["type"] == "text":
                        self.raw_text = self.raw_text + content["text"] + "\n"
                    else:
                        capture_message(
                            f"Transform prosemirror text RICTEXT not handling {content['type']}",
                            "error",
                        )

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
                    self.raw_text = self.raw_text + "\n"
                    if "content" in list_item_content:
                        for item_text in list_item_content["content"]:
                            self.raw_text = self.raw_text + item_text["text"]
                else:
                    capture_message(
                        f"Transform prosemirror text LIST not handling {list_item_content['type']}",
                        "error",
                    )

    def transform_blockquote(self, blockquote_list):
        """
        Transform recursively blockquote to docx blockquote format.
        """
        for blockquote_item in blockquote_list:
            if blockquote_item["type"] == "paragraph":

                self.raw_text = self.raw_text + "\n"

                if "content" in blockquote_item:
                    for content in blockquote_item["content"]:
                        if content["type"] == "text":
                            self.raw_text = self.raw_text + content["text"]

            elif blockquote_item["type"] == "blockquote":  # if text  => transform text
                self.transform_blockquote(blockquote_item["content"])

            elif (
                blockquote_item["type"] in self.list_type
            ):  # if list   => transform list
                # add new paragraph
                self.transform_list(blockquote_item["content"])

            elif blockquote_item["type"] == "heading":
                for content in blockquote_item["content"]:
                    self.raw_text = self.raw_text + content["text"] + "\n"
            else:
                capture_message(
                    f"Transform prosemirror text BLOCKQUOTE not handling {blockquote_item['type']}",
                    "error",
                )
