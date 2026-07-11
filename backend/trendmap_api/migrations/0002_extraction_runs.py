import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("trendmap_api", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ExtractionRun",
            fields=[
                ("id", models.CharField(default=uuid.uuid4, editable=False, max_length=36, primary_key=True, serialize=False)),
                ("stage", models.CharField(max_length=255)),
                ("status", models.CharField(blank=True, max_length=255, null=True)),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("summary", models.TextField(blank=True, null=True)),
                ("error_summary", models.TextField(blank=True, null=True)),
                ("industry", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="trendmap_api.industry")),
            ],
            options={
                "db_table": "extraction_runs",
            },
        ),
        migrations.AddField(
            model_name="document",
            name="extraction_run",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="trendmap_api.extractionrun"),
        ),
        migrations.AddField(
            model_name="signal",
            name="extraction_run",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="trendmap_api.extractionrun"),
        ),
        migrations.AddField(
            model_name="trend",
            name="extraction_run",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="trendmap_api.extractionrun"),
        ),
        migrations.AddField(
            model_name="evidencelink",
            name="extraction_run",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.DO_NOTHING, to="trendmap_api.extractionrun"),
        ),
        migrations.AddIndex(
            model_name="document",
            index=models.Index(fields=["extraction_run"], name="documents_run_idx"),
        ),
        migrations.AddIndex(
            model_name="signal",
            index=models.Index(fields=["extraction_run"], name="signals_run_idx"),
        ),
        migrations.AddIndex(
            model_name="trend",
            index=models.Index(fields=["extraction_run"], name="trends_run_idx"),
        ),
        migrations.AddIndex(
            model_name="evidencelink",
            index=models.Index(fields=["extraction_run"], name="evidence_run_idx"),
        ),
    ]
