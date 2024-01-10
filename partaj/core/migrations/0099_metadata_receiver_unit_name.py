# Generated by Django 3.0.5 on 2023-12-15 14:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0098_add_superadmin_role"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="eventmetadata",
            name="receiver_unit",
        ),
        migrations.AddField(
            model_name="eventmetadata",
            name="receiver_unit_name",
            field=models.CharField(
                blank=True,
                help_text="receiver unit name",
                max_length=200,
                null=True,
                verbose_name="receiver unit name",
            ),
        ),
    ]
