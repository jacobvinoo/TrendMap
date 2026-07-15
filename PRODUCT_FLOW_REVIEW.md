# TrendMap Product Flow Review

Date: 2026-07-14

## Executive Summary

TrendMap has the raw building blocks for a strategic trend intelligence workflow: industry setup, theme derivation, source discovery, news scanning, document capture, signal extraction, trend generation, evidence traceability, monitoring, and strategy outputs.

The main product issue is that these building blocks are still exposed as separate operational screens. For a regular executive or product manager user, the tool should not feel like a pipeline they must manually drive. It should feel like an intelligence desk that continuously watches the market, groups related developments into stable topics, highlights what is new, explains why it matters, and asks the user for decisions only where judgment is needed.

The target experience should be:

1. TrendMap scans automatically.
2. New findings appear in a dedicated review queue.
3. Similar findings are proposed for merge into existing themes/trends rather than creating duplicates.
4. Each strategic topic has a timeline of developments.
5. The user can approve, merge, dismiss, or escalate findings into strategy work.
6. Approved trend changes flow into opportunity sizing, roadmap timing, strategic options, and decision briefs.

## Current Flow Observed

The current navigation is organized by implementation phase:

- Discover: Industry Setup, Themes, Sources, Documents, Signals, Trends, Insights
- Monitor: Dashboard, Rules Engine, Alerts
- Strategize: Strategy Context, Assumptions, Indicators, Implications, Scenarios, Options, Decision Brief, Roadmap
- Intelligence Hub: Agent Activity, Debate Console, Prediction Timeline
- Operations: Semantic Search, Data Health

This is useful for development and testing, but not ideal for regular use. It requires users to understand internal pipeline stages and to remember where new information may appear.

Current strengths:

- Themes exist as a stage before source discovery.
- Sources have a review state.
- News scanning exists and can add source candidates.
- Documents can be reviewed and traced to sources.
- Signals are traceable to documents and sources.
- Trends can be approved and reviewed with evidence.
- Monitoring models exist for runs, score snapshots, changes, alerts, and summaries.
- Data health and traceability checks exist.

Current gaps:

- There is no unified "New Findings" review inbox.
- There is no clear daily or regular-use landing page.
- Similar themes are not clustered or proposed for merge.
- News snippets, new documents, new signals, and changed trends are not presented as one coherent change narrative.
- The user must manually move between Themes, Sources, Documents, Signals, Trends, and Insights to understand what happened.
- Agent Activity is a technical log, not an executive review surface.
- Monitoring Dashboard summarizes runs but does not provide a topic-by-topic timeline of developments.
- Trend approval is separated from the larger question: "What changed, why does it matter, and what should we do?"

## Persona

Primary persona: Executive or Product Manager responsible for strategic planning in an industry such as online grocery.

They want to know:

- What changed since last review?
- Which themes or trends are gaining momentum?
- What is genuinely new versus a duplicate or rewording?
- What evidence supports this?
- What should I approve, ignore, merge, or investigate?
- What are the strategic implications?
- What initiatives should start now, and when do they need to land?

They do not want to:

- Manage extraction stages manually.
- Inspect raw agent logs unless debugging.
- Resolve duplicates after they already polluted trends.
- Read thin snippets without clear interpretation.
- Guess which screen contains the latest change.

## Recommended Product Model

TrendMap should be organized around four user-facing concepts:

1. Watchlist Topics
2. New Findings
3. Trend Timelines
4. Strategic Actions
5. User Workspaces and Access Control

### 1. Watchlist Topics

A Watchlist Topic is the durable strategic area the system monitors. It should replace loose, duplicate "theme" creation as the anchor object.

Examples:

- Shopper value and affordability
- Digital grocery discovery and personalisation
- Fulfilment, availability, and convenience
- Trust and transparency in AI recommendations
- Retail media influence on grocery discovery

Current duplicate example:

- "Value-seeking grocery behaviour"
- "Shopper value and affordability"

These should not remain separate unless the user explicitly decides they are different. The system should propose a merge:

- Recommended canonical topic: Shopper value and affordability
- Similar candidate: Value-seeking grocery behaviour
- Reason: shared keywords include value, pricing, affordability, shopper behaviour, promotions
- Suggested action: merge candidate into canonical topic and preserve aliases

Each topic should store:

- Canonical name
- Aliases
- Description
- Keywords
- User-approved monitoring questions
- Related sources
- Related documents
- Related signals
- Related trends
- Status: candidate, approved, merged, dismissed
- Owner or business area, optional
- Last reviewed date
- Last changed date

### 2. New Findings

New Findings should be a dedicated review area and ideally the regular-use home screen.

It should collect all newly discovered or changed intelligence from the automatic cycle:

- New theme/topic candidates
- Suggested topic merges
- New source candidates
- New news snippets
- New captured documents
- New extracted signals
- New trend candidates
- Changed trend scores
- Contradictory evidence
- New strategic implications
- Alerts requiring action

This screen should be organized by decision, not by data type:

- Review New Developments
- Merge or Create Topics
- Approve Sources
- Validate Signals
- Approve Trend Changes
- Escalate to Strategy

Each finding card should answer:

- What is new?
- Which topic does it affect?
- Why does it matter?
- What evidence supports it?
- What confidence does TrendMap have?
- What action is recommended?
- What will happen if approved?

Possible actions:

