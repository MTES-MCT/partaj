# Generated by Django 3.0.5 on 2021-01-11 16:29

from django.db import migrations


def forwards(apps, schema_editor):
    """
    As we add explicitly non-nullable Materialized Paths for Topics in 0038, we need to generate
    initial values for them once as the app migrates along.
    This replaces the insignificant "0000" default set in 0039 with real values.
    """
    # Important: this migration must be ran with the Partaj code (especially the Topic model) in
    # the state of the code at the time of this commit.
    # We cannot use the regular `Topic = apps.get_model("core", "Topic")` to get the correct
    # version if the model as we need the custom manager for Topic which is not available from
    # `apps.get_model`
    from partaj.core.models.unit import Topic

    Topic.objects.build_materialized_paths()


def backwards(apps, schema_editor):
    """
    As topic Materialized Path fields are added with insignificant values in migration 0038,
    we can just ignore them here as they should be removed in a migration that goes to 0037,
    and it would break Partaj to remove them and stay at 0038.
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0038_add_materialized_path_to_topics"),
    ]

    operations = [
        migrations.RunPython(forwards, reverse_code=backwards),
    ]
