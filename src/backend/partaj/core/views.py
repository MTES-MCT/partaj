"""
Views for our Core app.
"""
from django.http import HttpResponse
from django.shortcuts import render

from .forms import ReferralForm
from .models import ReferralAttachment


def index(request):
    if request.method == "POST":
        form = ReferralForm(request.POST, request.FILES)

        if form.is_valid():
            referral = form.save()

            files = request.FILES.getlist('files')
            for file in files:
                referral_attachment = ReferralAttachment(
                    file=file,
                    name="some name",
                    referral=referral,
                )
                referral_attachment.save()

            return HttpResponse("Referral saved")

        else:
            return HttpResponse(form.errors.as_text())

    else:
        form = ReferralForm()

    return render(request, 'core/new_referral.html', {"form": form})