- Approve
- Dismiss
- Merge with existing topic
- Create new topic
- Attach to existing trend
- Create candidate trend
- Request more evidence
- Add to watchlist
- Escalate to strategy review

### 3. Trend Timelines

Each approved topic/trend should have a timeline of developments.

The timeline should show:

- Date discovered
- Evidence date
- Source
- Snippet or document excerpt
- Extracted signal
- Impact on trend score
- Whether the evidence confirms, strengthens, weakens, or contradicts the trend
- User decision taken
- Link to source/document/evidence
- Importance score at that point in time
- Score movement since the previous review
- Explanation of why the score increased, decreased, or stayed flat

A Product Manager should be able to open "Shopper value and affordability" and scan:

- What happened this week?
- What has changed over the last 30/90/180 days?
- Is evidence accumulating or fading?
- Why did importance go up or down?
- Which evidence caused the movement?
- Which sources are driving the narrative?
- Which assumptions are becoming more or less credible?
- What decisions have already been made?

Timeline filters:

- New since last review
- Confirming evidence
- Contradictory evidence
- High-confidence only
- By source
- By market/geography
- By customer segment
- By strategic priority

### Importance Score and Evidence Momentum

The product should maintain a topic/trend importance score over time. This is not just a static impact score. It should help users see whether the evidence base for a topic is strengthening, weakening, broadening, narrowing, or becoming contradictory.

Recommended score components:

- Evidence volume: how many relevant signals/documents appeared in the period
- Evidence quality: source credibility, document depth, directness of evidence
- Source diversity: whether evidence comes from multiple independent sources
- Recency: whether evidence is current or aging
- Strategic relevance: match to saved priorities, customer segments, competitors, and time horizons
- Business materiality: estimated revenue, cost, risk, customer, or operational impact
- Momentum: rate of change versus prior periods
- Confidence: consistency and strength of supporting evidence
- Contradiction penalty: credible evidence that weakens or challenges the trend
- Noise penalty: duplicate, thin, generic, or low-context evidence

Recommended displayed scores:

- Importance: overall strategic significance now
- Momentum: whether evidence is accelerating or cooling
- Confidence: how much trust to place in the interpretation
- Evidence strength: quality and directness of supporting evidence
- Business impact: size of opportunity/risk if the trend materializes

The timeline should show score changes as auditable events:

- "Importance increased from 62 to 74 because three new high-credibility sources reported growth in value-seeking grocery behaviour, including one direct competitor signal."
- "Confidence decreased from 71 to 58 because two new documents were generic retail commentary and one prior supporting source was rejected."
- "Momentum cooled from 68 to 52 because no new strong evidence appeared in the last 45 days."
- "Impact increased from 55 to 70 after the user added revenue exposure and churn assumptions to opportunity sizing."

Each score movement should link to:

- New evidence that raised the score
- Contradictory evidence that lowered the score
- Stale evidence that aged out
- User decisions that changed status or business assumptions
- Model/rule explanation for the score delta

This turns the timeline from a feed into a reasoning trail. The user should be able to answer: "Why did TrendMap think this became more or less important, and do I agree?"

### 4. Strategic Actions

Once a trend has enough evidence, the product should guide the user toward action:

- Size the opportunity
- Define assumptions to test
- Create strategic options
- Create roadmap initiatives
- Create monitoring indicators
- Add to decision brief

The workflow should connect trend intelligence to business decisions:

- New evidence increases confidence in "Digital grocery discovery"
- User reviews timeline and approves the trend update
- TrendMap proposes opportunity sizing inputs
- User enters business assumptions
- TrendMap estimates revenue/cost/risk opportunity
- TrendMap proposes initiatives and timing
- User selects initiatives for roadmap

## Target Regular-Use Flow

### Flow A: Daily or Weekly Executive Review

Goal: Quickly understand what changed and what requires a decision.

Entry point: New Findings dashboard.

Steps:

1. User opens TrendMap.
2. The home screen shows "New since last review".
3. User sees grouped findings by topic.
4. User reviews each high-priority finding:
   - What changed
   - Why it matters
   - Evidence
   - Suggested decision
5. User approves, dismisses, merges, or requests more evidence.
6. Approved changes update topic timelines, trend scores, and strategy outputs.

Data to surface:

- Count of new findings
- Count of high-priority findings
- Topics with most movement
- New/changed trend scores
- New evidence sources
- Contradictory signals
- Recommended actions
- Last scan date and scan health

### Flow B: Topic Review

Goal: Understand one strategic topic deeply.

Entry point: Watchlist Topic page or topic card from New Findings.

Steps:

1. User opens a topic, for example "Shopper value and affordability".
2. User sees a timeline of all developments.
3. User filters to new developments since last review.
4. User opens supporting documents/snippets.
5. User reviews current trend interpretation.
6. User approves trend update or requests more evidence.

Data to surface:

- Topic summary
- Aliases and merged topics
- Evidence timeline
- Related signals
- Related trends
- Score history
- Confidence/momentum changes
- Open assumptions
- Recommended monitoring questions
- Strategic implications

### Flow C: Duplicate Theme/Topic Resolution

Goal: Prevent duplicate strategic topics from fragmenting the analysis.

Entry point: New Findings or Topic Governance.

Steps:

1. Automatic scan produces or updates a theme/topic.
2. System compares it to existing approved topics.
3. If similarity is high, system creates a merge proposal rather than a new topic.
4. User reviews:
   - Existing topic
   - Candidate topic
   - Similarity reason
   - Shared evidence/signals
   - Proposed canonical name
