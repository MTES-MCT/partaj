"""
Views dedicated to a unit receiving requests. Handle, manage & respond to referrals.
"""
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.shortcuts import get_object_or_404
from django.views.generic import DetailView, ListView

from ..models import Referral, Unit


class UserIsMemberOfUnitMixin(UserPassesTestMixin):
    def test_func(self):
        """
        Make sure the user is a member of this unit before allowing them to access its inbox.
        """
        user = self.request.user
        if user.unitmembership_set.filter(unit__id=self.kwargs["unit_id"]).exists():
            return True
        return False


class UnitInboxView(LoginRequiredMixin, UserIsMemberOfUnitMixin, ListView):
    breadcrumbs = ["unit", "unit-inbox"]
    context_object_name = "referrals"
    template_name = "core/unit/inbox.html"

    def get_queryset(self):
        """
        Limit the referrals queryset to those relevant to the current unit.
        """
        self.unit = get_object_or_404(Unit, id=self.kwargs["unit_id"])
        return Referral.objects.filter(topic__unit=self.unit).order_by("-created_at")

    def get_context_data(self, **kwargs):
        """
        Add the unit to context, necessary for all "unit" views.
        """
        context = super().get_context_data(**kwargs)
        context["unit"] = self.unit
        return context


class UnitReferralDetailView(LoginRequiredMixin, UserIsMemberOfUnitMixin, DetailView):
    breadcrumbs = ["unit", "unit-inbox", "unit-inbox-referral"]
    context_object_name = "referral"
    model = Referral
    template_name = "core/unit/referral_detail.html"

    def get_context_data(self, **kwargs):
        """
        Add the unit to context, necessary for all "unit" views.
        """
        context = super().get_context_data(**kwargs)
        self.unit = get_object_or_404(Unit, id=self.kwargs["unit_id"])
        context["unit"] = self.unit
        return context
