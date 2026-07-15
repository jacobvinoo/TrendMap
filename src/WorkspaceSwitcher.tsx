import { useEffect, useState } from 'react';
import { BriefcaseBusiness, Plus } from 'lucide-react';
import { repository } from './repository';
import type { Workspace } from './types';

interface WorkspaceSwitcherProps {
  onWorkspaceChange?: (workspace: Workspace) => void;
}

export default function WorkspaceSwitcher({ onWorkspaceChange }: WorkspaceSwitcherProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const activeRole = activeWorkspace?.currentUserRole || 'owner';

  async function load() {
    const [availableWorkspaces, currentWorkspace] = await Promise.all([
      repository.getWorkspaces(),
      repository.getActiveWorkspace(),
    ]);
    setWorkspaces(availableWorkspaces);
    setActiveWorkspace(currentWorkspace);
    if (currentWorkspace) onWorkspaceChange?.(currentWorkspace);
  }

  useEffect(() => {
    load().catch((loadError: any) => setError(loadError?.message || 'Failed to load workspaces.'));
  }, []);

  async function switchWorkspace(workspaceId: string) {
    setError('');
    setMessage('');
    await repository.setActiveWorkspace(workspaceId);
    const next = workspaces.find((workspace) => workspace.id === workspaceId) || null;
    if (next) {
      setActiveWorkspace(next);
      onWorkspaceChange?.(next);
      setMessage(`Workspace changed to ${next.name}.`);
    }
  }

  async function createWorkspace() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Enter a workspace name.');
      return;
    }

    setError('');
    const created = await repository.createWorkspace({
      name: trimmedName,
      purpose: purpose.trim(),
    });
    await repository.setActiveWorkspace(created.id);
    setWorkspaces((current) => [...current, created]);
    setActiveWorkspace(created);
    setName('');
    setPurpose('');
    setIsCreating(false);
    setMessage(`Workspace created: ${created.name}.`);
    onWorkspaceChange?.(created);
  }

  return (
    <section className="border-b border-[#2a2a4a] bg-[#101024] px-4 py-3 md:px-8" aria-label="Workspace scope">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex items-center gap-2 text-sm font-semibold text-purple-100">
            <BriefcaseBusiness size={18} className="text-purple-300" />
            <span>Workspace</span>
          </div>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-gray-500 md:flex-row md:items-center md:gap-3">
            <span>Active workspace</span>
            <select
              aria-label="Active workspace"
              value={activeWorkspace?.id || ''}
              onChange={(event) => switchWorkspace(event.target.value)}
              className="min-w-64 rounded-md border border-[#35355d] bg-[#17172c] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-purple-400"
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </label>
          {activeWorkspace?.purpose && (
            <p className="max-w-xl text-xs text-gray-400">{activeWorkspace.purpose}</p>
          )}
          <span className="w-fit rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 text-xs font-medium text-purple-100">
            Role: {activeRole.replace('_', ' ').replace(/^\w/, (character) => character.toUpperCase())}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreating((current) => !current);
            setError('');
            setMessage('');
          }}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-[#35355d] bg-[#17172c] px-3 py-2 text-sm font-medium text-gray-100 hover:border-purple-400 hover:text-white"
        >
          <Plus size={16} /> New workspace
        </button>
      </div>

      {isCreating && (
        <div className="mt-3 grid gap-3 rounded-lg border border-[#2a2a4a] bg-[#151528] p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] md:items-end">
          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-gray-500">
            Workspace name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-md border border-[#35355d] bg-[#0f0f1a] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-purple-400"
              placeholder="Search"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-gray-500">
            Workspace purpose
            <input
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              className="rounded-md border border-[#35355d] bg-[#0f0f1a] px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-purple-400"
              placeholder="Focused trend monitoring for search and discovery"
            />
          </label>
          <button
            type="button"
            onClick={createWorkspace}
            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
          >
            Create Workspace
          </button>
        </div>
      )}

      {message && <p role="status" className="mt-2 text-xs text-emerald-200">{message}</p>}
      {error && <p role="alert" className="mt-2 text-xs text-red-200">{error}</p>}
    </section>
  );
}