5. User chooses:
   - Merge
   - Keep separate
   - Rename
   - Dismiss candidate

Data to surface:

- Similarity score
- Shared keywords
- Overlapping signals
- Overlapping sources
- Evidence examples
- Proposed canonical topic
- Preserved aliases
- Impact of merge on trends and timelines

### Flow D: Source and News Review

Goal: Review new sources and news snippets without losing strategic context.

Entry point: New Findings, filtered to "Sources and News".

Steps:

1. System scans news and source feeds.
2. Relevant news snippets are grouped by topic.
3. New source candidates are shown with the snippet that caused discovery.
4. User approves source, dismisses source, or asks for document extraction.
5. Approved source becomes part of monitoring.

Data to surface:

- News headline
- Publisher/source
- Published date
- Retrieved date
- Topic match
- Why it matched
- Source credibility/relevance/freshness
- Whether source is new or already known
- Suggested next action

### Flow E: Signal and Trend Validation

Goal: Validate whether extracted evidence is strong enough to affect strategy.

Entry point: New Findings, Documents, Signals, or Trends.

Steps:

1. New document is captured.
2. Signals are extracted.
3. Signals are grouped under existing topics.
4. TrendMap proposes:
   - attach to existing trend
   - create new trend
   - mark as weak evidence
   - mark as duplicate/noise
5. User reviews the evidence and confirms.

Data to surface:

- Signal title
- Key takeaway
- Evidence snippet
- Source and document
- Confidence
- Novelty
- Strength
- Topic assignment
- Trend impact
- Why signal is not noise

### Flow F: Strategy Translation

Goal: Convert approved trends into business action.

Entry point: Approved trend, Topic page, Insights, or Roadmap.

Steps:

1. User opens approved trend.
2. TrendMap shows opportunity hypothesis.
3. User enters business inputs.
4. TrendMap estimates market/revenue/cost/risk impact.
5. User selects actions to test or implement.
6. Actions flow into roadmap and decision brief.

Data to surface:

- Opportunity hypothesis
- Business inputs required
- Current assumptions
- Sensitivity ranges
- Revenue/cost/risk estimate
- Readiness date
- Required initiative start date
- Recommended experiments
- Evidence confidence

## Recommended Information Architecture

The current phase-based navigation should be retained for advanced/admin use, but the main executive workflow should be reorganized.

Recommended primary navigation:

1. Home / New Findings
2. Watchlist Topics
3. Trend Timelines
4. Strategy & Roadmap
5. Sources & Evidence
6. Operations / Data Health

Advanced navigation can expose:

- Documents
- Signals
- Agent Activity
- Semantic Search
- Debug Traceability

## Proposed New Finding Types

Introduce a first-class Finding object.

Suggested fields:

- id
- findingType: topic_candidate, merge_proposal, source_candidate, news_snippet, document_capture, signal, trend_candidate, trend_score_change, contradiction, strategic_action
- topicId
- candidateTopicId
- trendId
- sourceId
- documentId
- signalId
- title
- summary
- whyItMatters
- evidenceSnippet
- confidenceScore
- noveltyScore
- impactScore
- recommendedAction
- status: new, reviewed, approved, dismissed, merged, escalated
- discoveredAt
- evidenceDate
- retrievedAt
- reviewDecision
- reviewNote

This object would allow the UI to show one coherent review queue instead of forcing users to inspect many pipeline screens.

## Duplicate Topic Handling

The app needs explicit topic governance.

Recommended dedupe logic:

1. Normalize names and aliases.
2. Compare keyword overlap.
3. Compare signal overlap.
4. Compare evidence/source overlap.
5. Compare embedding similarity when available.
6. If similarity is above threshold, create a merge proposal.
7. Do not create a new approved topic automatically when a likely duplicate exists.

Recommended merge proposal fields:

- existingTopicId
- candidateTopicId
- similarityScore
- proposedCanonicalName
- sharedKeywords
- overlappingSignals
- representativeEvidence
- recommendedDecision
- userDecision

Important: merging should preserve aliases so search and future matching still recognize old wording.

## Regular Automatic Cycle

The product needs a clear recurring intelligence cycle:

1. Scan approved topics.
2. Scan approved sources.
3. Scan news for topic-relevant developments.
4. Discover new source candidates.
5. Capture documents/snippets.
6. Extract signals.
7. Match signals to existing topics/trends.
8. Detect duplicates or contradictions.
9. Update trend scores.
10. Create New Findings for user review.
11. Notify user of important findings.

The current "Trigger Global Cycle" in Agent Activity is too technical and disconnected from review outcomes. It should become "Run Intelligence Scan" and route the user to New Findings when complete.

## What Should Be Highlighted to Users

For an executive/PM, the priority is not raw volume. The product should prioritize:

- New evidence affecting high-value topics
- New trends not previously tracked
- Existing trends whose confidence or momentum changed materially
- Contradictory evidence
- Evidence from high-credibility sources
- Evidence related to strategic priorities
- Evidence with near-term timing impact
- Sources that repeatedly produce useful signals
- Topics with weak evidence that need more scanning

Each highlighted finding should include:

- Headline
- A one-sentence interpretation
- Evidence quote/snippet
- Source and date
- Topic/trend affected
- Confidence
- Recommended user decision

