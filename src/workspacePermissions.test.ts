import { describe, expect, it } from 'vitest';
import { canApproveFindings, canApproveSources, canApproveTrends } from './workspacePermissions';

describe('workspace permissions', () => {
  it('allows source approval only for source curators, admins, and owners', () => {
    expect(canApproveSources({ id: 'ws', name: 'Search', currentUserRole: 'source_curator' })).toBe(true);
    expect(canApproveSources({ id: 'ws', name: 'Search', currentUserRole: 'admin' })).toBe(true);
    expect(canApproveSources({ id: 'ws', name: 'Search', currentUserRole: 'owner' })).toBe(true);
    expect(canApproveSources({ id: 'ws', name: 'Search', currentUserRole: 'analyst' })).toBe(false);
  });

  it('allows finding and trend approval only for strategy roles', () => {
    expect(canApproveFindings({ id: 'ws', name: 'Search', currentUserRole: 'strategist' })).toBe(true);
    expect(canApproveFindings({ id: 'ws', name: 'Search', currentUserRole: 'strategy_approver' })).toBe(true);
    expect(canApproveFindings({ id: 'ws', name: 'Search', currentUserRole: 'analyst' })).toBe(false);

    expect(canApproveTrends({ id: 'ws', name: 'Search', currentUserRole: 'strategist' })).toBe(true);
    expect(canApproveTrends({ id: 'ws', name: 'Search', currentUserRole: 'viewer' })).toBe(false);
  });
});
