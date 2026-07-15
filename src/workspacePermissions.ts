import type { Workspace, WorkspaceRole } from './types';

export function workspaceRole(workspace: Workspace | null | undefined): WorkspaceRole {
  return workspace?.currentUserRole || 'owner';
}

export function canApproveSources(workspace: Workspace | null | undefined): boolean {
  return ['owner', 'admin', 'source_curator'].includes(workspaceRole(workspace));
}

export function canApproveFindings(workspace: Workspace | null | undefined): boolean {
  return ['owner', 'admin', 'strategist', 'strategy_approver'].includes(workspaceRole(workspace));
}

export function canApproveTrends(workspace: Workspace | null | undefined): boolean {
  return ['owner', 'admin', 'strategist', 'strategy_approver'].includes(workspaceRole(workspace));
}

export function canManageWorkspaceMembers(workspace: Workspace | null | undefined): boolean {
  return ['owner', 'admin'].includes(workspaceRole(workspace));
}

export function approvalRestrictionMessage(action: 'source' | 'finding' | 'trend'): string {
  if (action === 'source') return 'Only source curators, admins, or owners can approve or reject sources.';
  if (action === 'finding') return 'Only strategists, strategy approvers, admins, or owners can approve findings.';
  return 'Only strategists, strategy approvers, admins, or owners can approve or reject trends.';
}
