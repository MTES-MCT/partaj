"""
Tests for common helpers for indexers.
"""
from partaj.core.indexers.common import slice_string_for_completion

from django.test import TestCase


class IndexersCommonTestCase(TestCase):
    """
    Test utilities from the indexers common file.
    """

    def test_slice_string_for_completion(self):
        """
        Slice string method produces all substrings from the end of the passed
        string that start right after a delimiter.
        This is useful to populate an index field to be used for autocompletion,
        when we want that autocompletion to support starting at arbitrary points
        in the source string.
        """

        self.assertEqual(
            slice_string_for_completion("example string", [" "]),
            ["example string", "string"],
        )

        self.assertEqual(
            slice_string_for_completion("SG/DAJ/AJYX/AJYX9", ["/"]),
            ["SG/DAJ/AJYX/AJYX9", "AJYX9", "AJYX/AJYX9", "DAJ/AJYX/AJYX9"]
        )

        self.assertEqual(
            slice_string_for_completion("exam/ple str|ing", [" ", "|", "/"]),
            ["exam/ple str|ing", "ing", "str|ing", "ple str|ing"]
        )
