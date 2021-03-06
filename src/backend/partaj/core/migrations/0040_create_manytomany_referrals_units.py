# Generated by Django 3.0.5 on 2021-02-04 13:47

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0039_generate_initial_topic_materialzed_paths"),
    ]

    operations = [
        migrations.AlterField(
            model_name="topic",
            name="path",
            field=models.CharField(
                help_text="Materialized Path to the topic in the hierarchy of topics",
                max_length=255,
                verbose_name="path",
            ),
        ),
        migrations.CreateModel(
            name="ReferralUnitAssignment",
            fields=[
                (
                    "id",
                    models.AutoField(
                        editable=False,
                        help_text="Primary key for the unit assignment",
                        primary_key=True,
                        serialize=False,
                        verbose_name="id",
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="created at"),
                ),
                (
                    "referral",
                    models.ForeignKey(
                        help_text="Referral the unit is attached to",
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.Referral",
                        verbose_name="referral",
                    ),
                ),
                (
                    "unit",
                    models.ForeignKey(
                        help_text="Unit who is attached to the referral",
                        on_delete=django.db.models.deletion.CASCADE,
                        to="core.Unit",
                        verbose_name="unit",
                    ),
                ),
            ],
            options={
                "verbose_name": "referral unit assignment",
                "db_table": "partaj_referralunitassignment",
                "unique_together": {("unit", "referral")},
            },
        ),
        migrations.AddField(
            model_name="referral",
            name="units",
            field=models.ManyToManyField(
                help_text="Partaj units that have been assigned to this referral",
                related_name="referrals_assigned",
                through="core.ReferralUnitAssignment",
                to="core.Unit",
                verbose_name="units",
            ),
        ),
    ]
