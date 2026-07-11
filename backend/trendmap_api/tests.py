from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Industry, Source, Document, Signal, Trend, TrendTheme, EvidenceLink, ExtractionRun, HealthCheck, NewsSnippet, NewsScanRun
from unittest.mock import patch

class CoreEntitiesTests(APITestCase):

    def test_version(self):
        response = self.client.get('/api/version', format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('version', response.json())

    def test_health(self):
        response = self.client.get('/health', format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_csrf(self):
        response = self.client.get('/api/csrf', format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('csrfToken', response.json())

    def test_create_industry(self):
        url = '/api/industries'
        data = {
            'name': 'Tech',
            'geography': 'Global',
            'description': 'Technology sector'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Industry.objects.count(), 1)
        industry = Industry.objects.get()
        self.assertEqual(industry.name, 'Tech')
        self.assertIsNotNone(industry.created_at)
        self.assertIsNotNone(industry.updated_at)

    def test_update_industry_refreshes_updated_at(self):
        industry = Industry.objects.create(
            id='ind-update',
            name='Old',
            geography='Global',
            description='Old description',
            created_at=timezone.now(),
            updated_at=timezone.now(),
        )
        original_updated_at = industry.updated_at

        response = self.client.patch(f'/api/industries/{industry.id}', {'name': 'Updated'}, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        industry.refresh_from_db()
        self.assertEqual(industry.name, 'Updated')
        self.assertGreater(industry.updated_at, original_updated_at)

    def test_create_source(self):
        url = '/api/sources'
        data = {
            'name': 'TechCrunch',
            'url': 'https://techcrunch.com',
            'status': 'active'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Source.objects.count(), 1)

    def test_create_document(self):
        source = Source.objects.create(name='Wired', url='https://wired.com')
        url = '/api/documents'
        data = {
            'source': source.id,
            'title': 'New AI Model',
            'content': 'OpenAI just released a new AI model.'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Document.objects.count(), 1)

    def test_create_manual_document_with_source_id(self):
        source = Source.objects.create(name='Manual Source', url='https://example.com/manual', status='approved')
        response = self.client.post('/api/documents', {
            'source_id': source.id,
            'title': 'Manual market note',
            'url': 'https://example.com/manual-note',
            'content': 'Manual evidence about online grocery pricing, loyalty, delivery, and shopper behaviour.',
            'ingestion_status': 'raw',
            'published_date': timezone.now().isoformat(),
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        document = Document.objects.get(title='Manual market note')
        self.assertEqual(str(document.source_id), str(source.id))
        self.assertEqual(document.status, 'raw')

    def test_upload_document_file(self):
        source = Source.objects.create(name='Uploaded Source', url='https://example.com/uploaded', status='approved')
        uploaded = SimpleUploadedFile(
            'uploaded-note.txt',
            b'Uploaded evidence says online grocery delivery, loyalty pricing, and supermarket checkout experience are changing.',
            content_type='text/plain',
        )

        response = self.client.post('/api/documents/upload', {
            'source_id': str(source.id),
            'title': 'Uploaded grocery note',
            'url': 'https://example.com/uploaded-note',
            'published_date': '2026-07-06T10:18:17.000Z',
            'file': uploaded,
        }, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        document = Document.objects.get(title='Uploaded grocery note')
        self.assertEqual(str(document.source_id), str(source.id))
        self.assertIn('Uploaded evidence says online grocery delivery', document.content)
        self.assertEqual(document.status, 'raw')

    def test_upload_document_accepts_browser_iso_timestamp_without_500(self):
        source = Source.objects.create(name='Uploaded Source', url='https://example.com/uploaded', status='approved')
        uploaded = SimpleUploadedFile(
            'uploaded-note.txt',
            b'Browser uploaded evidence about online grocery delivery, supermarket loyalty, pricing, and checkout changes.',
            content_type='text/plain',
        )

        response = self.client.post('/api/documents/upload', {
            'source_id': str(source.id),
            'title': 'Browser uploaded grocery note',
            'published_date': '2026-07-06T10:18:17.000Z',
            'file': uploaded,
        }, format='multipart')

        self.assertNotEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        document = Document.objects.get(title='Browser uploaded grocery note')
        self.assertIsNotNone(document.published_at)

    @patch('trendmap_api.views.extract_pdf_text_from_bytes')
    @patch('trendmap_api.views.urlopen')
    def test_create_document_from_pdf_url_extracts_content_instead_of_reference_stub(self, mock_urlopen, mock_extract_pdf):
        source = Source.objects.create(name='Manual PDF Source', url='https://example.com', status='approved')
        mock_urlopen.return_value.__enter__.return_value.read.return_value = b'%PDF-1.7 fake pdf bytes'
        mock_urlopen.return_value.__enter__.return_value.headers.get.return_value = 'application/pdf'
        mock_extract_pdf.return_value = (
            'NielsenIQ report evidence says grocery shoppers, household value pressures, private label, '
            'basket trade-offs, online retail, family spending, and supermarket pricing are changing in ways '
            'that are relevant for evidence review and signal extraction across the grocery market. It also '
            'describes promotion sensitivity, delivery expectations, digital commerce behaviour, channel choice, '
            'stock availability, loyalty programs, household budgets, and shopper responses to value constraints.'
        )

        response = self.client.post('/api/documents', {
            'sourceId': str(source.id),
            'title': 'NIQ PDF perspective',
            'url': 'https://example.com/report.pdf',
            'publishedDate': '2026-07-06T10:18:17.000Z',
            'content': '',
            'ingestionStatus': 'raw',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        document = Document.objects.get(title='NIQ PDF perspective')
        self.assertIn('NielsenIQ report evidence says grocery shoppers', document.content)
        self.assertNotIn('Manual reference URL added for review', document.content)

    def test_create_signal(self):
        source = Source.objects.create(name='Verge', url='https://theverge.com')
        document = Document.objects.create(source=source, title='Doc', content='test')
        url = '/api/signals'
        data = {
            'document': document.id,
            'source': source.id,
            'title': 'AI taking over',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Signal.objects.count(), 1)

    def test_delete_document_removes_related_signals_and_evidence(self):
        source = Source.objects.create(name='Manual Source', url='https://example.com/manual', status='approved')
        document = Document.objects.create(id='doc-delete', source=source, title='Manual Doc', content='Manual grocery evidence', status='raw')
        signal = Signal.objects.create(id='sig-delete', document=document, source=source, title='Manual Signal')
        trend = Trend.objects.create(id='trend-delete', name='Manual Trend', status='candidate')
        EvidenceLink.objects.create(
            id='ev-delete',
            trend=trend,
            signal=signal,
            document=document,
            source=source,
            relationship_type='supports',
        )

        response = self.client.delete('/api/documents/doc-delete')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Document.objects.filter(id='doc-delete').count(), 0)
        self.assertEqual(Signal.objects.filter(id='sig-delete').count(), 0)
        self.assertEqual(EvidenceLink.objects.filter(id='ev-delete').count(), 0)
        self.assertEqual(Trend.objects.filter(id='trend-delete').count(), 1)

    def test_create_trend(self):
        url = '/api/trends'
        data = {
            'name': 'Generative AI',
            'summary': 'AI that generates things.'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Trend.objects.count(), 1)

    def test_clear_analysis_data_preserves_industries_and_sources(self):
        industry = Industry.objects.create(name='Online grocery supermarket', geography='New Zealand')
        source = Source.objects.create(id='src-clear', name='Grocery Source', url='https://example.com', status='approved')
        run = ExtractionRun.objects.create(id='run-clear', industry=industry, stage='document_extraction', status='completed', started_at=timezone.now())
        document = Document.objects.create(id='doc-clear', source=source, extraction_run=run, title='Doc', content='Online grocery content', status='raw')
        signal = Signal.objects.create(id='sig-clear', document=document, source=source, extraction_run=run, title='Signal')
        trend = Trend.objects.create(id='trend-clear', extraction_run=run, name='Trend', status='candidate')
        EvidenceLink.objects.create(id='ev-clear', trend=trend, signal=signal, document=document, source=source, extraction_run=run, relationship_type='supports')

        response = self.client.post('/api/admin/clear-analysis-data', format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json()['deleted_counts']['documents'], 1)
        self.assertEqual(Industry.objects.count(), 1)
        self.assertEqual(Source.objects.count(), 1)
        self.assertEqual(Document.objects.count(), 0)
        self.assertEqual(Signal.objects.count(), 0)
        self.assertEqual(Trend.objects.count(), 0)
        self.assertEqual(EvidenceLink.objects.count(), 0)
        self.assertEqual(ExtractionRun.objects.count(), 0)

    def test_data_health_endpoint_exists_and_reports_issues(self):
        trend = Trend.objects.create(id='trend-health', name='Approved without evidence', status='approved')

        response = self.client.post('/api/admin/data-health', format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertEqual(payload['status'], 'degraded')
        self.assertGreaterEqual(payload['issue_count'], 1)
        self.assertTrue(any(issue['entity_id'] == trend.id for issue in payload['issues']))
        self.assertEqual(HealthCheck.objects.count(), 1)
        self.assertEqual(payload['latest_checks'][0]['component'], 'data_integrity')

    def test_clear_analysis_data_then_data_health_does_not_404(self):
        Industry.objects.create(name='Online grocery supermarket', geography='New Zealand')
        Source.objects.create(id='src-health-clear', name='Grocery Source', url='https://example.com', status='approved')

        clear_response = self.client.post('/api/admin/clear-analysis-data', format='json')
        health_response = self.client.post('/api/admin/data-health', format='json')

        self.assertEqual(clear_response.status_code, status.HTTP_200_OK)
        self.assertEqual(health_response.status_code, status.HTTP_200_OK)
        self.assertIn(health_response.json()['status'], {'healthy', 'degraded'})

    def test_discovery_uses_saved_industry_context(self):
        industry = Industry.objects.create(
            name='Online grocery supermarket',
            geography='New Zealand',
            description='Track retail, grocery, delivery, and customer experience trends.',
        )
        response = self.client.post(f'/api/agents/discovery/{industry.id}', format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        names = [item['name'] for item in response.json()]
        self.assertTrue(any('Retail' in name or 'Grocery' in name for name in names))
        self.assertFalse(any('ArXiv Paper: Information Retrieval LLMs' == name for name in names))
        self.assertTrue(all(item['status'] == 'suggested' for item in response.json()))

    def test_theme_derivation_creates_suggested_themes(self):
        industry = Industry.objects.create(
            id='ind-theme',
            name='Online grocery supermarket',
            geography='New Zealand',
            description='Track pricing, delivery, customer behaviour, logistics, and digital commerce.',
        )

        response = self.client.post('/api/themes/derive', {'industry_id': industry.id}, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertGreaterEqual(len(response.json()), 3)
        self.assertTrue(TrendTheme.objects.filter(industry=industry, status='suggested').exists())
        self.assertTrue(any('value' in item['name'].lower() or 'discovery' in item['name'].lower() for item in response.json()))

    def test_theme_derivation_does_not_downgrade_approved_manual_theme(self):
        industry = Industry.objects.create(
            id='ind-theme-approved',
            name='Online grocery supermarket',
            geography='New Zealand',
            description='Track pricing, delivery, customer behaviour, logistics, and digital commerce.',
        )
        TrendTheme.objects.create(
            id='theme-approved-value',
            industry=industry,
            name='Shopper value and affordability',
            description='Existing approved analyst theme.',
            keywords=['value'],
            status='approved',
            origin='manual',
        )

        response = self.client.post('/api/themes/derive', {'industry_id': industry.id}, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        theme = TrendTheme.objects.get(id='theme-approved-value')
        self.assertEqual(theme.status, 'approved')
        self.assertEqual(theme.origin, 'manual')

    def test_discovery_uses_approved_themes_in_source_notes(self):
        industry = Industry.objects.create(
            id='ind-themed-discovery',
            name='Online grocery supermarket',
            geography='New Zealand',
            description='Track retail and grocery source discovery.',
        )
        TrendTheme.objects.create(
            id='theme-value',
            industry=industry,
            name='Shopper value and affordability',
            description='Value and affordability',
            keywords=['price', 'value', 'private label'],
            status='approved',
            origin='manual',
        )

        response = self.client.post(f'/api/agents/discovery/{industry.id}', format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(any('Shopper value and affordability' in (item.get('notes') or '') for item in response.json()))
        self.assertTrue(any('NielsenIQ' in item['name'] or 'Consumer' in item['name'] for item in response.json()))

    def test_discovery_handles_duplicate_existing_source_urls(self):
        industry = Industry.objects.create(
            name='Online grocery supermarket',
            geography='New Zealand',
            description='Track retail and grocery source discovery.',
        )
        Source.objects.create(
            id='dup-retail-1',
            name='Retail Dive Old 1',
            url='https://www.retaildive.com/',
            status='approved',
            updated_at=timezone.now(),
        )
        Source.objects.create(
            id='dup-retail-2',
            name='Retail Dive Old 2',
            url='https://www.retaildive.com',
            status='approved',
            updated_at=timezone.now(),
        )

        response = self.client.post(f'/api/agents/discovery/{industry.id}', format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            Source.objects.filter(url__in=['https://www.retaildive.com/', 'https://www.retaildive.com']).count(),
            2,
        )
        self.assertTrue(any(item['id'] in {'dup-retail-1', 'dup-retail-2'} for item in response.json()))

    def test_discovery_does_not_readd_or_downgrade_existing_source(self):
        industry = Industry.objects.create(
            name='Online grocery supermarket',
            geography='Global',
            description='Track retail and grocery source discovery.',
        )
        existing = Source.objects.create(
            id='existing-mckinsey',
            name='McKinsey Already Approved',
            url='https://www.mckinsey.com/industries/retail/our-insights',
            status='approved',
            source_type='report',
            credibility_score=0.99,
            relevance_score=0.99,
            freshness_score=0.99,
            updated_at=timezone.now(),
        )

        response = self.client.post(f'/api/agents/discovery/{industry.id}', format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        existing.refresh_from_db()
        self.assertEqual(existing.status, 'approved')
        self.assertEqual(Source.objects.filter(url='https://www.mckinsey.com/industries/retail/our-insights').count(), 1)

    @patch('trendmap_api.views.urlopen')
    def test_news_scan_creates_source_from_relevant_news_snippet(self, mock_urlopen):
        Industry.objects.create(name='Online grocery supermarket', geography='New Zealand', description='online grocery retail')
        rss = b'''<?xml version="1.0" encoding="UTF-8"?>
        <rss><channel>
          <item>
            <title>Online grocery delivery expands for supermarket shoppers</title>
            <link>https://news.google.com/articles/example</link>
            <source url="https://grocerynews.example">Grocery News</source>
            <description>Retail supermarket operators are improving online grocery delivery, shopper experience, and product availability.</description>
            <pubDate>Mon, 06 Jul 2026 10:00:00 GMT</pubDate>
          </item>
          <item>
            <title>Sports tourism event grows</title>
            <link>https://news.google.com/articles/noise</link>
            <source url="https://sports.example">Sports News</source>
            <description>Tourism and sports event news.</description>
          </item>
        </channel></rss>'''
        mock_urlopen.return_value.__enter__.return_value.read.return_value = rss
        mock_urlopen.return_value.__enter__.return_value.headers.get.return_value = 'application/rss+xml'

        response = self.client.post('/api/news/scan', format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(NewsScanRun.objects.count(), 1)
        self.assertEqual(NewsSnippet.objects.count(), 1)
        self.assertEqual(Source.objects.filter(url='https://grocerynews.example').count(), 1)
        self.assertEqual(response.json()['sources_created'], 1)

    @patch('trendmap_api.views.urlopen')
    def test_document_extraction_fetches_real_content_and_does_not_fabricate(self, mock_urlopen):
        Industry.objects.create(name='Online grocery supermarket', geography='New Zealand', description='online grocery retail delivery')
        Source.objects.create(
            id='src-fetch',
            name='Grocery Example',
            url='https://example.com/grocery',
            source_type='news',
            status='approved',
        )

        html = b'''<html><head><title>Online grocery delivery expands</title></head>
        <body><article>Online grocery supermarket retailers are improving delivery, customer experience,
        substitution handling, product availability, and digital commerce convenience for shoppers. Retail
        teams are investing in fulfilment operations and personalised recommendations for grocery baskets.
        Supermarket leaders are also improving online checkout, loyalty offers, delivery windows,
        product discovery, and service recovery so grocery shoppers can complete weekly baskets with
        fewer failed searches and fewer unavailable items.</article></body></html>'''
        mock_urlopen.return_value.__enter__.return_value.read.return_value = html
        mock_urlopen.return_value.__enter__.return_value.headers.get.return_value = 'text/html'

        response = self.client.post('/api/documents/extract-from-sources', format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['imported_count'], 1)
        document = Document.objects.get(source_id='src-fetch')
        self.assertNotIn('Mock extracted content', document.content)
        self.assertIn('Online grocery supermarket retailers', document.content)
        self.assertIsNotNone(document.extraction_run_id)
        self.assertEqual(ExtractionRun.objects.filter(stage='document_extraction').count(), 1)

    def test_extraction_log_endpoints_exist(self):
        response = self.client.get('/api/logs/extraction')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('logs', response.json())

        stream_response = self.client.get('/api/logs/extraction/stream')
        self.assertEqual(stream_response.status_code, status.HTTP_200_OK)
        self.assertEqual(stream_response['Content-Type'], 'text/event-stream')

    @patch('trendmap_api.views.urlopen')
    def test_document_extraction_deduplicates_source_urls(self, mock_urlopen):
        Industry.objects.create(name='Online grocery supermarket', geography='New Zealand', description='online grocery retail delivery')
        Source.objects.create(id='src-one', name='Grocery One', url='https://example.com/grocery/', source_type='news', status='approved')
        Source.objects.create(id='src-two', name='Grocery Duplicate', url='https://example.com/grocery', source_type='news', status='approved')

        html = b'''<html><head><title>Online grocery delivery expands</title></head>
        <body>Online grocery supermarket retailers are improving delivery, product availability, digital
        commerce convenience, customer experience, substitution handling, checkout, loyalty offers, and
        weekly basket building for supermarket shoppers. Retail grocery teams are investing in fulfilment
        operations and better product discovery. The article includes examples of delivery windows, stock
        visibility, basket recovery, and supermarket service improvements for weekly grocery shoppers.</body></html>'''
        mock_urlopen.return_value.__enter__.return_value.read.return_value = html
        mock_urlopen.return_value.__enter__.return_value.headers.get.return_value = 'text/html'

        response = self.client.post('/api/documents/extract-from-sources', format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['imported_count'], 1)
        self.assertEqual(mock_urlopen.call_count, 1)

    @patch('trendmap_api.views.urlopen')
    def test_document_extraction_rejects_site_metadata_blob(self, mock_urlopen):
        Industry.objects.create(name='Online grocery supermarket', geography='New Zealand', description='online grocery retail')
        Source.objects.create(id='src-metadata', name='New Zealand Herald - Business', url='https://example.com/business', source_type='news', status='approved')

        html = b'''<html><head><title>NZ Herald Business - Latest Market & Finance News - NZ Herald</title></head>
        <body><main>{"sectionKeywords":"business,finance,property,economy","site-path":{"link":"/business/"},
        "site-menu":{"menuId":"nzh-horizontal-nav","title":"NZ Herald Horizontal Navigation","subItems":[{"title":"Home"}]},
        "breadcrumb":[{"name":"NZ Herald Main Navigation"}],"expires":1783293083614,"lastModified":1783275083595}</main></body></html>'''
        mock_urlopen.return_value.__enter__.return_value.read.return_value = html
        mock_urlopen.return_value.__enter__.return_value.headers.get.return_value = 'text/html'

        response = self.client.post('/api/documents/extract-from-sources', format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['imported_count'], 0)
        self.assertEqual(Document.objects.count(), 0)
        self.assertIn('site metadata', '\n'.join(response.json()['errors']).lower())

    @patch('trendmap_api.views.urlopen')
    def test_document_extraction_rejects_service_landing_page(self, mock_urlopen):
        Industry.objects.create(name='Online grocery supermarket', geography='New Zealand', description='online grocery retail delivery')
        Source.objects.create(id='src-landing', name='Forrester Research', url='https://example.com/retail', source_type='research', status='approved')

        html = b'''<html><head><title>Retail & CPG Industry Services | Forrester</title></head>
        <body><main>Retail & CPG Industry Services | Forrester Skip to content Who We Serve Blank TECHNOLOGY
        Data, AI & Analytics Security & Risk Technology Architecture And Delivery Technology B2B B2B Marketing
        Product Management Revenue Operations & Enablement B2C B2C Marketing Customer Experience Digital Business
        Blank INDUSTRIES Financial Services Government Healthcare High Tech Retail & CPG What We Offer Blank
        Forrester Decisions The Forrester Wave Forrester AI Forrester Market Insights Consulting Demand Generation.
        Learn More Forrester Decisions for Technology Architecture & Delivery Advance technology modernization
        initiatives to capture new opportunities and deliver business value.</main></body></html>'''
        mock_urlopen.return_value.__enter__.return_value.read.return_value = html
        mock_urlopen.return_value.__enter__.return_value.headers.get.return_value = 'text/html'

        response = self.client.post('/api/documents/extract-from-sources', format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['imported_count'], 0)
        self.assertEqual(Document.objects.count(), 0)
        self.assertIn('landing page', '\n'.join(response.json()['errors']).lower())

    @patch('trendmap_api.views.urlopen')
    def test_document_extraction_rejects_low_value_resource_page(self, mock_urlopen):
        Industry.objects.create(name='Online grocery supermarket', geography='New Zealand', description='online grocery retail')
        Source.objects.create(id='src-resource-page', name='Retail NZ', url='https://example.com/resources', source_type='publication', status='approved')

        html = b'''<html><head><title>Resources for retailers and business owners - Retail NZ</title></head>
        <body>Resources for retailers and business owners. Advice service, member benefits, preferred partners,
        subscription rates, webinars, generic business resources, and retail sector links for operators.</body></html>'''
        mock_urlopen.return_value.__enter__.return_value.read.return_value = html
        mock_urlopen.return_value.__enter__.return_value.headers.get.return_value = 'text/html'

        response = self.client.post('/api/documents/extract-from-sources', format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['imported_count'], 0)
        self.assertEqual(Document.objects.count(), 0)
        self.assertIn('low-value resource', '\n'.join(response.json()['errors']).lower())

    @patch('trendmap_api.views.urlopen')
    def test_document_extraction_trims_article_header_chrome(self, mock_urlopen):
        Industry.objects.create(name='Online grocery supermarket', geography='New Zealand', description='online grocery retail pricing')
        Source.objects.create(id='src-techcrunch-clean', name='TechCrunch - E-commerce', url='https://example.com/instacart', source_type='news', status='approved')

        html = b'''<html><head><title>Study shows Instacart may be charging some shoppers 20% more for the same product | TechCrunch</title></head>
        <body><main>Study shows Instacart may be charging some shoppers 20% more for the same product | TechCrunch
        TechCrunch Desktop Logo TechCrunch Mobile Logo Latest Startups Venture Apple Security AI Apps Disrupt 2026
        Events Podcasts Newsletters Search Submit Site Search Toggle Mega Menu Toggle Topics Latest AI Amazon Apps
        Image Credits: Instacart Commerce Study shows Instacart may be charging some shoppers 20% more for the same product
        Lucas Ropek 12:56 PM PST December 16, 2025 A recent study published by Consumer Reports alleges that
        Instacart has been conducting AI-led dynamic pricing experiments that are inflating the cost of certain
        grocery products. Retail partners such as Kroger and Costco were included in the research, and some shoppers
        paid more than others for the same supermarket product.</main></body></html>'''
        mock_urlopen.return_value.__enter__.return_value.read.return_value = html
        mock_urlopen.return_value.__enter__.return_value.headers.get.return_value = 'text/html'

        response = self.client.post('/api/documents/extract-from-sources', format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['imported_count'], 1)
        document = Document.objects.get()
        self.assertNotIn('TechCrunch Desktop Logo', document.content)
        self.assertIn('A recent study published by Consumer Reports', document.content)

    def test_signal_extraction_uses_document_content_and_industry_context(self):
        Industry.objects.create(name='Online grocery supermarket', geography='New Zealand', description='online grocery retail')
        source = Source.objects.create(id='src-signal', name='Grocery Source', url='https://example.com', status='approved')
        document = Document.objects.create(
            id='doc-signal',
            source=source,
            title='Online grocery search improves',
            content='Online grocery retailers are using AI recommendations and semantic search to improve shopper product discovery. Delivery convenience is also improving fulfilment operations.',
            status='raw',
            published_at=timezone.now(),
        )

        response = self.client.post(f'/api/agents/extract/{document.id}', format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item['title'] for item in response.json()]
        self.assertIn('AI-assisted grocery discovery', titles)
        self.assertTrue(all(item['summary'] != document.title for item in response.json()))

    def test_signal_extraction_does_not_use_title_only_as_evidence(self):
        Industry.objects.create(name='Online grocery supermarket', geography='New Zealand', description='online grocery retail')
        source = Source.objects.create(id='src-title-only', name='Retail NZ', url='https://example.com/title-only', status='approved')
        document = Document.objects.create(
            id='doc-title-only',
            source=source,
            title='Resources for retailers and business owners - Retail NZ',
            content='Resources for retailers and business owners - Retail NZ.',
            status='raw',
            published_at=timezone.now(),
        )

        response = self.client.post(f'/api/agents/extract/{document.id}', format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [])

    def test_signal_extraction_does_not_match_ai_inside_other_words(self):
        Industry.objects.create(name='Online grocery supermarket', geography='New Zealand', description='online grocery retail')
        source = Source.objects.create(id='src-substring', name='Tech Source', url='https://example.com/substring', status='approved')
        document = Document.objects.create(
            id='doc-substring',
            source=source,
            title='Research note',
            content='Researchers said the government customer used the same spyware vendor, but the report did not discuss grocery retail, supermarket commerce, or delivery operations.',
            status='raw',
            published_at=timezone.now(),
        )

        response = self.client.post(f'/api/agents/extract/{document.id}', format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(any(item['title'] == 'AI-assisted grocery discovery' for item in response.json()))

    def test_signal_extraction_requires_commerce_context(self):
        Industry.objects.create(name='Online grocery supermarket', geography='New Zealand', description='online grocery retail delivery')
        source = Source.objects.create(id='src-noncommerce', name='TechCrunch', url='https://example.com/security', status='approved')
        document = Document.objects.create(
            id='doc-noncommerce',
            source=source,
            title='Security investigation',
            content='Citizen Lab researchers said the government customer used the same spyware-loaded email address before delivery of a first draft report on phone hacking.',
            status='raw',
            published_at=timezone.now(),
        )

        response = self.client.post(f'/api/agents/extract/{document.id}', format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [])

    def test_signal_extraction_ignores_site_metadata_sentences(self):
        Industry.objects.create(name='Online grocery supermarket', geography='New Zealand', description='online grocery retail')
        source = Source.objects.create(id='src-metadata-signal', name='New Zealand Herald - Business', url='https://example.com/business', status='approved')
        document = Document.objects.create(
            id='doc-metadata-signal',
            source=source,
            title='NZ Herald Business - Latest Market & Finance News - NZ Herald',
            content='{"sectionKeywords":"business,finance,property,economy","site-path":{"link":"/business/"},"site-menu":{"menuId":"nzh-horizontal-nav","title":"NZ Herald Horizontal Navigation"},"expires":1783293083614,"lastModified":1783275083595}',
            status='raw',
            published_at=timezone.now(),
        )

        response = self.client.post(f'/api/agents/extract/{document.id}', format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [])

    def test_signal_extraction_ignores_service_landing_page_copy(self):
        Industry.objects.create(name='Online grocery supermarket', geography='New Zealand', description='online grocery retail delivery')
        source = Source.objects.create(id='src-landing-signal', name='Forrester Research', url='https://example.com/retail', status='approved')
        document = Document.objects.create(
            id='doc-landing-signal',
            source=source,
            title='Retail & CPG Industry Services | Forrester',
            content='Learn More Forrester Decisions for Technology Architecture & Delivery Advance technology modernization initiatives to capture new opportunities and deliver business value. Forrester helps architecture and delivery leaders turn strategy into resilient, scalable technology foundations that enable business outcomes at speed.',
            status='raw',
            published_at=timezone.now(),
        )

        response = self.client.post(f'/api/agents/extract/{document.id}', format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [])

    def test_signal_extraction_keeps_emergent_relevant_signals(self):
        Industry.objects.create(name='Online grocery supermarket', geography='New Zealand', description='online grocery retail customer experience')
        source = Source.objects.create(id='src-emergent', name='Grocery Source', url='https://example.com', status='approved')
        document = Document.objects.create(
            id='doc-emergent',
            source=source,
            title='Customer expectations shift in online grocery',
            content='Online grocery supermarket shoppers are abandoning weekly baskets when checkout service is slow and customer recovery is poor. Retail teams are redesigning service promises for grocery delivery and collection.',
            status='raw',
            published_at=timezone.now(),
        )

        response = self.client.post(f'/api/agents/extract/{document.id}', format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item['title'] for item in response.json()]
        self.assertIn('Customer experience pressure', titles)

    def test_agent_analyze_requires_strategy_grade_multi_source_evidence(self):
        Industry.objects.create(name='Online grocery supermarket', geography='New Zealand', description='online grocery retail')
        first_source = Source.objects.create(id='src-analyze-one', name='Grocery Source One', url='https://example.com/one', status='approved')
        second_source = Source.objects.create(id='src-analyze-two', name='Grocery Source Two', url='https://example.com/two', status='approved')
        first_document = Document.objects.create(
            id='doc-analyze-one',
            source=first_source,
            title='AI grocery discovery',
            content='Online grocery retailers use AI recommendations and semantic search to improve product discovery for supermarket shoppers and lift search-to-cart conversion.',
            status='extracted',
            published_at=timezone.now(),
        )
        second_document = Document.objects.create(
            id='doc-analyze-two',
            source=second_source,
            title='AI grocery shopping journeys',
            content='Supermarket shoppers are using conversational AI search to find grocery products faster and build online baskets with fewer failed searches.',
            status='extracted',
            published_at=timezone.now(),
        )
        Signal.objects.create(
            id='sig-analyze-one',
            document=first_document,
            source=first_source,
            title='AI-assisted grocery discovery',
            summary='Online grocery retailers use AI recommendations and semantic search to improve product discovery.',
            signal_type='ai_grocery_discovery',
            pestle_category='Technology',
            novelty_score=0.8,
            strength_score=0.85,
            confidence_score=0.8,
            created_at=timezone.now(),
        )
        Signal.objects.create(
            id='sig-analyze-two',
            document=second_document,
            source=second_source,
            title='AI-assisted grocery discovery',
            summary='Supermarket shoppers are using conversational AI search to find grocery products faster.',
            signal_type='ai_grocery_discovery',
            pestle_category='Technology',
            novelty_score=0.78,
            strength_score=0.82,
            confidence_score=0.78,
            created_at=timezone.now(),
        )

        response = self.client.post('/api/agents/analyze', format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(item['name'] == 'AI-assisted grocery discovery' for item in response.json()))
        trend = Trend.objects.get(id='trend-ai-assisted-grocery-discovery')
        self.assertIn('AI-assisted discovery can reduce failed grocery searches', trend.summary)
        self.assertEqual(EvidenceLink.objects.filter(trend=trend).count(), 2)

    def test_agent_analyze_rejects_thin_single_source_trends(self):
        Industry.objects.create(name='Online grocery supermarket', geography='New Zealand', description='online grocery retail')
        source = Source.objects.create(id='src-thin-trend', name='Single Grocery Source', url='https://example.com/single', status='approved')
        document = Document.objects.create(
            id='doc-thin-trend',
            source=source,
            title='Value grocery update',
            content='Online grocery shoppers are seeking value and promotions as supermarket food prices rise.',
            status='extracted',
            published_at=timezone.now(),
        )
        Signal.objects.create(
            id='sig-thin-trend',
            document=document,
            source=source,
            title='Value-seeking grocery behaviour',
            summary='Online grocery shoppers are seeking value and promotions as supermarket food prices rise.',
            signal_type='value_seeking',
            pestle_category='Economic',
            novelty_score=0.7,
            strength_score=0.8,
            confidence_score=0.75,
            created_at=timezone.now(),
        )

        response = self.client.post('/api/agents/analyze', format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [])
        self.assertFalse(Trend.objects.filter(id='trend-value-seeking-grocery-behaviour').exists())

    def test_agent_analyze_proposes_new_theme_for_off_theme_signal(self):
        industry = Industry.objects.create(name='Online grocery supermarket', geography='New Zealand', description='online grocery retail')
        TrendTheme.objects.create(
            id='theme-approved-ai',
            industry=industry,
            name='Digital grocery discovery and personalisation',
            description='Approved search theme',
            keywords=['search', 'recommendation', 'ai'],
            status='approved',
            origin='manual',
        )
        source = Source.objects.create(id='src-off-theme', name='Grocery Value Source', url='https://example.com/value', status='approved')
        document = Document.objects.create(
            id='doc-off-theme',
            source=source,
            title='Online grocery value pressure',
            content='Online grocery supermarket shoppers are seeking value, promotions, and private label alternatives as food prices rise.',
            status='extracted',
            published_at=timezone.now(),
        )
        Signal.objects.create(
            id='sig-off-theme',
            document=document,
            source=source,
            title='Value-seeking grocery behaviour',
            summary='Online grocery supermarket shoppers are seeking value, promotions, and private label alternatives as food prices rise.',
            signal_type='value_seeking',
            pestle_category='Economic',
            novelty_score=0.7,
            strength_score=0.8,
            confidence_score=0.75,
            created_at=timezone.now(),
        )

        response = self.client.post('/api/agents/analyze', format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [])
        self.assertTrue(TrendTheme.objects.filter(industry=industry, name='Value-seeking grocery behaviour', status='suggested', origin='pipeline').exists())

    def test_insights_summary_uses_approved_trends(self):
        industry = Industry.objects.create(name='Online grocery supermarket', geography='New Zealand')
        Trend.objects.create(
            id='trend-approved',
            name='Approved Grocery Trend',
            summary='Approved grocery trend summary',
            status='approved',
            impact_score=0.9,
            confidence_score=0.8,
            recommended_actions=['Pilot the operating response'],
        )
        Trend.objects.create(
            id='trend-watch',
            name='Watch Grocery Trend',
            summary='High impact but lower confidence',
            status='approved',
            impact_score=0.8,
            confidence_score=0.5,
        )
        Trend.objects.create(
            id='trend-risk',
            name='Risk Grocery Trend',
            summary='Risk trend summary',
            status='approved',
            impact_score=0.7,
            confidence_score=0.8,
            blockers=['Supplier readiness is uncertain'],
        )
        Trend.objects.create(
            id='trend-candidate',
            name='Candidate Grocery Trend',
            status='candidate',
            impact_score=1.0,
            confidence_score=1.0,
        )

        response = self.client.get('/api/insights/summary', format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['industry_profile_id'], str(industry.id))
        key_names = [item['name'] for item in data['key_trends']]
        self.assertIn('Approved Grocery Trend', key_names)
        self.assertNotIn('Candidate Grocery Trend', key_names)
        self.assertIn('Watch Grocery Trend', [item['name'] for item in data['watch_items']])
        self.assertIn('Risk Grocery Trend', [item['name'] for item in data['emerging_risks']])
        self.assertIn('Approved Grocery Trend', [item['name'] for item in data['opportunities']])


    def test_list_agentactivity(self):
        url = '/api/agent/activities'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_agentdebate(self):
        url = '/api/agent/debates'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_industry(self):
        url = '/api/industries'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_assumption(self):
        url = '/api/assumptions'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_auditevent(self):
        url = '/api/audit-events'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_changeevent(self):
        url = '/api/change-events'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_dataexport(self):
        url = '/api/data-exports'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_decisionbrief(self):
        url = '/api/decision-briefs'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_embedding(self):
        url = '/api/embeddings'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_evidencelink(self):
        url = '/api/evidence-links'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_healthcheck(self):
        url = '/api/health-checks'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_kgedge(self):
        url = '/api/knowledge/edges'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_kgnode(self):
        url = '/api/knowledge/nodes'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_leadingindicator(self):
        url = '/api/leading-indicators'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_monitoringrule(self):
        url = '/api/monitoring-rules'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_monitoringrun(self):
        url = '/api/monitoring-runs'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_predictionoutcome(self):
        url = '/api/prediction-outcomes'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_predictionupdate(self):
        url = '/api/prediction-updates'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_prediction(self):
        url = '/api/predictions'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_roadmapitem(self):
        url = '/api/roadmap-items'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_scenario(self):
        url = '/api/scenarios'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_sourcesnapshot(self):
        url = '/api/source-snapshots'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_strategiccontext(self):
        url = '/api/strategic-contexts'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_strategicimplication(self):
        url = '/api/strategic-implications'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_strategicoption(self):
        url = '/api/strategic-options'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_trendscorechange(self):
        url = '/api/trend-score-changes'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_trendscoresnapshot(self):
        url = '/api/trend-score-snapshots'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_whatchangedsummary(self):
        url = '/api/what-changed-summaries'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_agent_discovery_uses_industry_source_candidates(self):
        industry = Industry.objects.create(
            name='Online grocery supermarket',
            geography='New Zealand',
            description='Track retail grocery customer experience and delivery trends.',
        )
        url = f'/api/agents/discovery/{industry.id}'
        response = self.client.post(url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertGreaterEqual(len(data), 5)
        self.assertTrue(any('Retail' in item['name'] or 'Grocery' in item['name'] for item in data))
        self.assertFalse(any(item['name'] == 'Gartner Magic Quadrant - AI' for item in data))
        self.assertTrue(all('Online grocery supermarket' in (item.get('notes') or '') for item in data))
