import { useEffect, useState } from 'react';
import { Shield, Trash2, UserPlus, Users } from 'lucide-react';
import { repository } from './repository';
import type { Workspace, WorkspaceMembership } from './types';
import { canManageWorkspaceMembers } from './workspacePermissions';

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'source_curator', label: 'Source curator' },
  { value: 'strategist', label: 'Strategist' },
  { value: 'strategy_approver', label: 'Strategy approver' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'viewer', label: 'Viewer' },
];

function roleLabel(role: string): string {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label || role;
}

function memberUserId(member: WorkspaceMembership): string {
  return member.userId || member.user_id || '';
}

export default function WorkspaceMembersScreen() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMembership[]>([]);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState('analyst');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const canManage = canManageWorkspaceMembers(workspace);

  async function load() {
    setLoading(true);
    setActionError('');
    try {
      const activeWorkspace = await repository.getActiveWorkspace();
      setWorkspace(activeWorkspace);
      if (activeWorkspace) {
        setMembers(await repository.getWorkspaceMembers(activeWorkspace.id));
      } else {
        setMembers([]);
      }
    } catch (error: any) {
      setActionError(error?.message || 'Failed to load workspace members.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addMember() {
    setNotice('');
    setActionError('');
    if (!workspace || !newUserId.trim()) {
      setActionError('Enter a user id before adding a member.');
      return;
    }
    setSaving(true);
    try {
      await repository.upsertWorkspaceMember(workspace.id, { userId: newUserId.trim(), role: newRole });
      setNotice(`Added ${newUserId.trim()} as ${roleLabel(newRole)}.`);
      setNewUserId('');
      await load();
    } catch (error: any) {
      setActionError(error?.message || 'Failed to add workspace member.');
    } finally {
      setSaving(false);
    }
  }

  async function updateRole(member: WorkspaceMembership, role: string) {
    if (!workspace) return;
    setNotice('');
    setActionError('');
    setSaving(true);
    try {
      await repository.upsertWorkspaceMember(workspace.id, { userId: memberUserId(member), role });
      setNotice(`Updated ${memberUserId(member)} to ${roleLabel(role)}.`);
      await load();
    } catch (error: any) {
      setActionError(error?.message || 'Failed to update workspace member.');
    } finally {
      setSaving(false);
    }
  }

  async function removeMember(member: WorkspaceMembership) {
    if (!workspace) return;
    setNotice('');
    setActionError('');
    setSaving(true);
    try {
      await repository.removeWorkspaceMember(workspace.id, memberUserId(member));
      setNotice(`Removed ${memberUserId(member)} from this workspace.`);
      await load();
    } catch (error: any) {
      setActionError(error?.message || 'Failed to remove workspace member.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section data-testid="workspace-members-screen" className="min-h-full bg-[#0f0f1a] p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <Users className="text-purple-300" size={24} />
            <h1 className="text-2xl font-semibold text-white md:text-3xl">Workspace Members</h1>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-gray-400">
            Manage who can access this workspace and what decisions they are allowed to make.
          </p>
          {workspace && (
            <p className="text-xs uppercase tracking-wide text-purple-200">
              Active workspace: <span className="normal-case tracking-normal text-gray-200">{workspace.name}</span>
            </p>
          )}
        </header>

        {!canManage && !loading && (
          <div className="rounded-lg border border-amber-700 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
            Only workspace owners or admins can manage members. Your current role is {workspace?.currentUserRole || 'not set'}.
          </div>
        )}

        {notice && (
          <div className="rounded-lg border border-emerald-700 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
            {notice}
          </div>
        )}

        {actionError && (
          <div role="alert" className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            {actionError}
          </div>
        )}

        <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-100">
            <UserPlus size={17} className="text-purple-300" />
            Add or update a member
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <label className="flex flex-col gap-2 text-sm text-gray-300">
              <span>User id</span>
              <input
                value={newUserId}
                onChange={(event) => setNewUserId(event.target.value)}
                disabled={!canManage || saving}
                placeholder="example: user-strategist"
                className="rounded-md border border-[#38385f] bg-[#101021] px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-purple-400 disabled:opacity-60"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-gray-300">
              <span>Role</span>
              <select
                value={newRole}
                onChange={(event) => setNewRole(event.target.value)}
                disabled={!canManage || saving}
                className="rounded-md border border-[#38385f] bg-[#101021] px-3 py-2 text-white outline-none focus:border-purple-400 disabled:opacity-60"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={addMember}
              disabled={!canManage || saving}
              className="self-end inline-flex items-center justify-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus size={16} />
              Add member
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-6 text-gray-300">Loading workspace members...</div>
        ) : members.length === 0 ? (
          <div className="rounded-lg border border-[#2a2a4a] bg-[#151528] p-8 text-center">
            <p className="text-lg font-medium text-white">No members found</p>
            <p className="mt-1 text-sm text-gray-400">Add at least one owner before sharing this workspace.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[#2a2a4a] bg-[#151528]">
            <div className="grid grid-cols-[1fr_220px_120px] gap-3 border-b border-[#2a2a4a] px-4 py-3 text-xs uppercase tracking-wide text-gray-500">
              <span>User</span>
              <span>Role</span>
              <span className="text-right">Action</span>
            </div>
            {members.map((member) => (
              <div key={member.id || memberUserId(member)} className="grid grid-cols-[1fr_220px_120px] items-center gap-3 border-b border-[#22223f] px-4 py-3 last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{memberUserId(member)}</p>
                  {member.role === 'owner' && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-purple-200">
                      <Shield size={13} /> Owner protection applies
                    </p>
                  )}
                </div>
                <select
                  value={member.role}
                  onChange={(event) => updateRole(member, event.target.value)}
                  disabled={!canManage || saving}
                  aria-label={`Role for ${memberUserId(member)}`}
                  className="rounded-md border border-[#38385f] bg-[#101021] px-3 py-2 text-sm text-white outline-none focus:border-purple-400 disabled:opacity-60"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeMember(member)}
                  disabled={!canManage || saving}
                  aria-label={`Remove ${memberUserId(member)}`}
                  className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#3a3a65] bg-[#20203a] text-gray-200 hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