## Specific Current Product Issues

1. Themes can duplicate because matching is mostly exact-name based.

Current `ensure_theme` behavior checks name equality. It does not appear to create merge proposals for semantically similar themes such as "Value-seeking grocery behaviour" and "Shopper value and affordability".

2. News scan creates source candidates but does not create a user-facing insight queue.

The news scan can create `NewsSnippet` records and suggested sources, but the user sees this mostly through Source Library, not as topic-based developments.

3. Agent Activity is operational, not executive.

It lists agent events but does not summarize what changed, what evidence was found, or what the user should review.

4. Monitoring Dashboard is run-centric, not topic-centric.

It shows active rules and latest scan summary, but not a timeline of developments per topic.

5. Trends remain too downstream.

The user should not need to inspect Documents and Signals to understand whether something important happened. Those should remain available as evidence layers behind a finding.

6. User decisions are spread across screens.

Theme approval, source approval, document extraction, signal review, trend approval, and strategy actions happen in different places. This makes regular use feel like operating machinery rather than reviewing intelligence.

## Suggested Screen Designs

### New Findings Dashboard

Header:

- Last scan completed
- New findings count
- High-priority count
- Topics changed
- Scan health

Main sections:

- Requires Decision
- New Developments by Topic
- Merge Proposals
- Contradictions / Weak Signals
- Newly Suggested Sources

Finding card:

- Topic
- Finding type
- What changed
- Why it matters
- Evidence snippet
- Source/date
- Confidence/impact
- Recommended action
- Buttons: Approve, Dismiss, Merge, Request More Evidence, Escalate

### Watchlist Topics

Show stable strategic topics, not raw theme candidates.

For each topic:

- Current status
- Latest development
- Evidence count
- Momentum
- Confidence
- Last reviewed
- Open review items

Include a "Topic Governance" section for:

- Merge proposals
- Alias management
- Candidate topics
- Retired topics

### Topic Timeline

Timeline rows:

- Date
- Development type
- Evidence
- Signal/trend effect
- Importance score before and after
- Score delta
- Reason for score change
- User decision

Views:

- Last 7 days
- Last 30 days
- Last 90 days
- Custom

Grouping:

- By evidence source
- By signal type
- By confidence
- By strategic implication

### Strategy Translation

For approved trend/topic:

- Opportunity hypothesis
- Business sizing inputs
- Evidence confidence
- Timing window
- Recommended experiments
- Roadmap implications

## Data Model Additions Recommended

Add or formalize:

- Topic
- TopicAlias
- Finding
- MergeProposal
- TopicTimelineEvent
- ReviewDecision
- IntelligenceScanRun

Existing objects such as TrendTheme, NewsSnippet, Signal, TrendScoreSnapshot, ChangeEvent, Alert, and WhatChangedSummary can feed these higher-level objects, but they should not be the primary executive-facing workflow.

## Implementation Priority

### Priority 1: Product Flow Foundation

- Add New Findings as the regular-use home screen.
- Create Finding records from scans, theme derivation, source discovery, document extraction, signal extraction, trend analysis, and monitoring.
- Route scan completion to New Findings instead of Agent Activity.

### Priority 2: Topic Governance

- Promote themes into stable Watchlist Topics.
- Add aliases.
- Add duplicate detection and merge proposals.
- Prevent likely duplicate themes from being directly created as separate approved topics.

### Priority 3: Topic Timeline

- Create timeline events for new snippets, documents, signals, trend score changes, contradictions, approvals, and strategy decisions.
- Add topic-level timeline UI.
- Add score movement explanations so users can see when and why importance increased or decreased.

### Priority 4: Strategy Translation

- Connect approved trend/topic updates to opportunity sizing and roadmap actions.
- Make "what changed" flow into "what should we do".

### Priority 5: Automation and Notifications

- Add scheduled scans.
- Add "new since last review".
- Add digest notifications or summary export.

## Key Design Principle

TrendMap should not ask executives to operate the pipeline. It should run the pipeline, resolve obvious duplicates, create reviewable proposals for ambiguous decisions, and present a clear narrative:

- What changed
- Why it matters
- What evidence supports it
- What decision is needed
- What strategic action follows

That is the core shift from a trend extraction tool to a strategic intelligence product.

## User Management and Data Separation

TrendMap also needs explicit user management before it can support regular business use. Strategic intelligence data is sensitive: industry setup, sources, signals, trend interpretations, opportunity sizing, and roadmap actions may differ by company, business unit, geography, or individual user.

The product should support separated user workspaces rather than treating all data as global. A workspace should be the primary unit of scope and should have its own pipeline.

This is cleaner than introducing a separate "analysis area" concept inside a workspace. A user or organization can create multiple workspaces:

- Company-wide trend analysis
- Search
- Digital Marketing
- Retail Media
- Fulfilment and Availability
- Pricing and Value
- Customer Experience
- Competitor Monitoring

Each workspace has its own industry setup, topics, sources, scan rules, findings, trend timelines, scores, assumptions, opportunity sizing, roadmap actions, and decision briefs.

Data can still be reused across workspaces, but interpretation should remain workspace-specific. For example, the same BCG article could be reused in both "Company-wide trend analysis" and "Search", but the generated signals, importance score, trend interpretation, and strategic actions should be different in each workspace.

### Recommended Access Model

Use a workspace or tenant model:

