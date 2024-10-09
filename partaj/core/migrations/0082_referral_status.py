# Generated by Django 3.0.5 on 2023-02-21 11:53

from django.db import migrations

import django_fsm


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0081_change_referraluserlink_metadata"),
    ]

    operations = [
        migrations.AddField(
            model_name="referral",
            name="status",
            field=django_fsm.FSMField(
                choices=[("10_n", "Normal"), ("90_s", "Sensitive")],
                default="10_n",
                help_text="referral status.",
                max_length=50,
                verbose_name="status",
            ),
        ),
    ]