import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("trendmap_api", "0002_extraction_runs"),
    ]

    operations = [
        migrations.CreateModel(
            name="NewsScanRun",
            fields=[
                ("id", models.CharField(default=uuid.uuid4, editable=False, max_length=36, primary_key=True, serialize=False)),
                ("status", models.CharField(blank=True, max_length=255, null=True)),
                ("query", models.TextField(blank=True, null=True)),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("scanned_count", models.FloatField(blank=True, null=True)),
                ("matched_count", models.FloatField(blank=True, null=True)),
                ("created_source_count", models.FloatField(blank=True, null=True)),
                ("summary", models.TextField(blank=True, null=True)),
                ("error_summary", models.TextField(blank=True, null=True)),
                ("industry", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="trendmap_api.industry")),
            ],
            options={
                "db_table": "news_scan_runs",
            },
        ),
        migrations.CreateModel(
            name="NewsSnippet",
            fields=[
                ("id", models.CharField(default=uuid.uuid4, editable=False, max_length=36, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=255)),
                ("url", models.CharField(blank=True, max_length=500, null=True)),
                ("publisher", models.CharField(blank=True, max_length=255, null=True)),
                ("publisher_url", models.CharField(blank=True, max_length=500, null=True)),
                ("snippet", models.TextField(blank=True, null=True)),
                ("relevance_score", models.FloatField(blank=True, null=True)),
                ("status", models.CharField(blank=True, max_length=255, null=True)),
                ("published_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(blank=True, null=True)),
                ("run", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="trendmap_api.newsscanrun")),
                ("source", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="trendmap_api.source")),
            ],
            options={
                "db_table": "news_snippets",
            },
        ),
        migrations.AddIndex(
            model_name="newssnippet",
            index=models.Index(fields=["run"], name="news_snippet_run_idx"),
        ),
        migrations.AddIndex(
            model_name="newssnippet",
            index=models.Index(fields=["source"], name="news_snippet_source_idx"),
        ),
    ]
