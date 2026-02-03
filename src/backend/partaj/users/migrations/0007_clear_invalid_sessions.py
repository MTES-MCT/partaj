# Migration to clear sessions that are incompatible with Django 4.x
# This is necessary because the session serialization format changed between Django versions.

from django.db import migrations


def clear_sessions(apps, schema_editor):
    """
    Clear all existing sessions to avoid 'Incorrect padding' errors
    when migrating from Django 2.x to Django 4.x.
    """
    from django.contrib.sessions.models import Session

    count = Session.objects.count()
    if count > 0:
        Session.objects.all().delete()
        print(f"\n  Cleared {count} incompatible session(s).")


def noop(apps, schema_editor):
    """Reverse migration does nothing - sessions cannot be restored."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0006_usermapping"),
        ("sessions", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(clear_sessions, noop),
    ]