- Organization
- Workspace
- User
- Role
- Membership
- Permission

Each major data object should belong to a workspace:

- Industry profile
- Watchlist topic
- Theme/topic candidate
- Source
- News snippet
- Document
- Signal
- Trend
- Evidence link
- Finding
- Merge proposal
- Timeline event
- Opportunity sizing inputs
- Strategic context
- Roadmap item
- Decision brief
- Monitoring rule
- Agent activity
- Audit event

This prevents one user's or team's data from appearing in another user's workflow.

### Multiple Workspaces per User

Users should be able to belong to and switch between multiple workspaces.

Example workspace setup:

- Workspace 1: Company-wide grocery trends
- Workspace 2: Search strategy
- Workspace 3: Digital Marketing
- Workspace 4: Retail Media
- Workspace 5: Competitor tracking

Each workspace should define:

- Name
- Purpose
- Scope description
- Included business questions
- Industry or functional focus
- Included topics
- Included sources
- Included/excluded geographies
- Included/excluded customer segments
- Included competitors
- Time horizon
- Scan frequency
- Owner
- Shared/private status
- User permissions

Each workspace should have its own regular pipeline:

1. Theme/topic discovery
2. Source discovery
3. News scanning
4. Document capture
5. Signal extraction
6. Trend clustering
7. Finding review
8. Topic timeline update
9. Score update
10. Strategy translation

This means the Search workspace can focus deeply on search-to-cart conversion, zero-result recovery, AI-assisted product discovery, substitutions, and recommendation quality without being diluted by broader company-wide trends.

### Shared Evidence, Workspace-Specific Interpretation

Separate reusable evidence from workspace interpretation.

Reusable evidence layer:

- Source records
- News snippets
- Documents
- Extracted excerpts
- Raw metadata
- Fetch/capture status
- Source reliability history

Workspace-specific interpretation layer:

- Topic membership
- Signal relevance
- Trend names and summaries
- New Findings
- Importance scores
- Momentum/confidence scores
- Strategic implications
- Opportunity sizing assumptions
- Roadmap recommendations
- Decision briefs
- User review status

This prevents duplication of captured evidence while allowing each workspace to interpret the same material differently.

For example, a BCG article on AI ROI could be reused in:

- Company-wide trend analysis: broad AI operating model implications
- Search: AI-assisted discovery and conversion impact
- Digital Marketing: personalization, offers, campaign productivity
- Retail Media: sponsored placement transparency and monetization

Example:

Evidence:

- Article: "How CPG retail leaders maximize AI ROI"
- Shared source: BCG
- Shared excerpt: AI investments are being tied to revenue, margin, productivity, and customer engagement outcomes.

Company-wide workspace interpretation:

- Trend: AI operating model discipline
- Implication: prioritize AI investments with measurable enterprise ROI

Search workspace interpretation:

- Trend: AI-assisted grocery discovery
- Implication: improve search-to-cart conversion and zero-result recovery

Digital Marketing workspace interpretation:

- Trend: AI-personalized activation
- Implication: shift campaign spend toward recommendation-attributed sales and lifecycle personalization

### Workspace UX

Add a workspace switcher as a primary control.

The user should see:

- Organization: "Online Grocery Co"
- Workspace: "Company-wide Trends" or "Search" or "Digital Marketing"
- User role in that workspace

Switching workspace should change:

- New Findings
- Watchlist Topics
- Trend Timelines
- Opportunity sizing
- Roadmap recommendations
- Decision briefs
- Monitoring rules
- Agent activity
- Data health

It may reuse:

- Approved sources
- Raw documents
- Captured excerpts
- News snippets

The UI should make scope visible everywhere. For example:

- "New Findings for Search"
- "Topic Timeline: AI-assisted grocery discovery | Workspace: Search"
- "This evidence is also reused in: Company-wide Trends, Digital Marketing"

### Creating a New Workspace

Recommended flow:

1. User clicks "Create Workspace".
2. User chooses:
   - Start from company-wide setup
   - Start from an existing workspace
   - Start blank
3. User defines scope:
   - Workspace name
   - Key business questions
   - Included topics
   - Included sources
   - Customer segments
   - Competitors
   - Time horizon
   - Whether to reuse existing evidence
   - Whether to share future evidence with other workspaces
4. TrendMap proposes initial topics and relevant existing evidence from other permitted workspaces.
5. User approves topics and monitoring scope.
6. TrendMap starts producing findings specific to that workspace.

For example, creating a "Search" workspace from company-wide analysis should propose:

- Digital grocery discovery and personalisation
- Zero-result search reduction
- Conversational commerce
- Sponsored placement transparency
- Recommendation-attributed sales
- Substitution and availability guidance

Creating a "Digital Marketing" workspace might propose:

- Personalised offers
- Retail media monetisation
- Loyalty activation
- AI campaign optimization
- Customer lifecycle orchestration
- Measurement and attribution changes

### Cross-Workspace Reuse and Governance

When new evidence arrives, TrendMap should evaluate relevance to each workspace that has permission to use the source/evidence.

Possible outcomes:

- Evidence is irrelevant to all workspaces.
- Evidence is relevant only to Search.
- Evidence is relevant to Search and Digital Marketing, but with different interpretations.
- Evidence affects a company-wide trend and a focused area trend.

The user should be able to:

