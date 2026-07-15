import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Filter, RefreshCw } from 'lucide-react';
import { repository } from './repository';
import type { AuditEvent, Workspace } from './types';

type EntityFilter = 'all' | 'workspace' | 'source' | 'finding' | 'trend' | 'signal';

function readEntityType(event: AuditEvent): string {
  return event.entityType || event.entity_type || 'unknown';
}

function readEntityId(event: AuditEvent): string {
  return event.entityId || event.entity_id || 'unknown';
}

function readUserId(event: AuditEvent): string {
  return event.userId || event.user_id || 'unknown';
}

function readTimestamp(event: AuditEvent): string {
  return event.timestamp || event.createdAt || event.created_at || '';
}

function parseDetails(details: unknown): Record<string, any> {
  if (!details) return {};
  if (typeof details === 'object') return details as Record<string, any>;
  if (typeof details !== 'string') return {};
  try {
    const parsed = JSON.parse(details);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function formatAction(action: string): string {
  return action
    .split('.')
    .map((part) => part.replace(/_/g, ' '))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' / ');
}

function formatDate(value: string): string {
  if (!value) return 'Time not recorded';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function readableKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, (char) => char.toUpperCase());
}

function renderDetailValue(value: any): string {
  if (value === null || value === undefined || value === '') return 'None';
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export default function AuditTrailScreen() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [entityFilter, setEntityFilter] = useState<EntityFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(nextEntityFilter: EntityFilter = entityFilter) {
    setLoading(true);
    setError('');
    try {
      const activeWorkspace = await repository.getActiveWorkspace();
      setWorkspace(activeWorkspace);
      const loadedEvents = await repository.getAuditEvents({
        workspaceId: activeWorkspace?.id,
        entityType: nextEntityFilter === 'all' ? undefined : nextEntityFilter,
      });
      setEvents(loadedEvents);
    } catch (loadError: any) {
      setError(loadError?.message || 'Failed to load audit trail.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visibleEvents = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return events;
    return events.filter((event) => {
      const details = parseDetails(event.details);
      return [
        event.action,
        readEntityType(event),
        readEntityId(event),
        readUserId(event),
        JSON.stringify(details),
      ].some((value) => value.toLowerCase().includes(needle));
    });
  }, [events, search]);

  const handleEntityFilterChange = (value: EntityFilter) => {
    setEntityFilter(value);
    load(value);
  };

  return (
    <section data-testid="audit-trail-screen" className="min-h-full bg-[#0f0f1a] p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <ClipboardList className="text-purple-300" size={24} />
              <h1 className="text-2xl font-semibold text-white md:text-3xl">Audit Trail</h1>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-gray-400">
              Review governed workspace actions, including approvals, rejections, merges, and data-clearing decisions.
            </p>
            {workspace && (
              <p className="text-xs uppercase tracking-wide text-purple-200">
                Active workspace: <span className="normal-case tracking-normal text-gray-200">{workspace.name}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-4">
          <div className="grid gap-3 md:grid-cols-[220px_1fr]">
            <label className="flex flex-col gap-2 text-sm text-gray-300">
              <span className="inline-flex items-center gap-2 font-medium text-gray-100">
                <Filter size={15} /> Entity
              </span>
              <select
                value={entityFilter}
                onChange={(event) => handleEntityFilterChange(event.target.value as EntityFilter)}
                className="rounded-md border border-[#38385f] bg-[#101021] px-3 py-2 text-white outline-none focus:border-purple-400"
              >
                <option value="all">All actions</option>
                <option value="workspace">Workspace</option>
                <option value="source">Sources</option>
                <option value="finding">Findings</option>
                <option value="trend">Trends</option>
                <option value="signal">Signals</option>
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-gray-300">
              <span className="font-medium text-gray-100">Search audit trail</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by user, entity id, action, or detail"
                className="rounded-md border border-[#38385f] bg-[#101021] px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-purple-400"
              />
            </label>
          </div>
        </div>

        {error && (
          <div role="alert" className="rounded-md border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-6 text-gray-300">Loading audit trail...</div>
        ) : visibleEvents.length === 0 ? (
          <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-8 text-center">
            <p className="text-lg font-medium text-white">No audit events found</p>
            <p className="mt-1 text-sm text-gray-400">Approvals, status changes, and data-clearing actions will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleEvents.map((event) => {
              const details = parseDetails(event.details);
              const detailEntries = Object.entries(details).filter(([key]) => key !== 'workspaceId' && key !== 'workspace_id');
              return (
                <article key={event.id} className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-5 shadow-lg shadow-black/20">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-purple-200">{readEntityType(event)} · {readEntityId(event)}</p>
                      <h2 className="mt-1 text-lg font-semibold text-white">{formatAction(event.action)}</h2>
                      <p className="mt-2 text-sm text-gray-400">
                        {formatDate(readTimestamp(event))} by <span className="text-gray-200">{readUserId(event)}</span>
                      </p>
                    </div>
                    <span className="w-fit rounded-full border border-[#3a3a65] bg-[#20203a] px-3 py-1 text-xs text-gray-200">
                      {details.workspaceId || details.workspace_id || workspace?.id || 'Workspace not recorded'}
                    </span>
                  </div>

                  {detailEntries.length > 0 && (
                    <dl className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                      {detailEntries.map(([key, value]) => (
                        <div key={key} className="rounded-md bg-[#101021] p-3">
                          <dt className="text-xs italic text-gray-400">{readableKey(key)}</dt>
                          <dd className="mt-1 break-words text-gray-100">{renderDetailValue(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
