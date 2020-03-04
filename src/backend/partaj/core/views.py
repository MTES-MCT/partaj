"""
Views for our Core app.
"""
import mimetypes

from django.http import FileResponse, HttpResponse
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


def authenticated_files(request, referral_attachment_id):
    """
    Verify the current user is logged-in and allowed to see the requested referral attachment,
    then serve the file to them.

    Otherwise, return a relevant HTTP error status code.

    NB: we are aware of the issues (wrt. monopolizing of Python threads and therefore scaling)
    with serving files directly with Django views.
    Given our setup and usage levels, it's an acceptable trade-off with the ease of deployment
    that we're making.
    """
    user = request.user

    # If the user is not logged-in, just bail out
    if not user.is_authenticated:
        return HttpResponse(status=401)

    # Get the related referral attachment object or return a 404
    try:
        referral_attachment = ReferralAttachment.objects.get(id=referral_attachment_id)
    except ReferralAttachment.DoesNotExist:
        return HttpResponse(status=404)

    # Get the actual filename from the referral attachment (ie. remove the UUID prefix and slash)
    filename = str(referral_attachment.file).rsplit("/", 1)[-1]

    # Get the content type and encoding to serve the file as best we can
    content_type, encoding = mimetypes.guess_type(str(filename))
    content_type = content_type or 'application/octet-stream'

    # Actually serve the file using Django's http facilities
    response = FileResponse(referral_attachment.file.open('rb'), content_type=content_type)
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    if encoding:
        response["Content-Encoding"] = encoding

    return response