- Attach evidence to one or more workspaces.
- Exclude evidence from a workspace.
- Reinterpret a signal for a specific workspace.
- Promote a focused-workspace finding to company-wide review.
- Link related trends across workspaces.

Recommended relationship types:

- same_evidence_as
- specializes
- rolls_up_to
- contradicts
- supports
- derivative_of

Example:

- Search trend "AI-assisted grocery discovery" rolls up to company-wide trend "AI operating model discipline".
- Digital Marketing trend "AI-personalized activation" uses the same BCG evidence but has different opportunity sizing inputs.

### Data Model Additions for Workspace Pipelines

Add:

- Workspace
- WorkspaceMembership
- WorkspacePermission
- SharedEvidenceLink
- WorkspaceSourceLink
- WorkspaceDocumentLink
- WorkspaceSignalInterpretation
- WorkspaceTrendInterpretation
- WorkspaceFinding
- WorkspaceTimelineEvent
- CrossWorkspaceRelationship

Key principle: Source, Document, and raw evidence can be reused across workspaces; Findings, Topics, Trends, Scores, and Strategic Outputs should be scoped to one workspace.

### Scoring by Workspace

Importance should be calculated per workspace.

The same evidence can increase the importance score in the Search workspace while only slightly affecting the company-wide workspace.

Example:

- Evidence: AI improves search relevance and basket conversion.
- Search workspace importance score: +14 because it directly affects search-to-cart conversion.
- Company-wide workspace importance score: +4 because it is one supporting data point in a broader AI trend.
- Digital Marketing workspace importance score: +8 if the evidence also supports personalization or recommendation-attributed sales.

The timeline should show score movement inside the selected workspace, with optional cross-workspace comparison.

### Roles

Recommended roles:

- Owner: manages workspace, users, billing/export, destructive actions
- Admin: manages configuration, sources, data health, automation settings
- Strategist: reviews findings, approves trends, edits strategy, creates roadmap actions
- Analyst: adds sources/documents, reviews evidence, proposes topics and trends
- Viewer: reads approved outputs and evidence, cannot approve or mutate data

Optional specialized roles:

- Source Curator: approves sources and source quality
- Strategy Approver: approves trends, decision briefs, and roadmap recommendations
- Auditor: read-only access to audit logs and traceability

### Permission Examples

- Only Owners/Admins can invite users or delete workspaces.
- Admins and Source Curators can approve/reject sources.
- Strategists can approve trends and escalate findings to strategy.
- Analysts can propose themes, add evidence, and mark signals as useful/noise.
- Viewers can read approved topics, trends, insights, timelines, and decision briefs.
- Only Admins can run destructive data cleanup.
- Only Owners/Admins can export full workspace data.

### Data Visibility Rules

Every query should be scoped by workspace membership.

Examples:

- A user should only see industry profiles for workspaces they belong to.
- Source discovery should add sources only to the active workspace.
- News scans should create findings only in the workspace that initiated or scheduled the scan.
- Semantic search should search only permitted workspace data.
- Agent activity logs should be scoped to workspace and visible based on role.
- Data health checks should run per workspace.

### Personal Versus Shared Data

Some data should be workspace-shared:

- Topics
- Sources
- Documents
- Signals
- Trends
- Evidence
- Findings
- Strategy outputs

Some data should be user-specific:

- Last reviewed timestamp
- Saved filters
- Notification preferences
- Personal notes or bookmarks
- Dismissed UI hints
- Sidebar/navigation preferences

Important: "new since last review" should be calculated per user, not only per workspace. One strategist may have reviewed a finding while another has not.

### Audit and Traceability

User management must connect to auditability.

Track:

- Who approved a source
- Who merged topics
- Who dismissed a finding
- Who approved a trend
- Who changed opportunity sizing assumptions
- Who edited a roadmap item
- Who exported data
- Who ran or scheduled scans
- Who deleted or cleaned data

Each review decision should store:

- userId
- workspaceId
- entityType
- entityId
- decision
- rationale or note
- timestamp

### UX Implications

Add a workspace switcher:

- Current workspace name
- Current industry profile
- User role
- Last scan status

Add user-facing access cues:

- Disabled actions should explain required permission.
- Destructive actions should show who can perform them.
- Findings should show review status per user and workspace.
- Decision history should show reviewer names and timestamps.

### Implementation Priority for Access Control

Priority 1:

- Add workspace ownership to all domain entities.
- Add user, workspace, membership, and role models.
- Scope repository/API queries by active workspace.

Priority 2:

- Add permissions for approving sources, approving trends, merging topics, running scans, and clearing data.
- Add per-user last-reviewed state for New Findings.

Priority 3:

- Add audit log UI and decision history.
- Add workspace switcher and user invitation flow.

Priority 4:

- Add organization-level administration, export controls, and optional single sign-on.

## Black Hat Review: Where This Could Go Wrong

This section deliberately looks for failure modes in the proposed product direction. The goal is not to weaken the vision, but to prevent TrendMap from becoming a confident-looking system that creates confusion, duplicate work, or bad strategic decisions.

### 1. The Product Could Become Too Complex for Regular Use

Risk:

The proposed model includes workspaces, topics, findings, timelines, scores, evidence reuse, user roles, audit trails, merge proposals, and strategy translation. Each concept is reasonable, but together they could overwhelm users.

How it fails:

- Users do not know whether to look at New Findings, Topics, Timelines, Trends, Insights, or Strategy.
- Users create too many workspaces and fragment the intelligence base.
- Users spend more time managing the system than reviewing market changes.
- Product managers stop using it because it feels like an admin console.

