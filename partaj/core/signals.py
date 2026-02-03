"""
Defines all signals in the django app

Note: `providing_args` was removed in Django 4.0.
The arguments passed to signals are documented in comments.
"""

from django import dispatch

# Args: referral, created_by
referral_sent = dispatch.Signal()

# Args: referral, requester, created_by
requester_added = dispatch.Signal()

# Args: referral, requester, created_by
requester_deleted = dispatch.Signal()

# Args: referral, observer, created_by
observer_added = dispatch.Signal()

# Args: referral, observer, created_by
observer_deleted = dispatch.Signal()

# Args: referral, assignee, assignment, created_by
unit_member_assigned = dispatch.Signal()

# Args: referral, assignee, created_by
unit_member_unassigned = dispatch.Signal()

# Args: referral, assignment, created_by, unit, assignunit_explanation
unit_assigned = dispatch.Signal()

# Args: referral, created_by, unit
unit_unassigned = dispatch.Signal()

# Args: referral, created_by, referral_urgencylevel_history
urgency_level_changed = dispatch.Signal()

# Args: referral, version
version_added = dispatch.Signal()

# Args: referral, appendix
appendix_added = dispatch.Signal()

# Args: referral, publishment
report_published = dispatch.Signal()

# Args: referral, reopened_by, referral_reopening_history
referral_reopened = dispatch.Signal()

# Args: confirmed_by, secondary_referral
split_confirmed = dispatch.Signal()

# Args: created_by, secondary_referral
split_created = dispatch.Signal()

# Args: created_by, secondary_referral
split_canceled = dispatch.Signal()

# Args: created_by, referral
subtitle_updated = dispatch.Signal()

# Args: created_by, referral
subquestion_updated = dispatch.Signal()

# Args: referral, requester, validation_request
answer_validation_requested = dispatch.Signal()

# Args: referral, validation_request, state
answer_validation_performed = dispatch.Signal()

# Args: referral, published_answer, published_by
answer_published = dispatch.Signal()

# Args: referral, created_by, close_explanation
referral_closed = dispatch.Signal()

# Args: referral, referral_message
referral_message_created = dispatch.Signal()

# Args: referral, created_by, referral_history_title
referral_updated_title = dispatch.Signal()

# Args: referral, created_by, referral_topic_history
referral_topic_updated = dispatch.Signal()
