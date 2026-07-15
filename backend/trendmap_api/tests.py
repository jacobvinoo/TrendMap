from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.utils import timezone
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Industry, Source, Document, Signal, Trend, TrendTheme, EvidenceLink, ExtractionRun, HealthCheck, NewsSnippet, NewsScanRun, Workspace, Finding, StrategicOption, RoadmapItem, WorkspaceMembership, AuditEvent
from . import views
from unittest.mock import patch
from urllib.error import HTTPError
import json

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

    def test_source_lists_are_scoped_by_workspace_header(self):
        company = Workspace.objects.create(id='ws-company', name='Company-wide Trends', purpose='Broad monitoring')
        search = Workspace.objects.create(id='ws-search', name='Search', purpose='Search monitoring')
        Source.objects.create(name='Company Source', url='https://example.com/company', status='approved', workspace=company)
        Source.objects.create(name='Search Source', url='https://example.com/search', status='approved', workspace=search)

        response = self.client.get('/api/sources', HTTP_X_TRENDMAP_WORKSPACE='ws-search')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item['name'] for item in response.json()], ['Search Source'])

    def test_workspace_create_endpoint_creates_standalone_workspace(self):
        response = self.client.post('/api/workspaces', {
            'id': 'ws-new',
            'name': 'Search',
            'purpose': 'Focused search trend pipeline',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = Workspace.objects.get(id=response.json()['id'])
        self.assertEqual(created.name, 'Search')
        self.assertIsNotNone(created.created_at)
        self.assertIsNotNone(created.updated_at)

    def test_workspace_create_endpoint_assigns_creator_owner_role(self):
        response = self.client.post('/api/workspaces', {
            'id': 'ws-owned',
            'name': 'Retail Media',
            'purpose': 'Retail media trend pipeline',
        }, format='json', HTTP_X_TRENDMAP_USER='user-analyst')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()['currentUserRole'], 'owner')
        membership = WorkspaceMembership.objects.get(workspace_id=response.json()['id'], user_id='user-analyst')
        self.assertEqual(membership.role, 'owner')

    def test_workspace_list_is_scoped_to_current_user_memberships(self):
        company = Workspace.objects.create(id='ws-company', name='Company-wide Trends')
        search = Workspace.objects.create(id='ws-search', name='Search')
        marketing = Workspace.objects.create(id='ws-marketing', name='Digital Marketing')
        WorkspaceMembership.objects.create(id='mem-company', workspace=company, user_id='user-analyst', role='strategist')
        WorkspaceMembership.objects.create(id='mem-search', workspace=search, user_id='user-analyst', role='analyst')
        WorkspaceMembership.objects.create(id='mem-marketing', workspace=marketing, user_id='other-user', role='owner')

        response = self.client.get('/api/workspaces', HTTP_X_TRENDMAP_USER='user-analyst')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual({item['id'] for item in response.json()}, {'ws-company', 'ws-search'})
        roles = {item['id']: item['currentUserRole'] for item in response.json()}
        self.assertEqual(roles['ws-company'], 'strategist')
        self.assertEqual(roles['ws-search'], 'analyst')

    def test_workspace_owner_can_manage_members(self):
        workspace = Workspace.objects.create(id='ws-search', name='Search')
        WorkspaceMembership.objects.create(id='mem-owner', workspace=workspace, user_id='user-owner', role='owner')

        add_response = self.client.post(
            '/api/workspaces/ws-search/members',
            {'userId': 'user-analyst', 'role': 'analyst'},
            format='json',
            HTTP_X_TRENDMAP_USER='user-owner',
        )

        self.assertEqual(add_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(add_response.json()['userId'], 'user-analyst')
        self.assertEqual(add_response.json()['role'], 'analyst')

        update_response = self.client.patch(
            '/api/workspaces/ws-search/members/user-analyst',
            {'role': 'strategist'},
            format='json',
            HTTP_X_TRENDMAP_USER='user-owner',
        )

        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.json()['role'], 'strategist')

        list_response = self.client.get('/api/workspaces/ws-search/members', HTTP_X_TRENDMAP_USER='user-owner')

        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual({member['userId'] for member in list_response.json()}, {'user-owner', 'user-analyst'})

        delete_response = self.client.delete('/api/workspaces/ws-search/members/user-analyst', HTTP_X_TRENDMAP_USER='user-owner')

        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(WorkspaceMembership.objects.filter(workspace=workspace, user_id='user-analyst').exists())
        self.assertTrue(AuditEvent.objects.filter(entity_type='workspace', action='workspace.member.added').exists())
        self.assertTrue(AuditEvent.objects.filter(entity_type='workspace', action='workspace.member.role_updated').exists())
        self.assertTrue(AuditEvent.objects.filter(entity_type='workspace', action='workspace.member.removed').exists())

    def test_non_admin_cannot_manage_workspace_members(self):
        workspace = Workspace.objects.create(id='ws-search', name='Search')
        WorkspaceMembership.objects.create(id='mem-owner', workspace=workspace, user_id='user-owner', role='owner')
        WorkspaceMembership.objects.create(id='mem-analyst', workspace=workspace, user_id='user-analyst', role='analyst')

        response = self.client.post(
            '/api/workspaces/ws-search/members',
            {'userId': 'user-viewer', 'role': 'viewer'},
            format='json',
            HTTP_X_TRENDMAP_USER='user-analyst',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(WorkspaceMembership.objects.filter(workspace=workspace, user_id='user-viewer').exists())

    def test_workspace_must_keep_at_least_one_owner(self):
        workspace = Workspace.objects.create(id='ws-search', name='Search')
        WorkspaceMembership.objects.create(id='mem-owner', workspace=workspace, user_id='user-owner', role='owner')

        demote_response = self.client.patch(
            '/api/workspaces/ws-search/members/user-owner',
            {'role': 'admin'},
            format='json',
            HTTP_X_TRENDMAP_USER='user-owner',
        )

        self.assertEqual(demote_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(WorkspaceMembership.objects.get(workspace=workspace, user_id='user-owner').role, 'owner')

        delete_response = self.client.delete('/api/workspaces/ws-search/members/user-owner', HTTP_X_TRENDMAP_USER='user-owner')

        self.assertEqual(delete_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(WorkspaceMembership.objects.filter(workspace=workspace, user_id='user-owner').exists())

    def test_clear_analysis_data_requires_owner_or_admin_role(self):
        workspace = Workspace.objects.create(id='ws-search', name='Search')
        WorkspaceMembership.objects.create(id='mem-analyst', workspace=workspace, user_id='user-analyst', role='analyst')
        Trend.objects.create(id='trend-clear-blocked', workspace=workspace, name='Trend to preserve', status='candidate')

        response = self.client.post(
            '/api/admin/clear-analysis-data',
            {},
            format='json',
            HTTP_X_TRENDMAP_USER='user-analyst',
            HTTP_X_TRENDMAP_WORKSPACE='ws-search',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Trend.objects.filter(id='trend-clear-blocked').count(), 1)

    def test_owner_can_clear_analysis_data(self):
        workspace = Workspace.objects.create(id='ws-search', name='Search')
        WorkspaceMembership.objects.create(id='mem-owner', workspace=workspace, user_id='user-owner', role='owner')
        Trend.objects.create(id='trend-clear-allowed', workspace=workspace, name='Trend to clear', status='candidate')

        response = self.client.post(
            '/api/admin/clear-analysis-data',
            {},
            format='json',
            HTTP_X_TRENDMAP_USER='user-owner',
            HTTP_X_TRENDMAP_WORKSPACE='ws-search',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Trend.objects.filter(id='trend-clear-allowed').count(), 0)
        event = AuditEvent.objects.get(entity_type='workspace', entity_id='ws-search')
        self.assertEqual(event.user_id, 'user-owner')
        self.assertEqual(event.action, 'analysis_data.cleared')
        details = json.loads(event.details)
        self.assertEqual(details['workspaceId'], 'ws-search')
        self.assertEqual(details['deletedCounts']['trends'], 1)

    def test_analyst_cannot_approve_source(self):
        workspace = Workspace.objects.create(id='ws-search', name='Search')
        WorkspaceMembership.objects.create(id='mem-analyst-source', workspace=workspace, user_id='user-analyst', role='analyst')
        Source.objects.create(id='src-review', workspace=workspace, name='Review Source', url='https://example.com/review', status='suggested')

        response = self.client.patch(
            '/api/sources/src-review',
            {'status': 'approved'},
            format='json',
            HTTP_X_TRENDMAP_USER='user-analyst',
            HTTP_X_TRENDMAP_WORKSPACE='ws-search',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Source.objects.get(id='src-review').status, 'suggested')

    def test_source_curator_can_approve_source(self):
        workspace = Workspace.objects.create(id='ws-search', name='Search')
        WorkspaceMembership.objects.create(id='mem-curator-source', workspace=workspace, user_id='user-curator', role='source_curator')
        Source.objects.create(id='src-curator-review', workspace=workspace, name='Review Source', url='https://example.com/curator', status='suggested')

        response = self.client.patch(
            '/api/sources/src-curator-review',
            {'status': 'approved'},
            format='json',
            HTTP_X_TRENDMAP_USER='user-curator',
            HTTP_X_TRENDMAP_WORKSPACE='ws-search',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Source.objects.get(id='src-curator-review').status, 'approved')
        event = AuditEvent.objects.get(entity_type='source', entity_id='src-curator-review')
        self.assertEqual(event.user_id, 'user-curator')
        self.assertEqual(event.action, 'source.status.approved')
        details = json.loads(event.details)
        self.assertEqual(details['workspaceId'], 'ws-search')
        self.assertEqual(details['previousStatus'], 'suggested')
        self.assertEqual(details['newStatus'], 'approved')

    def test_analyst_cannot_approve_finding(self):
        workspace = Workspace.objects.create(id='ws-search', name='Search')
        WorkspaceMembership.objects.create(id='mem-analyst-finding', workspace=workspace, user_id='user-analyst', role='analyst')
        Finding.objects.create(id='finding-review', workspace=workspace, finding_type='trend_candidate', title='Finding', summary='Review me', status='new')

        response = self.client.patch(
            '/api/findings/finding-review',
            {'status': 'approved'},
            format='json',
            HTTP_X_TRENDMAP_USER='user-analyst',
            HTTP_X_TRENDMAP_WORKSPACE='ws-search',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Finding.objects.get(id='finding-review').status, 'new')

    def test_strategist_can_approve_finding(self):
        workspace = Workspace.objects.create(id='ws-search', name='Search')
        WorkspaceMembership.objects.create(id='mem-strategist-finding', workspace=workspace, user_id='user-strategist', role='strategist')
        Finding.objects.create(id='finding-strategy-review', workspace=workspace, finding_type='trend_candidate', title='Finding', summary='Review me', status='new')

        response = self.client.patch(
            '/api/findings/finding-strategy-review',
            {'status': 'approved'},
            format='json',
            HTTP_X_TRENDMAP_USER='user-strategist',
            HTTP_X_TRENDMAP_WORKSPACE='ws-search',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Finding.objects.get(id='finding-strategy-review').status, 'approved')
        event = AuditEvent.objects.get(entity_type='finding', entity_id='finding-strategy-review')
        self.assertEqual(event.user_id, 'user-strategist')
        self.assertEqual(event.action, 'finding.status.approved')
        details = json.loads(event.details)
        self.assertEqual(details['workspaceId'], 'ws-search')
        self.assertEqual(details['previousStatus'], 'new')
        self.assertEqual(details['newStatus'], 'approved')

    def test_analyst_cannot_approve_trend(self):
        workspace = Workspace.objects.create(id='ws-search', name='Search')
        WorkspaceMembership.objects.create(id='mem-analyst-trend', workspace=workspace, user_id='user-analyst', role='analyst')
        Trend.objects.create(id='trend-review', workspace=workspace, name='Review Trend', status='candidate')

        response = self.client.patch(
            '/api/trends/trend-review',
            {'status': 'approved'},
            format='json',
            HTTP_X_TRENDMAP_USER='user-analyst',
            HTTP_X_TRENDMAP_WORKSPACE='ws-search',
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Trend.objects.get(id='trend-review').status, 'candidate')

    def test_strategist_can_approve_trend(self):
        workspace = Workspace.objects.create(id='ws-search', name='Search')
        WorkspaceMembership.objects.create(id='mem-strategist-trend', workspace=workspace, user_id='user-strategist', role='strategist')
        Trend.objects.create(id='trend-strategy-review', workspace=workspace, name='Review Trend', status='candidate')

        response = self.client.patch(
            '/api/trends/trend-strategy-review',
            {'status': 'approved'},
            format='json',
            HTTP_X_TRENDMAP_USER='user-strategist',
            HTTP_X_TRENDMAP_WORKSPACE='ws-search',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Trend.objects.get(id='trend-strategy-review').status, 'approved')
        event = AuditEvent.objects.get(entity_type='trend', entity_id='trend-strategy-review')
        self.assertEqual(event.user_id, 'user-strategist')
        self.assertEqual(event.action, 'trend.status.approved')
        details = json.loads(event.details)
        self.assertEqual(details['workspaceId'], 'ws-search')
        self.assertEqual(details['previousStatus'], 'candidate')
        self.assertEqual(details['newStatus'], 'approved')

    def test_trend_history_reads_audit_events_for_trend(self):
        AuditEvent.objects.create(
            id='audit-trend-1',
            user_id='user-strategist',
            action='trend.status.approved',
            entity_type='trend',
            entity_id='trend-history',
            details=json.dumps({'workspaceId': 'ws-search'}),
            timestamp=timezone.now(),
        )
        AuditEvent.objects.create(
            id='audit-source-1',
            user_id='user-curator',
            action='source.status.approved',
            entity_type='source',
            entity_id='src-history',
            details=json.dumps({'workspaceId': 'ws-search'}),
            timestamp=timezone.now(),
        )

        response = self.client.get('/api/audit-events?entity_type=trend&entity_id=trend-history')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]['entity_id'], 'trend-history')

    def test_audit_events_can_be_filtered_by_workspace(self):
        AuditEvent.objects.create(
            id='audit-search-workspace',
            user_id='user-strategist',
            action='trend.status.approved',
            entity_type='trend',
            entity_id='trend-search',
            details=json.dumps({'workspaceId': 'ws-search'}),
            timestamp=timezone.now(),
        )
        AuditEvent.objects.create(
            id='audit-company-workspace',
            user_id='user-strategist',
            action='trend.status.approved',
            entity_type='trend',
            entity_id='trend-company',
            details=json.dumps({'workspaceId': 'ws-company'}),
            timestamp=timezone.now(),
        )

        response = self.client.get('/api/audit-events?workspace_id=ws-search')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.json()), 1)
        self.assertEqual(response.json()[0]['entity_id'], 'trend-search')

    def test_missing_trend_evidence_returns_empty_list_for_review_board(self):
        response = self.client.get('/api/trends/stale-trend/evidence', HTTP_X_TRENDMAP_WORKSPACE='ws-search')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), [])

    def test_findings_are_workspace_scoped_and_reviewable(self):
        company = Workspace.objects.create(id='ws-company', name='Company-wide Trends')
        search = Workspace.objects.create(id='ws-search', name='Search')
        Finding.objects.create(
            id='finding-company',
            workspace=company,
            finding_type='source_candidate',
            title='Company finding',
            summary='Company-only finding',
            status='new',
        )
        Finding.objects.create(
            id='finding-search',
            workspace=search,
            finding_type='merge_proposal',
            title='Search finding',
            summary='Search-only finding',
            status='new',
        )

        response = self.client.get('/api/findings', HTTP_X_TRENDMAP_WORKSPACE='ws-search')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item['title'] for item in response.json()], ['Search finding'])

        patch_response = self.client.patch('/api/findings/finding-search', {'status': 'approved'}, format='json', HTTP_X_TRENDMAP_WORKSPACE='ws-search')

        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.assertEqual(Finding.objects.get(id='finding-search').status, 'approved')

    def test_similar_theme_create_generates_merge_proposal_instead_of_duplicate(self):
        workspace = Workspace.objects.create(id='ws-search', name='Search')
        industry = Industry.objects.create(id='ind-search', workspace=workspace, name='Online Grocery', geography='NZ')
        canonical = TrendTheme.objects.create(
            id='theme-value',
            workspace=workspace,
            industry=industry,
            name='Shopper value and affordability',
            description='Price sensitivity, promotions, and affordability pressure.',
            keywords=['value', 'affordability', 'pricing', 'promotions'],
            status='approved',
            origin='manual',
        )

        response = self.client.post('/api/themes', {
            'industry_id': industry.id,
            'name': 'Value-seeking grocery behaviour',
            'description': 'Shoppers are looking harder for value and deals.',
            'keywords': ['value', 'price', 'deals', 'shopper behaviour'],
            'status': 'approved',
            'origin': 'manual',
        }, format='json', HTTP_X_TRENDMAP_WORKSPACE=workspace.id)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TrendTheme.objects.filter(workspace=workspace).count(), 1)
        finding = Finding.objects.get(workspace=workspace, finding_type='merge_proposal')
        self.assertIn('Value-seeking grocery behaviour', finding.title)
        self.assertEqual(finding.metadata_json['canonicalThemeId'], canonical.id)

    def test_approving_merge_proposal_adds_theme_alias_and_marks_merged(self):
        workspace = Workspace.objects.create(id='ws-search', name='Search')
        canonical = TrendTheme.objects.create(
            id='theme-value',
            workspace=workspace,
            name='Shopper value and affordability',
            keywords=['value', 'affordability', 'pricing'],
            status='approved',
            origin='manual',
        )
        finding = Finding.objects.create(
            id='finding-merge',
            workspace=workspace,
            finding_type='merge_proposal',
            title='Merge Value-seeking grocery behaviour into Shopper value and affordability',
            summary='The candidate overlaps with the approved topic.',
            status='new',
            metadata_json={
                'canonicalThemeId': canonical.id,
                'candidateThemeName': 'Value-seeking grocery behaviour',
                'candidateKeywords': ['value', 'price', 'deals'],
            },
        )

        response = self.client.patch(f'/api/findings/{finding.id}', {'status': 'approved'}, format='json', HTTP_X_TRENDMAP_WORKSPACE=workspace.id)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        canonical.refresh_from_db()
        finding.refresh_from_db()
        self.assertIn('Value-seeking grocery behaviour', canonical.aliases)
        self.assertEqual(finding.status, 'merged')

    def test_strategic_options_are_scoped_by_workspace_header(self):
        company = Workspace.objects.create(id='ws-company', name='Company-wide Trends')
        search = Workspace.objects.create(id='ws-search', name='Search')
        StrategicOption.objects.create(
            id='option-company',
            workspace=company,
            title='Company option',
            option_type='monitor',
            linked_trend_ids='[]',
            linked_scenario_ids='[]',
            linked_assumption_ids='[]',
            expected_benefits='[]',
            key_risks='[]',
            required_capabilities='[]',
            estimated_effort='low',
            time_to_value='12_months',
            impact_score=0.5,
            feasibility_score=0.5,
            urgency_score=0.5,
            confidence_score=0.5,
            priority_score=0.5,
            recommended_next_step='Review later',
            status='proposed',
        )
        StrategicOption.objects.create(
            id='option-search',
            workspace=search,
            title='Search option',
            option_type='experiment',
            linked_trend_ids='[]',
            linked_scenario_ids='[]',
            linked_assumption_ids='[]',
            expected_benefits='[]',
            key_risks='[]',
            required_capabilities='[]',
            estimated_effort='medium',
            time_to_value='6_months',
            impact_score=0.8,
            feasibility_score=0.7,
            urgency_score=0.8,
            confidence_score=0.8,
            priority_score=0.78,
            recommended_next_step='Run pilot',
            status='proposed',
        )

        response = self.client.get('/api/strategic-options', HTTP_X_TRENDMAP_WORKSPACE='ws-search')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item['title'] for item in response.json()], ['Search option'])

    def test_roadmap_items_are_scoped_by_workspace_header(self):
        company = Workspace.objects.create(id='ws-company', name='Company-wide Trends')
        search = Workspace.objects.create(id='ws-search', name='Search')
        company_option = StrategicOption.objects.create(
            id='option-company',
            workspace=company,
            title='Company option',
            option_type='monitor',
            linked_trend_ids='[]',
            linked_scenario_ids='[]',
            linked_assumption_ids='[]',
            expected_benefits='[]',
            key_risks='[]',
            required_capabilities='[]',
            estimated_effort='low',
            time_to_value='12_months',
            impact_score=0.5,
            feasibility_score=0.5,
            urgency_score=0.5,
            confidence_score=0.5,
            priority_score=0.5,
            recommended_next_step='Review later',
            status='accepted',
        )
        search_option = StrategicOption.objects.create(
            id='option-search',
            workspace=search,
            title='Search option',
            option_type='experiment',
            linked_trend_ids='[]',
            linked_scenario_ids='[]',
            linked_assumption_ids='[]',
            expected_benefits='[]',
            key_risks='[]',
            required_capabilities='[]',
            estimated_effort='medium',
            time_to_value='6_months',
            impact_score=0.8,
            feasibility_score=0.7,
            urgency_score=0.8,
            confidence_score=0.8,
            priority_score=0.78,
            recommended_next_step='Run pilot',
            status='accepted',
        )
        RoadmapItem.objects.create(
            id='roadmap-company',
            workspace=company,
            strategic_option=company_option,
            title='Company roadmap item',
            horizon='later',
            owner='',
            status='proposed',
            success_metric='Company KPI',
            linked_indicator_ids='[]',
        )
        RoadmapItem.objects.create(
            id='roadmap-search',
            workspace=search,
            strategic_option=search_option,
            title='Search roadmap item',
            horizon='now',
            owner='',
            status='proposed',
            success_metric='Search KPI',
            linked_indicator_ids='[]',
        )

        response = self.client.get('/api/roadmap-items', HTTP_X_TRENDMAP_WORKSPACE='ws-search')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item['title'] for item in response.json()], ['Search roadmap item'])

    def test_roadmap_item_execution_fields_are_updateable(self):
        workspace = Workspace.objects.create(id='ws-search', name='Search')
        option = StrategicOption.objects.create(
            id='option-search',
            workspace=workspace,
            title='Search option',
            option_type='experiment',
            linked_trend_ids='[]',
            linked_scenario_ids='[]',
            linked_assumption_ids='[]',
            expected_benefits='[]',
            key_risks='[]',
            required_capabilities='[]',
            estimated_effort='medium',
            time_to_value='6_months',
            impact_score=0.8,
            feasibility_score=0.7,
            urgency_score=0.8,
            confidence_score=0.8,
            priority_score=0.78,
            recommended_next_step='Run pilot',
            status='accepted',
        )
        RoadmapItem.objects.create(
            id='roadmap-search',
            workspace=workspace,
            strategic_option=option,
            title='Search roadmap item',
            horizon='now',
            owner='',
            status='proposed',
            success_metric='Search KPI',
            linked_indicator_ids='[]',
        )

        response = self.client.patch('/api/roadmap-items/roadmap-search', {
            'owner': 'Search Product Lead',
            'target_date': '2026-09-30',
            'progress_percent': 35,
            'progress_note': 'Pilot scope agreed with merchandising.',
            'last_reviewed_at': '2026-07-14T10:00:00Z',
        }, format='json', HTTP_X_TRENDMAP_WORKSPACE='ws-search')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = RoadmapItem.objects.get(id='roadmap-search')
        self.assertEqual(item.owner, 'Search Product Lead')
        self.assertEqual(str(item.target_date), '2026-09-30')
        self.assertEqual(item.progress_percent, 35)
        self.assertEqual(item.progress_note, 'Pilot scope agreed with merchandising.')

    def test_create_source_accepts_long_url(self):
        long_url = 'https://example.com/source?' + '&'.join([f'utm_param_{index}=value{index}' for index in range(40)])

        response = self.client.post('/api/sources', {
            'name': 'Long URL source',
            'url': long_url,
            'status': 'approved',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Source.objects.get(name='Long URL source').url, long_url)

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

    def test_create_manual_document_accepts_long_reference_url(self):
        source = Source.objects.create(name='Long Link Source', url='https://example.com', status='approved')
        long_url = 'https://example.com/reports/online-grocery.pdf?' + '&'.join([f'_gl_{index}=abcdefghijklmnopqrstuvwxyz' for index in range(35)])

        response = self.client.post('/api/documents', {
            'source_id': source.id,
            'title': 'Long URL evidence',
            'url': long_url,
            'content': 'Long URL evidence about online grocery, supermarket shopping, pricing, and delivery expectations.',
            'ingestion_status': 'raw',
            'published_date': timezone.now().isoformat(),
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Document.objects.get(title='Long URL evidence').url, long_url)

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

    @patch('trendmap_api.views.fetch_source_excerpt')
    def test_refresh_document_content_replaces_thin_reference_stub(self, mock_fetch):
        source = Source.objects.create(name='BCG', url='https://www.bcg.com', status='approved')
        document = Document.objects.create(
            id='doc-refresh',
            source=source,
            title='bcg.com',
            url='https://www.bcg.com/publications/2026/how-cpg-retail-leaders-maximize-ai-roi?utm_campaign=ai&utm_source=esp',
            content='Manual reference URL added for review: https://www.bcg.com/publications/2026/how-cpg-retail-leaders-maximize-ai-roi',
            status='processed',
        )
        mock_fetch.return_value = (
            'How CPG retail leaders maximize AI ROI',
            'CPG and retail leaders are using artificial intelligence to improve ROI, pricing, merchandising, promotions, consumer engagement, category management, and digital commerce. The strongest retail use cases connect AI investments to measurable margin, revenue, shopper experience, and operating model gains.',
            'text/html',
        )

        response = self.client.post(f'/api/documents/{document.id}/refresh-content', format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        document.refresh_from_db()
        self.assertIn('CPG and retail leaders are using artificial intelligence', document.content)
        self.assertNotIn('Manual reference URL added for review', document.content)
        self.assertEqual(document.status, 'raw')

    @patch('trendmap_api.views.fetch_source_excerpt')
    def test_refresh_document_content_reports_blocked_capture_without_500(self, mock_fetch):
        source = Source.objects.create(name='BCG', url='https://www.bcg.com', status='approved')
        document = Document.objects.create(
            id='doc-refresh-blocked',
            source=source,
            title='bcg.com',
            url='https://www.bcg.com/publications/2026/how-cpg-retail-leaders-maximize-ai-roi',
            content='Manual reference URL added for review: https://www.bcg.com/publications/2026/how-cpg-retail-leaders-maximize-ai-roi',
            status='processed',
        )
        mock_fetch.side_effect = HTTPError(document.url, 403, 'Forbidden', hdrs=None, fp=None)

        response = self.client.post(f'/api/documents/{document.id}/refresh-content', format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('blocked automated capture', response.json()['detail'])
        self.assertIn('paste the article text', response.json()['detail'])

    @patch('trendmap_api.views.urlopen')
    def test_fetch_url_bytes_retries_without_tracking_query(self, mock_urlopen):
        class FakeResponse:
            headers = {'Content-Type': 'text/html'}

            def __enter__(self):
                return self

            def __exit__(self, exc_type, exc, traceback):
                return False

            def read(self, _limit):
                return b'<html><title>BCG article</title><body>Retail AI evidence.</body></html>'

        views.FETCH_BYTES_CACHE.clear()
        tracked_url = 'https://www.bcg.com/publications/2026/how-cpg-retail-leaders-maximize-ai-roi?utm_campaign=ai&utm_source=esp'
        mock_urlopen.side_effect = [
            HTTPError(tracked_url, 403, 'Forbidden', hdrs=None, fp=None),
            FakeResponse(),
        ]

        raw, content_type = views.fetch_url_bytes(tracked_url)

        self.assertIn(b'BCG article', raw)
        self.assertEqual(content_type, 'text/html')
        self.assertEqual(mock_urlopen.call_count, 2)
        self.assertEqual(mock_urlopen.call_args_list[1].args[0].full_url, 'https://www.bcg.com/publications/2026/how-cpg-retail-leaders-maximize-ai-roi')

    def test_replace_document_content_resets_extraction_and_clears_stale_traceability(self):
        source = Source.objects.create(name='Manual Source', url='https://example.com/manual', status='approved')
        document = Document.objects.create(
            id='doc-replace-content',
            source=source,
            title='Blocked article',
            content='Capture incomplete',
            status='extracted',
        )
        signal = Signal.objects.create(id='sig-stale-content', document=document, source=source, title='Stale Signal')
        trend = Trend.objects.create(id='trend-stale-content', name='Stale Trend', status='candidate')
        EvidenceLink.objects.create(
            id='ev-stale-content',
            trend=trend,
            signal=signal,
            document=document,
            source=source,
            relationship_type='supports',
        )
        pasted_content = (
            'CPG and retail leaders are using artificial intelligence to improve ROI across pricing, merchandising, '
            'promotions, consumer engagement, category management, and digital commerce. The strongest grocery and '
            'supermarket use cases connect AI investment to measurable margin improvement, revenue growth, shopper '
            'experience, loyalty, fulfilment efficiency, and operating model productivity over time.'
        )

        response = self.client.post(f'/api/documents/{document.id}/replace-content', {
            'content': pasted_content,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        document.refresh_from_db()
        self.assertIn('CPG and retail leaders are using artificial intelligence', document.content)
        self.assertEqual(document.status, 'raw')
        self.assertEqual(Signal.objects.filter(id='sig-stale-content').count(), 0)
        self.assertEqual(EvidenceLink.objects.filter(id='ev-stale-content').count(), 0)
        self.assertEqual(response.json()['extracted_signal_ids'], [])

    def test_replace_document_content_requires_reviewable_text(self):
        source = Source.objects.create(name='Manual Source', url='https://example.com/manual', status='approved')
        document = Document.objects.create(
            id='doc-replace-thin-content',
            source=source,
            title='Blocked article',
            content='Capture incomplete',
            status='processed',
        )

        response = self.client.post(f'/api/documents/{document.id}/replace-content', {
            'content': 'Too short.',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('40 words', response.json()['detail'])

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

    def test_clear_analysis_data_with_workspace_header_preserves_other_workspace_data(self):
        search = Workspace.objects.create(id='ws-search', name='Search')
        marketing = Workspace.objects.create(id='ws-marketing', name='Digital Marketing')
        WorkspaceMembership.objects.create(id='mem-search-owner', workspace=search, user_id='user-owner', role='owner')
        WorkspaceMembership.objects.create(id='mem-marketing-owner', workspace=marketing, user_id='other-owner', role='owner')
        search_industry = Industry.objects.create(id='ind-search-clear', workspace=search, name='Search industry', geography='NZ')
        marketing_industry = Industry.objects.create(id='ind-marketing-clear', workspace=marketing, name='Marketing industry', geography='NZ')
        search_source = Source.objects.create(id='src-search-clear', workspace=search, name='Search Source', url='https://example.com/search', status='approved')
        marketing_source = Source.objects.create(id='src-marketing-clear', workspace=marketing, name='Marketing Source', url='https://example.com/marketing', status='approved')
        search_run = ExtractionRun.objects.create(id='run-search-clear', industry=search_industry, stage='document_extraction', status='completed')
        marketing_run = ExtractionRun.objects.create(id='run-marketing-clear', industry=marketing_industry, stage='document_extraction', status='completed')
        search_doc = Document.objects.create(id='doc-search-clear', workspace=search, source=search_source, extraction_run=search_run, title='Search Doc', content='Search content', status='raw')
        marketing_doc = Document.objects.create(id='doc-marketing-clear', workspace=marketing, source=marketing_source, extraction_run=marketing_run, title='Marketing Doc', content='Marketing content', status='raw')
        search_signal = Signal.objects.create(id='sig-search-clear', workspace=search, document=search_doc, source=search_source, extraction_run=search_run, title='Search signal')
        marketing_signal = Signal.objects.create(id='sig-marketing-clear', workspace=marketing, document=marketing_doc, source=marketing_source, extraction_run=marketing_run, title='Marketing signal')
        search_trend = Trend.objects.create(id='trend-search-clear', workspace=search, extraction_run=search_run, name='Search trend', status='candidate')
        marketing_trend = Trend.objects.create(id='trend-marketing-clear', workspace=marketing, extraction_run=marketing_run, name='Marketing trend', status='candidate')
        EvidenceLink.objects.create(id='ev-search-clear', trend=search_trend, signal=search_signal, document=search_doc, source=search_source, extraction_run=search_run, relationship_type='supports')
        EvidenceLink.objects.create(id='ev-marketing-clear', trend=marketing_trend, signal=marketing_signal, document=marketing_doc, source=marketing_source, extraction_run=marketing_run, relationship_type='supports')

        response = self.client.post(
            '/api/admin/clear-analysis-data',
            format='json',
            HTTP_X_TRENDMAP_USER='user-owner',
            HTTP_X_TRENDMAP_WORKSPACE='ws-search',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Document.objects.filter(id='doc-search-clear').count(), 0)
        self.assertEqual(Signal.objects.filter(id='sig-search-clear').count(), 0)
        self.assertEqual(Trend.objects.filter(id='trend-search-clear').count(), 0)
        self.assertEqual(EvidenceLink.objects.filter(id='ev-search-clear').count(), 0)
        self.assertEqual(ExtractionRun.objects.filter(id='run-search-clear').count(), 0)
        self.assertEqual(Document.objects.filter(id='doc-marketing-clear').count(), 1)
        self.assertEqual(Signal.objects.filter(id='sig-marketing-clear').count(), 1)
        self.assertEqual(Trend.objects.filter(id='trend-marketing-clear').count(), 1)
        self.assertEqual(EvidenceLink.objects.filter(id='ev-marketing-clear').count(), 1)
        self.assertEqual(ExtractionRun.objects.filter(id='run-marketing-clear').count(), 1)

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
