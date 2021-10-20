"""
General app statistics related views.
"""
from django.views.generic.base import TemplateView


class StatsView(TemplateView):
    """
    View for the stats page in Partaj.
    """

    template_name = "core/stats.html"
