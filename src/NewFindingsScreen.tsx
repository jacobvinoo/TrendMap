import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Inbox, Sparkles } from 'lucide-react';
import { repository } from './repository';
import type { Finding, Workspace } from './types';
import { approvalRestrictionMessage, canApproveFindings } from './workspacePermissions';

function percent(value?: number): string {
  if (typeof value !== 'number') return 'Not scored';
  return `${Math.round(value * 100)}%`;
}

function actionLabel(finding: Finding): string {
  const isMerge = (finding.findingType || finding.finding_type) === 'merge_proposal';
  return isMerge ? 'Approve Merge / Approve Finding' : 'Approve Finding';
}

export default function NewFindingsScreen() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const canReviewFindings = canApproveFindings(workspace);

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const [activeWorkspace, newFindings] = await Promise.all([
        repository.getActiveWorkspace(),
        repository.getFindings({ status: 'new' }),
      ]);
      setWorkspace(activeWorkspace);
      setFindings(newFindings);
    } catch (error: any) {
      setMessage(error?.message || 'Failed to load new findings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function reviewFinding(findingId: string, status: 'approved' | 'dismissed') {
    setMessage('');
    if (status === 'approved' && !canReviewFindings) {
      setMessage(approvalRestrictionMessage('finding'));
      return;
    }
    await repository.updateFinding(findingId, { status });
    await load();
  }

  return (
    <section className="min-h-full bg-[#0f0f1a] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Sparkles className="text-purple-300" size={24} />
            <h1 className="text-2xl md:text-3xl font-semibold text-white">New Findings</h1>
          </div>
          <p className="text-sm text-gray-400">
            Review proposed theme changes, source candidates, news snippets, signals, and score movements before they enter the workspace pipeline.
          </p>
          {workspace && (
            <p className="text-xs uppercase tracking-wide text-purple-200">
              Active workspace: <span className="normal-case tracking-normal text-gray-200">{workspace.name}</span>
            </p>
          )}
        </header>

        {message && (
          <div role="alert" className="rounded-md border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-6 text-gray-300">Loading findings...</div>
        ) : findings.length === 0 ? (
          <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-8 text-center">
            <Inbox className="mx-auto mb-3 text-gray-500" size={28} />
            <p className="text-lg font-medium text-white">No new findings</p>
            <p className="mt-1 text-sm text-gray-400">Run source discovery, news scanning, document extraction, or monitoring to populate this review queue.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {findings.map((finding) => (
              <article key={finding.id} className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-5 shadow-lg shadow-black/20">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-purple-200">{finding.findingType || finding.finding_type}</p>
                      <h2 className="mt-1 text-lg font-semibold text-white">{finding.title}</h2>
                    </div>
                    <p className="text-sm leading-6 text-gray-300">{finding.summary}</p>
                    {finding.whyItMatters && (
                      <p className="text-sm leading-6 text-gray-300">
                        <span className="font-medium text-gray-100">Why it matters: </span>{finding.whyItMatters}
                      </p>
                    )}
                    {finding.evidenceSnippet && (
                      <blockquote className="border-l-2 border-purple-400/70 pl-3 text-sm italic leading-6 text-gray-300">
                        {finding.evidenceSnippet}
                      </blockquote>
                    )}
                    {finding.recommendedAction && (
                      <p className="text-sm text-gray-300">
                        <span className="font-medium text-gray-100">Recommended action: </span>{finding.recommendedAction}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-gray-300">
                      <span className="rounded-full bg-[#20203a] px-3 py-1">Confidence: {percent(finding.confidenceScore ?? finding.confidence_score)}</span>
                      <span className="rounded-full bg-[#20203a] px-3 py-1">Impact: {percent(finding.impactScore ?? finding.impact_score)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 lg:flex-col">
                    <button
                      type="button"
                      onClick={() => reviewFinding(finding.id, 'approved')}
                      aria-label={actionLabel(finding)}
                      disabled={!canReviewFindings}
                      title={!canReviewFindings ? approvalRestrictionMessage('finding') : actionLabel(finding)}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} /> {actionLabel(finding)}
                    </button>
                    <button
                      type="button"
                      onClick={() => reviewFinding(finding.id, 'dismissed')}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-[#252541] px-3 py-2 text-sm font-medium text-gray-200 hover:bg-[#303052]"
                    >
                      <XCircle size={16} /> Dismiss
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
