from django.core.management.base import BaseCommand

from trendmap_api.models import Industry
from trendmap_api.views import run_news_scan


class Command(BaseCommand):
    help = "Scan news feeds for industry-relevant snippets and source candidates."

    def add_arguments(self, parser):
        parser.add_argument("--industry-id", help="Industry profile ID to scan for.")
        parser.add_argument("--query", action="append", help="Override search query. Can be passed multiple times.")

    def handle(self, *args, **options):
        industry = None
        if options.get("industry_id"):
            industry = Industry.objects.filter(id=options["industry_id"]).first()
            if not industry:
                self.stderr.write(self.style.ERROR(f"Industry not found: {options['industry_id']}"))
                return

        run = run_news_scan(industry=industry, queries=options.get("query"))
        self.stdout.write(self.style.SUCCESS(run.summary or f"News scan {run.id} completed."))
        if run.error_summary:
            self.stdout.write(self.style.WARNING(run.error_summary))
