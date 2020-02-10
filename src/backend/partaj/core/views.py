"""
Views for our Core app.
"""
from django.http import HttpResponse
from django.shortcuts import render

from .forms import ReferralForm


def index(request):
    if request.method == "POST":
        form = ReferralForm(request.POST)

        if form.is_valid():
            form.save()
            return HttpResponse("Referral saved")

    else:
        form = ReferralForm()

    return render(request, 'core/new_referral.html', {"form": form})
