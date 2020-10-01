from django.contrib.auth import get_user_model
from django.db.models import Count
from django.views.generic.base import TemplateView

from ..models import Referral, Unit


class StatsView(TemplateView):
    """
    View for the stats page in Partaj.
    """

    template_name = "core/stats.html"

    def get_context_data(self, **kwargs):
        """
        Get the statistics data we'll display in the templates.
        """

        context = super().get_context_data(**kwargs)

        # Introductory statistics
        context["referrals_count"] = Referral.objects.all().count()

        User = get_user_model()
        context["users_count"] = User.objects.all().count()

        # Count units which have at least one linked topic (eg. can receive referrals)
        context["units_count"] = (
            Unit.objects.all()
            .annotate(topics_count=Count("topic"))
            .filter(topics_count__gt=0)
            .count()
        )

        return context
