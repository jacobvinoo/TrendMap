import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("trendmap_api", "0010_roadmapitem_last_reviewed_at_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="WorkspaceMembership",
            fields=[
                ("id", models.CharField(default=uuid.uuid4, editable=False, max_length=36, primary_key=True, serialize=False)),
                ("user_id", models.CharField(max_length=255)),
                ("role", models.CharField(max_length=64)),
                ("created_at", models.DateTimeField(blank=True, null=True)),
                ("updated_at", models.DateTimeField(blank=True, null=True)),
                (
                    "workspace",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.DO_NOTHING,
                        related_name="memberships",
                        to="trendmap_api.workspace",
                    ),
                ),
            ],
            options={
                "db_table": "workspace_memberships",
                "unique_together": {("workspace", "user_id")},
            },
        ),
    ]
