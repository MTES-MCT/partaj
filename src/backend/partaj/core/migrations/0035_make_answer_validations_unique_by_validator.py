# Generated by Django 3.0.5 on 2020-11-09 19:12

from django.conf import settings
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("core", "0034_remove_legacy_referralanswer_attachment_relation"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="referralanswervalidationrequest",
            unique_together={("answer", "validator")},
        ),
    ]
