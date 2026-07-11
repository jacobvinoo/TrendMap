CREATE TABLE alembic_version (
	version_num VARCHAR(32) NOT NULL, 
	CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);
CREATE TABLE industries (
	id VARCHAR NOT NULL, 
	name VARCHAR NOT NULL, 
	geography VARCHAR, 
	description TEXT, 
	strategic_priorities JSON, 
	customer_segments JSON, 
	competitors JSON, 
	time_horizons JSON, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id)
);
CREATE TABLE sources (
	id VARCHAR NOT NULL, 
	name VARCHAR NOT NULL, 
	url VARCHAR NOT NULL, 
	source_type VARCHAR, 
	credibility_score FLOAT CHECK (credibility_score >= 0.0 AND credibility_score <= 1.0), 
	relevance_score FLOAT CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0), 
	freshness_score FLOAT CHECK (freshness_score >= 0.0 AND freshness_score <= 1.0), 
	status VARCHAR(9), 
	notes TEXT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id)
);
CREATE TABLE trends (
	id VARCHAR NOT NULL, 
	name VARCHAR NOT NULL, 
	summary TEXT, 
	status VARCHAR(12), 
	horizon VARCHAR, 
	likelihood_score FLOAT CHECK (likelihood_score >= 0.0 AND likelihood_score <= 1.0), 
	confidence_score FLOAT CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0), 
	impact_score FLOAT CHECK (impact_score >= 0.0 AND impact_score <= 1.0), 
	maturity_stage VARCHAR, 
	created_at DATETIME, 
	updated_at DATETIME, related_signal_ids JSON, drivers JSON, blockers JSON, what_needs_to_be_true JSON, leading_indicators JSON, monitoring_questions JSON, recommended_actions JSON, 
	PRIMARY KEY (id)
);
CREATE TABLE strategic_contexts (
	id VARCHAR NOT NULL, 
	industry_profile_id VARCHAR NOT NULL, 
	company_name VARCHAR NOT NULL, 
	business_model VARCHAR, 
	target_customers TEXT, 
	strategic_goals TEXT, 
	current_capabilities TEXT, 
	constraints TEXT, 
	risk_appetite VARCHAR, 
	planning_horizons TEXT, 
	PRIMARY KEY (id)
);
CREATE TABLE scenarios (
	id VARCHAR NOT NULL, 
	name VARCHAR NOT NULL, 
	horizon VARCHAR, 
	summary TEXT, 
	scenario_type VARCHAR NOT NULL, 
	trigger_conditions TEXT, 
	assumptions TEXT, 
	implications TEXT, 
	probability_score FLOAT CHECK (probability_score >= 0.0 AND probability_score <= 1.0), 
	impact_score FLOAT CHECK (impact_score >= 0.0 AND impact_score <= 1.0), 
	confidence_score FLOAT CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0), 
	early_warning_indicators TEXT, 
	PRIMARY KEY (id)
);
CREATE TABLE strategic_options (
	id VARCHAR NOT NULL, 
	title VARCHAR NOT NULL, 
	description TEXT, 
	option_type VARCHAR, 
	linked_trend_ids TEXT, 
	linked_scenario_ids TEXT, 
	linked_assumption_ids TEXT, 
	expected_benefits TEXT, 
	key_risks TEXT, 
	required_capabilities TEXT, 
	estimated_effort VARCHAR, 
	time_to_value VARCHAR, 
	impact_score FLOAT CHECK (impact_score >= 0.0 AND impact_score <= 1.0), 
	feasibility_score FLOAT CHECK (feasibility_score >= 0.0 AND feasibility_score <= 1.0), 
	urgency_score FLOAT CHECK (urgency_score >= 0.0 AND urgency_score <= 1.0), 
	confidence_score FLOAT CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0), 
	priority_score FLOAT CHECK (priority_score >= 0.0 AND priority_score <= 1.0), 
	recommended_next_step VARCHAR, 
	status VARCHAR, 
	PRIMARY KEY (id)
);
CREATE TABLE agent_activities (
	id VARCHAR NOT NULL, 
	agent_role VARCHAR NOT NULL, 
	task_type VARCHAR, 
	status VARCHAR, 
	message TEXT, 
	timestamp DATETIME, 
	related_entity_id VARCHAR, 
	PRIMARY KEY (id)
);
CREATE TABLE kg_nodes (
	entity_id VARCHAR NOT NULL, 
	label VARCHAR NOT NULL, 
	summary TEXT, 
	node_type VARCHAR NOT NULL, 
	confidence_score FLOAT CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0), 
	evidence_ids TEXT, 
	properties TEXT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (entity_id)
);
CREATE TABLE audit_events (
	id VARCHAR NOT NULL, 
	user_id VARCHAR, 
	action VARCHAR NOT NULL, 
	entity_type VARCHAR NOT NULL, 
	entity_id VARCHAR NOT NULL, 
	details TEXT, 
	timestamp DATETIME, 
	PRIMARY KEY (id)
);
CREATE TABLE embeddings (
	id VARCHAR NOT NULL, 
	entity_type VARCHAR NOT NULL, 
	entity_id VARCHAR NOT NULL, 
	model_name VARCHAR NOT NULL, 
	text_content TEXT, 
	vector_data TEXT NOT NULL, 
	metadata_json TEXT, 
	created_at DATETIME, 
	PRIMARY KEY (id)
);
CREATE TABLE data_exports (
	id VARCHAR NOT NULL, 
	operation_type VARCHAR NOT NULL, 
	entity_type VARCHAR NOT NULL, 
	status VARCHAR, 
	file_url VARCHAR, 
	error_message TEXT, 
	created_at DATETIME, 
	completed_at DATETIME, 
	PRIMARY KEY (id)
);
CREATE TABLE health_checks (
	id VARCHAR NOT NULL, 
	component VARCHAR NOT NULL, 
	status VARCHAR NOT NULL, 
	latency_ms FLOAT, 
	details TEXT, 
	timestamp DATETIME, 
	PRIMARY KEY (id)
);
CREATE TABLE documents (
	id VARCHAR NOT NULL, 
	source_id VARCHAR NOT NULL, 
	title VARCHAR NOT NULL, 
	url VARCHAR, 
	content TEXT NOT NULL, 
	status VARCHAR(9), 
	published_at DATETIME, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(source_id) REFERENCES sources (id)
);
CREATE TABLE monitoring_rules (
	id VARCHAR NOT NULL, 
	source_id VARCHAR NOT NULL, 
	industry_profile_id VARCHAR NOT NULL, 
	frequency VARCHAR, 
	enabled VARCHAR, 
	keywords TEXT, 
	include_patterns TEXT, 
	exclude_patterns TEXT, 
	last_run_at DATETIME, 
	next_run_at DATETIME, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(source_id) REFERENCES sources (id)
);
CREATE TABLE alerts (
	id VARCHAR NOT NULL, 
	trend_id VARCHAR, 
	alert_type VARCHAR NOT NULL, 
	severity VARCHAR NOT NULL, 
	title VARCHAR NOT NULL, 
	message TEXT, 
	summary TEXT, 
	created_at DATETIME, 
	acknowledged VARCHAR, 
	related_signal_ids TEXT, 
	related_document_ids TEXT, 
	related_source_ids TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(trend_id) REFERENCES trends (id)
);
CREATE TABLE source_snapshots (
	id VARCHAR NOT NULL, 
	source_id VARCHAR NOT NULL, 
	captured_at DATETIME, 
	document_fingerprints TEXT, 
	raw_metadata TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(source_id) REFERENCES sources (id)
);
CREATE TABLE trend_score_snapshots (
	id VARCHAR NOT NULL, 
	trend_id VARCHAR NOT NULL, 
	captured_at DATETIME, 
	likelihood_score FLOAT CHECK (likelihood_score >= 0.0 AND likelihood_score <= 1.0), 
	confidence_score FLOAT CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0), 
	momentum_score FLOAT, 
	impact_score FLOAT CHECK (impact_score >= 0.0 AND impact_score <= 1.0), 
	horizon VARCHAR, 
	maturity_stage VARCHAR, 
	evidence_count FLOAT, 
	signal_count FLOAT, 
	source_diversity FLOAT, 
	reason TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(trend_id) REFERENCES trends (id)
);
CREATE TABLE assumptions (
	id VARCHAR NOT NULL, 
	trend_id VARCHAR NOT NULL, 
	statement VARCHAR NOT NULL, 
	assumption_type VARCHAR NOT NULL, 
	confidence_score FLOAT CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0), 
	importance_score FLOAT CHECK (importance_score >= 0.0 AND importance_score <= 1.0), 
	status VARCHAR, 
	related_signal_ids TEXT, 
	related_indicator_ids TEXT, 
	evidence_summary TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(trend_id) REFERENCES trends (id)
);
CREATE TABLE strategic_implications (
	id VARCHAR NOT NULL, 
	trend_id VARCHAR NOT NULL, 
	implication_type VARCHAR NOT NULL, 
	title VARCHAR NOT NULL, 
	summary TEXT, 
	affected_capabilities TEXT, 
	affected_customer_segments TEXT, 
	urgency_score FLOAT CHECK (urgency_score >= 0.0 AND urgency_score <= 1.0), 
	impact_score FLOAT CHECK (impact_score >= 0.0 AND impact_score <= 1.0), 
	confidence_score FLOAT CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0), 
	evidence_ids TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(trend_id) REFERENCES trends (id)
);
CREATE TABLE decision_briefs (
	id VARCHAR NOT NULL, 
	strategic_context_id VARCHAR, 
	generated_at DATETIME, 
	headline VARCHAR, 
	executive_summary TEXT, 
	top_opportunities TEXT, 
	top_threats TEXT, 
	recommended_options TEXT, 
	assumptions_to_test TEXT, 
	indicators_to_monitor TEXT, 
	evidence_ids TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(strategic_context_id) REFERENCES strategic_contexts (id)
);
CREATE TABLE roadmap_items (
	id VARCHAR NOT NULL, 
	strategic_option_id VARCHAR NOT NULL, 
	title VARCHAR NOT NULL, 
	horizon VARCHAR, 
	owner VARCHAR, 
	status VARCHAR, 
	success_metric VARCHAR, 
	linked_indicator_ids TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(strategic_option_id) REFERENCES strategic_options (id)
);
CREATE TABLE predictions (
	id VARCHAR NOT NULL, 
	trend_id VARCHAR NOT NULL, 
	prediction_statement VARCHAR NOT NULL, 
	target_date DATETIME, 
	impact VARCHAR, 
	confidence_score FLOAT CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0), 
	assumptions TEXT, 
	indicators TEXT, 
	evidence_ids TEXT, 
	status VARCHAR, 
	timestamp DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(trend_id) REFERENCES trends (id)
);
CREATE TABLE agent_debates (
	id VARCHAR NOT NULL, 
	topic VARCHAR NOT NULL, 
	trend_id VARCHAR, 
	status VARCHAR, 
	messages TEXT, 
	consensus_summary TEXT, 
	confidence_delta FLOAT, 
	timestamp DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(trend_id) REFERENCES trends (id)
);
CREATE TABLE kg_edges (
	id VARCHAR NOT NULL, 
	source_id VARCHAR NOT NULL, 
	target_id VARCHAR NOT NULL, 
	relationship_type VARCHAR NOT NULL, 
	confidence_score FLOAT CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0), 
	evidence_ids TEXT, 
	properties TEXT, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(source_id) REFERENCES kg_nodes (entity_id), 
	FOREIGN KEY(target_id) REFERENCES kg_nodes (entity_id)
);
CREATE TABLE signals (
	id VARCHAR NOT NULL, 
	document_id VARCHAR NOT NULL, 
	source_id VARCHAR NOT NULL, 
	title VARCHAR NOT NULL, 
	summary TEXT, 
	signal_type VARCHAR, 
	pestle_category VARCHAR, 
	novelty_score FLOAT CHECK (novelty_score >= 0.0 AND novelty_score <= 1.0), 
	strength_score FLOAT CHECK (strength_score >= 0.0 AND strength_score <= 1.0), 
	confidence_score FLOAT CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0), 
	evidence_date DATETIME, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(document_id) REFERENCES documents (id), 
	FOREIGN KEY(source_id) REFERENCES sources (id)
);
CREATE TABLE monitoring_runs (
	id VARCHAR NOT NULL, 
	rule_id VARCHAR NOT NULL, 
	source_id VARCHAR NOT NULL, 
	started_at DATETIME, 
	completed_at DATETIME, 
	status VARCHAR, 
	documents_scanned FLOAT, 
	new_documents_found FLOAT, 
	updated_documents_found FLOAT, 
	new_signals_found FLOAT, 
	affected_trend_ids TEXT, 
	alert_ids TEXT, 
	error_message TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(rule_id) REFERENCES monitoring_rules (id), 
	FOREIGN KEY(source_id) REFERENCES sources (id)
);
CREATE TABLE change_events (
	id VARCHAR NOT NULL, 
	source_id VARCHAR NOT NULL, 
	document_id VARCHAR, 
	change_type VARCHAR NOT NULL, 
	detected_at DATETIME, 
	previous_snapshot_id VARCHAR, 
	current_snapshot_id VARCHAR NOT NULL, 
	summary TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(source_id) REFERENCES sources (id), 
	FOREIGN KEY(document_id) REFERENCES documents (id), 
	FOREIGN KEY(previous_snapshot_id) REFERENCES source_snapshots (id), 
	FOREIGN KEY(current_snapshot_id) REFERENCES source_snapshots (id)
);
CREATE TABLE trend_score_changes (
	id VARCHAR NOT NULL, 
	trend_id VARCHAR NOT NULL, 
	previous_snapshot_id VARCHAR NOT NULL, 
	current_snapshot_id VARCHAR NOT NULL, 
	changed_at DATETIME, 
	applied_at DATETIME, 
	likelihood_delta FLOAT, 
	confidence_delta FLOAT, 
	impact_delta FLOAT, 
	new_confidence_score FLOAT, 
	new_momentum_score FLOAT, 
	new_impact_score FLOAT, 
	primary_reason VARCHAR, 
	horizon_changed VARCHAR, 
	maturity_changed VARCHAR, 
	reason TEXT, 
	related_signal_ids TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(trend_id) REFERENCES trends (id), 
	FOREIGN KEY(previous_snapshot_id) REFERENCES trend_score_snapshots (id), 
	FOREIGN KEY(current_snapshot_id) REFERENCES trend_score_snapshots (id)
);
CREATE TABLE leading_indicators (
	id VARCHAR NOT NULL, 
	assumption_id VARCHAR NOT NULL, 
	name VARCHAR NOT NULL, 
	description TEXT, 
	indicator_type VARCHAR, 
	current_status VARCHAR, 
	threshold VARCHAR, 
	monitoring_question VARCHAR, 
	related_source_ids TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(assumption_id) REFERENCES assumptions (id)
);
CREATE TABLE prediction_updates (
	id VARCHAR NOT NULL, 
	prediction_id VARCHAR NOT NULL, 
	update_text VARCHAR NOT NULL, 
	confidence_shift FLOAT, 
	timestamp DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(prediction_id) REFERENCES predictions (id)
);
CREATE TABLE prediction_outcomes (
	id VARCHAR NOT NULL, 
	prediction_id VARCHAR NOT NULL, 
	resolution VARCHAR NOT NULL, 
	accuracy_score FLOAT, 
	lessons_learned TEXT, 
	timestamp DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(prediction_id) REFERENCES predictions (id)
);
CREATE TABLE evidence_links (
	id VARCHAR NOT NULL, 
	trend_id VARCHAR NOT NULL, 
	signal_id VARCHAR NOT NULL, 
	document_id VARCHAR, 
	source_id VARCHAR, 
	relationship_type VARCHAR(11) NOT NULL, 
	quote TEXT, 
	relevance_reason TEXT, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(trend_id) REFERENCES trends (id), 
	FOREIGN KEY(signal_id) REFERENCES signals (id), 
	FOREIGN KEY(document_id) REFERENCES documents (id), 
	FOREIGN KEY(source_id) REFERENCES sources (id)
);
CREATE TABLE what_changed_summaries (
	id VARCHAR NOT NULL, 
	monitoring_run_id VARCHAR, 
	generated_at DATETIME, 
	headline VARCHAR NOT NULL, 
	new_signals TEXT, 
	changed_trends TEXT, 
	new_candidate_trends TEXT, 
	alerts TEXT, 
	recommended_actions TEXT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(monitoring_run_id) REFERENCES monitoring_runs (id)
);
CREATE TABLE IF NOT EXISTS "django_migrations" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "app" varchar(255) NOT NULL, "name" varchar(255) NOT NULL, "applied" datetime NOT NULL);
CREATE TABLE sqlite_sequence(name,seq);
CREATE TABLE IF NOT EXISTS "django_content_type" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "app_label" varchar(100) NOT NULL, "model" varchar(100) NOT NULL);
CREATE UNIQUE INDEX "django_content_type_app_label_model_76bd3d3b_uniq" ON "django_content_type" ("app_label", "model");
CREATE TABLE IF NOT EXISTS "auth_group_permissions" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "group_id" integer NOT NULL REFERENCES "auth_group" ("id") DEFERRABLE INITIALLY DEFERRED, "permission_id" integer NOT NULL REFERENCES "auth_permission" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE TABLE IF NOT EXISTS "auth_user_groups" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED, "group_id" integer NOT NULL REFERENCES "auth_group" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE TABLE IF NOT EXISTS "auth_user_user_permissions" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED, "permission_id" integer NOT NULL REFERENCES "auth_permission" ("id") DEFERRABLE INITIALLY DEFERRED);
CREATE UNIQUE INDEX "auth_group_permissions_group_id_permission_id_0cd325b0_uniq" ON "auth_group_permissions" ("group_id", "permission_id");
CREATE INDEX "auth_group_permissions_group_id_b120cbf9" ON "auth_group_permissions" ("group_id");
CREATE INDEX "auth_group_permissions_permission_id_84c5c92e" ON "auth_group_permissions" ("permission_id");
CREATE UNIQUE INDEX "auth_user_groups_user_id_group_id_94350c0c_uniq" ON "auth_user_groups" ("user_id", "group_id");
CREATE INDEX "auth_user_groups_user_id_6a12ed8b" ON "auth_user_groups" ("user_id");
CREATE INDEX "auth_user_groups_group_id_97559544" ON "auth_user_groups" ("group_id");
CREATE UNIQUE INDEX "auth_user_user_permissions_user_id_permission_id_14a6b632_uniq" ON "auth_user_user_permissions" ("user_id", "permission_id");
CREATE INDEX "auth_user_user_permissions_user_id_a95ead1b" ON "auth_user_user_permissions" ("user_id");
CREATE INDEX "auth_user_user_permissions_permission_id_1fbb5f2c" ON "auth_user_user_permissions" ("permission_id");
CREATE TABLE IF NOT EXISTS "auth_permission" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "content_type_id" integer NOT NULL REFERENCES "django_content_type" ("id") DEFERRABLE INITIALLY DEFERRED, "codename" varchar(100) NOT NULL, "name" varchar(255) NOT NULL);
CREATE UNIQUE INDEX "auth_permission_content_type_id_codename_01ab375a_uniq" ON "auth_permission" ("content_type_id", "codename");
CREATE INDEX "auth_permission_content_type_id_2f476e4b" ON "auth_permission" ("content_type_id");
CREATE TABLE IF NOT EXISTS "auth_group" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "name" varchar(150) NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS "auth_user" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "password" varchar(128) NOT NULL, "last_login" datetime NULL, "is_superuser" bool NOT NULL, "username" varchar(150) NOT NULL UNIQUE, "last_name" varchar(150) NOT NULL, "email" varchar(254) NOT NULL, "is_staff" bool NOT NULL, "is_active" bool NOT NULL, "date_joined" datetime NOT NULL, "first_name" varchar(150) NOT NULL);
CREATE TABLE IF NOT EXISTS "django_admin_log" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "object_id" text NULL, "object_repr" varchar(200) NOT NULL, "action_flag" smallint unsigned NOT NULL CHECK ("action_flag" >= 0), "change_message" text NOT NULL, "content_type_id" integer NULL REFERENCES "django_content_type" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED, "action_time" datetime NOT NULL);
CREATE INDEX "django_admin_log_content_type_id_c4bce8eb" ON "django_admin_log" ("content_type_id");
CREATE INDEX "django_admin_log_user_id_c564eba6" ON "django_admin_log" ("user_id");
CREATE TABLE IF NOT EXISTS "django_session" ("session_key" varchar(40) NOT NULL PRIMARY KEY, "session_data" text NOT NULL, "expire_date" datetime NOT NULL);
CREATE INDEX "django_session_expire_date_a5c62663" ON "django_session" ("expire_date");
