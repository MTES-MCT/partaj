# Generated by Django 3.0.5 on 2022-01-27 06:05

from django.db import migrations, models

import django_fsm


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0053_alter_field_null_referral"),
    ]

    operations = [
        migrations.AddField(
            model_name="referral",
            name="sent_at",
            field=models.DateTimeField(blank=True, null=True, verbose_name="sent_at"),
        ),
    ]
