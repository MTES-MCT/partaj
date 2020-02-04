"""
Views for our Core app.
"""
from django.http import HttpResponse


def index(request):
    return HttpResponse("Hello, world.")
