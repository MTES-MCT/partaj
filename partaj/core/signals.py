"""
Defines all signals in the django app
"""
from django import dispatch

referral_sent = dispatch.Signal(providing_args=["referral", "created_by"])

requester_added = dispatch.Signal(
    providing_args=["referral", "requester", "created_by"]
)
follower_added = dispatch.Signal(providing_args=["referral", "follower"])
requester_deleted = dispatch.Signal(
    providing_args=["referral", "requester", "created_by"]
)

unit_member_assigned = dispatch.Signal(
    providing_args=["referral", "assignee", "assignment", "created_by"]
)
unit_member_unassigned = dispatch.Signal(
    providing_args=["referral", "assignee", "created_by"]
)
unit_assigned = dispatch.Signal(
    providing_args=[
        "referral",
        "assignment",
        "created_by",
        "unit",
        "assignunit_explanation",
    ]
)
unit_unassigned = dispatch.Signal(providing_args=["referral", "created_by", "unit"])

urgency_level_changed = dispatch.Signal(
    providing_args=["referral", "created_by", "referral_urgencylevel_history"]
)

version_added = dispatch.Signal(providing_args=["referral", "version"])
report_published = dispatch.Signal(
    providing_args=["referral", "version", "published_by"]
)

answer_validation_requested = dispatch.Signal(
    providing_args=["referral", "requester", "validation_request"]
)
answer_validation_performed = dispatch.Signal(
    providing_args=["referral", "validation_request", "state"]
)
answer_published = dispatch.Signal(
    providing_args=["referral", "published_answer", "published_by"]
)

referral_closed = dispatch.Signal(
    providing_args=["referral", "created_by", "close_explanation"]
)

referral_message_created = dispatch.Signal(
    providing_args=["referral", "referral_message"]
)
