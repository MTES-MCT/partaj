"""
Return the key equivalence between keys
"""


class ESSortMapper:
    """
    Return the key equivalence between referral lite and ES referral sorting keyword
    """

    mapping = {
        "id": "case_number",
        "created_at": "created_at",
        "due_date": "due_date",
        "published_date": "published_date",
        "object": "object.keyword",
        "requesters": "requester_users.id",
        "assignees": "assignees_sorting",
        "state": "state",
    }

    @staticmethod
    def map(key):
        """Get file scanner repository service depending on setup"""

        if key not in ESSortMapper.mapping:
            return None

        return ESSortMapper.mapping.get(key)
