from collections import defaultdict

from django.core.management.base import BaseCommand
from django.db import transaction

from trendmap_api.models import (
    ChangeEvent,
    Document,
    EvidenceLink,
    MonitoringRule,
    MonitoringRun,
    Signal,
    Source,
    SourceSnapshot,
)
from trendmap_api.source_utils import normalize_source_url, preferred_source


class Command(BaseCommand):
    help = "Merge duplicate Source rows by normalized URL and repoint dependent records."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Report duplicates without changing data.")

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        grouped = defaultdict(list)
        for source in Source.objects.all():
            key = normalize_source_url(source.url)
            if key:
                grouped[key].append(source)

        duplicate_groups = {key: items for key, items in grouped.items() if len(items) > 1}
        if not duplicate_groups:
            self.stdout.write(self.style.SUCCESS("No duplicate sources found."))
            return

        merged_count = 0
        deleted_count = 0
        for key, sources in duplicate_groups.items():
            keep = preferred_source(sources)
            remove = [source for source in sources if source.id != keep.id]
            self.stdout.write(f"{key}: keeping {keep.id} ({keep.name}), removing {len(remove)} duplicate(s)")
            if dry_run:
                continue

            with transaction.atomic():
                for duplicate in remove:
                    Document.objects.filter(source=duplicate).update(source=keep)
                    Signal.objects.filter(source=duplicate).update(source=keep)
                    EvidenceLink.objects.filter(source=duplicate).update(source=keep)
                    MonitoringRule.objects.filter(source=duplicate).update(source=keep)
                    MonitoringRun.objects.filter(source=duplicate).update(source=keep)
                    SourceSnapshot.objects.filter(source=duplicate).update(source=keep)
                    ChangeEvent.objects.filter(source=duplicate).update(source=keep)
                    duplicate.delete()
                    deleted_count += 1
            merged_count += 1

        if dry_run:
            self.stdout.write(self.style.WARNING(f"Dry run only. Found {len(duplicate_groups)} duplicate URL group(s)."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Merged {merged_count} duplicate URL group(s); deleted {deleted_count} source row(s)."))
