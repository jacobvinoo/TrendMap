import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, Trash2, XCircle } from 'lucide-react';
import { repository } from './repository';
import type { DataHealthSummary } from './types';

export default function AdminDataHealthScreen() {
  const [summary, setSummary] = useState<DataHealthSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [notice, setNotice] = useState('');

  const runCheck = async () => {
    setLoading(true);
    try {
      setSummary(await repository.runDataHealthCheck());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  const clearGeneratedData = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setNotice('Click Confirm Clear to remove generated documents, signals, trends, evidence, and insights. Sources and industry setup will be kept.');
      return;
    }

    setClearing(true);
    try {
      const result = await repository.clearAnalysisData();
      const totalDeleted = Object.values(result.deletedCounts || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
      setNotice(`${result.message} Removed ${totalDeleted} generated row${totalDeleted === 1 ? '' : 's'}.`);
      setConfirmClear(false);
      await runCheck();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Failed to clear generated analysis data.');
    } finally {
      setClearing(false);
    }
  };

  const healthy = summary?.status === 'healthy';

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Data Health</h1>
          <p className="text-gray-400 mt-2">Validate evidence chains, references, and operational health records.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={clearGeneratedData}
            disabled={clearing}
            className={`inline-flex items-center justify-center gap-2 disabled:opacity-50 text-white px-5 py-3 rounded-lg font-medium ${
              confirmClear ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Trash2 size={18} />
            {clearing ? 'Clearing' : confirmClear ? 'Confirm Clear' : 'Clear Generated Data'}
          </button>
          <button
            onClick={runCheck}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-5 py-3 rounded-lg font-medium"
          >
            <Activity size={18} />
            {loading ? 'Checking' : 'Run Check'}
          </button>
        </div>
      </div>

      {notice && (
        <div className="mb-6 rounded-lg border border-indigo-700 bg-indigo-900/30 px-4 py-3 text-sm text-indigo-100">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#18182c] border border-[#2f2f52] rounded-lg p-5">
          <p className="text-sm text-gray-400 mb-2">Status</p>
          <div className={`inline-flex items-center gap-2 text-xl font-semibold ${healthy ? 'text-green-300' : 'text-amber-300'}`}>
            {healthy ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
            {summary?.status || 'Checking'}
          </div>
        </div>
        <div className="bg-[#18182c] border border-[#2f2f52] rounded-lg p-5">
          <p className="text-sm text-gray-400 mb-2">Issues</p>
          <p className="text-2xl font-semibold text-white">{summary?.issueCount ?? 0}</p>
        </div>
        <div className="bg-[#18182c] border border-[#2f2f52] rounded-lg p-5">
          <p className="text-sm text-gray-400 mb-2">Checks Run</p>
          <p className="text-2xl font-semibold text-white">{summary?.checksRun ?? 0}</p>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Issues</h2>
        <div className="space-y-3">
          {summary?.issues.map((issue, index) => (
            <div key={`${issue.entityType}-${issue.entityId || index}`} className="bg-[#18182c] border border-[#2f2f52] rounded-lg p-4">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className={`text-xs uppercase tracking-wider ${issue.severity === 'error' ? 'text-red-300' : 'text-amber-300'}`}>
                  {issue.severity}
                </span>
                <span className="text-sm text-gray-400">{issue.entityType}</span>
                {issue.entityId && <span className="text-sm text-gray-500">{issue.entityId}</span>}
              </div>
              <p className="text-gray-200">{issue.message}</p>
            </div>
          ))}
          {summary && summary.issues.length === 0 && (
            <div className="bg-[#18182c] border border-[#2f2f52] rounded-lg p-8 text-gray-300">
              No data health issues found.
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-white mb-4">Recent Checks</h2>
        <div className="space-y-3">
          {summary?.latestChecks.map((check) => (
            <div key={check.id} className="bg-[#18182c] border border-[#2f2f52] rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p className="font-medium text-white">{check.component}</p>
                <p className="text-sm text-gray-400">{new Date(check.timestamp).toLocaleString()}</p>
              </div>
              <span className="text-sm text-gray-300">{check.status} · {check.latencyMs ?? 0} ms</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
