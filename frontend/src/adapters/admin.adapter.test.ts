import { describe, it, expect } from 'vitest';
import { toQueueItem, toAuditTrail, toQueueStats } from './admin.adapter';

const mockRawProfile = {
  id: 'prof_001',
  regNo: 'KV-2024-001',
  status: 'PENDING',
  firstNameEn: 'Kumar',
  lastNameEn: 'Vel',
  firstNameTa: 'குமார்',
  lastNameTa: 'வேல்',
  name: 'Kumar Vel',
  createdByEn: 'Admin',
  community: 'Kongu Vellalar',
  caste: 'BC',
  age: 28,
  dob: '1996-05-15T00:00:00.000Z',
  gender: 'MALE',
  createdAt: '2024-01-15T10:00:00.000Z',
  submittedAt: '2024-01-15T10:00:00.000Z',
};

describe('admin adapter', () => {
  describe('toQueueItem', () => {
    it('maps all fields from raw profile', () => {
      const item = toQueueItem(mockRawProfile);
      expect(item.id).toBe('prof_001');
      expect(item.regNo).toBe('KV-2024-001');
      expect(item.firstNameEn).toBe('Kumar');
      expect(item.lastNameTa).toBe('வேல்');
      expect(item.age).toBe(28);
      expect(item.name).toBe('Kumar Vel');
    });

    it('provides defaults for missing fields', () => {
      const item = toQueueItem({});
      expect(item.id).toBe('');
      expect(item.regNo).toBe('');
      expect(item.status).toBe('PENDING');
      expect(item.firstNameEn).toBeNull();
      expect(item.age).toBeNull();
      expect(item.profilePhoto).toBeNull();
    });

    it('falls back regNo to id when regNo is missing', () => {
      const item = toQueueItem({ id: 'abc123' });
      expect(item.regNo).toBe('abc123');
    });

    it('preserves claimedBy field', () => {
      const item = toQueueItem({ ...mockRawProfile, claimedBy: 'admin_1' });
      expect(item.claimedBy).toBe('admin_1');
    });

    it('preserves null claimedBy', () => {
      const item = toQueueItem(mockRawProfile);
      expect(item.claimedBy).toBeNull();
    });
  });

  describe('toAuditTrail', () => {
    it('maps audit trail with all sections', () => {
      const raw = {
        stateHistory: [{ from: 'PENDING', to: 'ACTIVE', changedBy: 'Admin', changedAt: '2024-01-15T11:00:00Z', reason: null }],
        reviews: [{ verifierName: 'Verifier', decision: 'APPROVED', comment: 'Looks good', createdAt: '2024-01-15T11:00:00Z' }],
        queue: { assignedTo: 'verifier_1', priority: 1, createdAt: '2024-01-14T10:00:00Z', completedAt: null },
      };
      const trail = toAuditTrail(raw);
      expect(trail.stateHistory).toHaveLength(1);
      expect(trail.stateHistory[0].from).toBe('PENDING');
      expect(trail.stateHistory[0].to).toBe('ACTIVE');
      expect(trail.reviews).toHaveLength(1);
      expect(trail.reviews[0].decision).toBe('APPROVED');
      expect(trail.queue).not.toBeNull();
      expect(trail.queue!.assignedTo).toBe('verifier_1');
    });

    it('handles empty state history', () => {
      const trail = toAuditTrail({ stateHistory: [], reviews: [], queue: null });
      expect(trail.stateHistory).toHaveLength(0);
      expect(trail.reviews).toHaveLength(0);
      expect(trail.queue).toBeNull();
    });

    it('provides defaults for missing fields', () => {
      const trail = toAuditTrail({});
      expect(trail.stateHistory).toHaveLength(0);
      expect(trail.reviews).toHaveLength(0);
      expect(trail.queue).toBeNull();
    });
  });

  describe('toQueueStats', () => {
    it('maps all stat fields', () => {
      const stats = toQueueStats({ pendingTotal: 10, pendingToday: 3, approvedToday: 5, rejectedToday: 1, avgReviewTimeHours: 24.5 });
      expect(stats.pendingTotal).toBe(10);
      expect(stats.pendingToday).toBe(3);
      expect(stats.approvedToday).toBe(5);
      expect(stats.rejectedToday).toBe(1);
      expect(stats.avgReviewTimeHours).toBe(24.5);
    });

    it('defaults to zero for missing fields', () => {
      const stats = toQueueStats({});
      expect(stats.pendingTotal).toBe(0);
      expect(stats.pendingToday).toBe(0);
      expect(stats.approvedToday).toBe(0);
      expect(stats.rejectedToday).toBe(0);
      expect(stats.avgReviewTimeHours).toBe(0);
    });
  });
});