Mitigation:

- Make New Findings the default daily screen.
- Hide advanced pipeline screens under an "Evidence & Operations" area.
- Provide opinionated default flows: Review, Merge, Approve, Escalate.
- Limit workspace creation with templates and clear purpose statements.
- Show only the next best action for each finding.

### 2. Multiple Workspaces Could Fragment Strategy

Risk:

The workspace model is cleaner than hidden analysis areas, but it can create silos. Search, Digital Marketing, Retail Media, and Company-wide workspaces may each interpret the same evidence differently and drift apart.

How it fails:

- Search and Digital Marketing both create similar trends with different names.
- Company-wide leaders lose visibility into important focused-workspace findings.
- Evidence is reused without a clear roll-up mechanism.
- Teams disagree because they see different scores for the same underlying article.

Mitigation:

- Add cross-workspace relationships such as rolls_up_to, specializes, same_evidence_as.
- Create a "Promote to company-wide review" action.
- Show "also used in these workspaces" on evidence.
- Add cross-workspace duplicate detection for topics and trends.
- Provide an organization-level portfolio view of major trends across workspaces.

### 3. Evidence Reuse Could Break Data Boundaries

Risk:

Reusing evidence across workspaces is useful, but it can violate access expectations if one workspace contains sensitive sources, private documents, or restricted strategy interpretations.

How it fails:

- A user in the Search workspace sees a document uploaded privately in the Company-wide workspace.
- Evidence metadata leaks confidential source names.
- A document is reused in a workspace where the user lacks permission.
- Export from one workspace accidentally includes shared evidence from another workspace.

Mitigation:

- Separate raw evidence permissions from interpretation permissions.
- Require explicit sharing policy per source/document: private, workspace-only, organization-shared.
- Show provenance and access scope on every reused evidence item.
- Enforce permission checks at query/API level, not only in UI.
- Add export previews showing exactly what will be included.

### 4. Automatic Scanning Could Produce Noise at Scale

Risk:

If TrendMap scans themes, sources, news, documents, and signals automatically, it can generate a flood of weak findings.

How it fails:

- New Findings becomes a junk drawer.
- Users approve low-quality evidence just to clear the queue.
- Trend scores move because of volume, not importance.
- Sources with frequent publishing dominate the narrative.

Mitigation:

- Use strict thresholds for finding creation.
- Separate "captured" from "review-worthy".
- Penalize duplicate, thin, generic, and source-churn evidence.
- Add digest mode: "Top 5 changes since last review".
- Let users tune scan sensitivity per workspace.
- Track precision: how often users approve versus dismiss findings.

### 5. Duplicate Detection Could Merge Things That Should Stay Separate

Risk:

The proposed merge proposal system is necessary, but similarity matching can over-merge topics that look similar linguistically but differ strategically.

Example:

- "Value-seeking grocery behaviour" and "Shopper value and affordability" probably should merge.
- But "pricing pressure" and "loyalty-funded value perception" may need to stay separate.

How it fails:

- Important nuance disappears.
- Topic timelines become muddy.
- Trend scoring becomes misleading because different phenomena are combined.
- Users distrust the merge recommendations.

Mitigation:

- Never auto-merge strategic topics without review.
- Preserve aliases and merge history.
- Show why the merge is proposed: keywords, evidence overlap, signal overlap, source overlap.
- Allow "keep separate and remember this decision".
- Support parent/child relationships instead of forcing binary merge/separate.

### 6. Scores Could Create False Precision

Risk:

Importance, momentum, confidence, evidence strength, and business impact scores are useful, but they can look more scientific than they are.

How it fails:

- Executives treat a score of 74 as objectively better than 69.
- Users optimize the score rather than the underlying reasoning.
- A score drops due to missing data, not because the trend weakened.
- High-volume media cycles inflate importance.

Mitigation:

- Show score bands rather than over-precise values where appropriate.
- Always show "why changed" next to score movement.
- Separate evidence momentum from business impact.
- Show confidence intervals or "directional only" labels.
- Make score formulas inspectable.
- Allow users to override scores with rationale.

### 7. Timeline Explanations Could Become Unreadable

Risk:

The timeline is intended as a reasoning trail, but it can become cluttered if every scan, signal, score delta, approval, and source update is shown.

How it fails:

- Users cannot distinguish major developments from minor evidence changes.
- Score movement explanations repeat boilerplate.
- The timeline becomes long but not insightful.

Mitigation:

- Default to summarized timeline events.
- Collapse low-impact evidence into grouped events.
- Highlight only material score changes.
- Provide filters for evidence, decisions, contradictions, and score changes.
- Add a "why this matters" summary at the top of each time period.

### 8. Human Review Could Become a Bottleneck

Risk:

The design relies on users approving findings, sources, merges, trends, and strategy actions. That creates governance, but it can also stall the system.

How it fails:

- Review queues pile up.
- Old unreviewed findings make the product feel stale.
- Users defer decisions because each card requires too much reading.
- Automated scans keep generating work without closing loops.

Mitigation:

- Add bulk actions for low-risk findings.
- Add auto-dismiss rules for recurring noise.
- Add review SLAs or "stale review" indicators.
- Prioritize findings by expected strategic impact.
- Let users subscribe only to selected topics/workspaces.
- Use weekly digest review as a workflow, not only item-by-item review.

