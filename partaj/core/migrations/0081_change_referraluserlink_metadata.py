# Generated by Django 3.0.5 on 2023-02-03 17:44

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        (
            "core",
            "0080_notificationtypes_referraluserlinknotification_referralactivity",
        ),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="referraluserlink",
            options={"ordering": ["created_at"], "verbose_name": "referral user link"},
        ),
    ]
