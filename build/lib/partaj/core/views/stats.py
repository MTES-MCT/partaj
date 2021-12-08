"""
General app statistics related views.
"""
from django.conf import settings
from django.views.generic.base import TemplateView


class StatsView(TemplateView):
    """
    View for the stats page in Partaj.
    """

    template_name = "core/stats.html"

    def get_context_data(self, **kwargs):
        """
        Pull the stats dashboard url from settings and make it available to the template.
        """
        context = super().get_context_data(**kwargs)
        context["stats_dashboard_url"] = settings.STATS_DASHBOARD_URL
        return context