### 9. Strategic Outputs Could Be Built on Weak Evidence

Risk:

TrendMap aims to connect findings to opportunity sizing, roadmap timing, and decision briefs. If evidence quality is weak, the strategy outputs may look polished but be unreliable.

How it fails:

- Thin snippets become roadmap initiatives.
- Generic trend statements become investment recommendations.
- Opportunity sizing uses assumptions that are not tied to evidence.
- Decision briefs hide uncertainty.

Mitigation:

- Require evidence thresholds before strategy escalation.
- Label weak-evidence trends clearly.
- Show assumption quality and evidence coverage.
- Require user confirmation for opportunity sizing inputs.
- Include "what would change our mind" in decision briefs.
- Track which roadmap items came from which evidence and assumptions.

### 10. Source Quality Could Be Hard to Govern

Risk:

Source credibility, relevance, and freshness are not enough. Bias, paywalls, PR content, syndicated articles, and SEO pages can distort trend analysis.

How it fails:

- Vendor blogs overstate market change.
- PR articles appear as independent signals.
- Syndicated copies create duplicate evidence.
- Paywalled sites produce thin captures that still influence scores.

Mitigation:

- Add source bias/type labels: vendor, analyst, academic, news, PR, regulator, competitor.
- Track source independence and duplication.
- Penalize thin captures.
- Distinguish primary evidence from commentary.
- Require source diversity for high-confidence trend updates.

### 11. Workspace Pipelines Could Create Operational Cost

Risk:

If every workspace has its own pipeline, scan jobs, extraction, scoring, and timeline events can multiply quickly.

How it fails:

- Same article is fetched repeatedly.
- Scheduled scans become slow or expensive.
- Users create many workspaces that no one reviews.
- Background jobs fail silently.

Mitigation:

- Reuse fetched/captured evidence through a shared evidence cache.
- Run workspace-specific interpretation after shared capture.
- Add workspace activity/health indicators.
- Pause inactive workspaces.
- Add scan budgets or limits per workspace.
- Surface failed jobs in New Findings/Data Health.

### 12. Access Control Could Be Added Too Late

Risk:

If workspace/user separation is retrofitted after data has accumulated, migration becomes risky.

How it fails:

- Existing global data must be assigned to workspaces manually.
- Queries accidentally return cross-workspace records.
- Tests pass with one workspace but fail in multi-user use.
- Audit history lacks user/workspace context.

Mitigation:

- Add workspace_id and created_by early.
- Make every repository/API query workspace-scoped.
- Add tests specifically for cross-workspace data leakage.
- Include workspace/user context in audit events from the beginning.
- Add migration tooling for assigning legacy data.

### 13. Users May Not Trust Agent Decisions

Risk:

Agents proposing themes, sources, merges, scores, and strategy actions can feel opaque.

How it fails:

- Users reject good recommendations because rationale is unclear.
- Users accept bad recommendations because the UI sounds confident.
- The tool becomes either ignored or over-trusted.

Mitigation:

- Show concise rationale for every agent recommendation.
- Separate "agent suggestion" from "approved fact".
- Provide evidence-first explanation.
- Let users give feedback: useful, duplicate, irrelevant, wrong topic.
- Track recommendation quality by approval/dismissal patterns.

### 14. "New Since Last Review" Can Be Misleading

Risk:

Newness depends on user, workspace, source date, retrieval date, evidence date, and review date.

How it fails:

- Old articles appear new because they were retrieved today.
- One user sees something as reviewed because another user reviewed it.
- A stale source update appears as a market development.

Mitigation:

- Distinguish published date, retrieved date, first seen date, and reviewed date.
- Calculate "new since last review" per user and workspace.
- Label backfilled evidence separately.
- Let users mark a topic/workspace reviewed up to a date.

### 15. The Product Could Lose the Executive Narrative

Risk:

TrendMap can become excellent at collecting and structuring evidence but still fail to answer the executive question: "So what?"

How it fails:

- Users see many cards but no prioritization.
- Trend timelines show activity but not strategic meaning.
- Decision briefs summarize rather than recommend.
- Roadmaps are generated without trade-offs.

Mitigation:

- Every major screen should answer: what changed, why it matters, what decision is needed, what action follows.
- Keep a small set of executive-level priorities visible.
- Require opportunity/risk framing before roadmap creation.
- Show trade-offs and assumptions, not just recommendations.

## Highest-Risk Assumptions to Test First

Before building the full design, test these assumptions with users:

1. Users understand and prefer multiple workspaces over analysis areas inside one workspace.
2. Users want a New Findings inbox as the primary daily workflow.
3. Users trust score movement when explanations are evidence-linked.
4. Users can resolve merge proposals quickly without fatigue.
5. Shared evidence with workspace-specific interpretation is understandable.
6. Product managers want strategy outputs generated from approved trends, not only evidence summaries.
7. Automatic scanning creates enough useful findings to justify review overhead.

## Design Guardrails

- Do not auto-merge strategic topics without review.
- Do not let weak evidence generate confident strategy recommendations.
- Do not show score movement without an explanation.
- Do not expose cross-workspace evidence without explicit permission.
- Do not make users operate every pipeline stage manually.
- Do not hide uncertainty in executive summaries.
- Do not treat every new article as a strategic finding.
- Do not allow workspace proliferation without ownership and review health.
