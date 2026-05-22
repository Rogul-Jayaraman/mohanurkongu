import prisma from '../config/prisma';

/**
 * Toggle a profile in a user's shortlist.
 * If already shortlisted, it removes it. Otherwise, it adds it.
 */
export const toggleShortlist = async (profileId: string, userId: string) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.shortlist.findUnique({
      where: {
        profileId_userId: { profileId, userId }
      }
    });

    if (existing) {
      await tx.shortlist.delete({
        where: { id: existing.id }
      });
      return { shortlisted: false };
    } else {
      const profile = await tx.profile.findUnique({ where: { id: profileId } });
      if (!profile) throw new Error('Profile not found');

      await tx.shortlist.create({
        data: { profileId, userId }
      });
      return { shortlisted: true };
    }
  });
};

import { MINIMUM_PROFILE_SELECT } from '../constants/selects';

/**
 * Find all profiles shortlisted by a specific user.
 * Marks each profile with isShortlisted: true for frontend consistency.
 */
export const findShortlistedProfilesByUserId = async (userId: string) => {
  const shortlists = await prisma.shortlist.findMany({
    where: { userId },
    select: {
      profile: {
        select: {
          ...MINIMUM_PROFILE_SELECT,
          user: {
            select: { id: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return shortlists.map((s: any) => {
    const p = s.profile;
    const today = new Date();
    const dob = p.dob ? new Date(p.dob) : null;
    let age = 0;
    if (dob) {
      age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
    }

    return {
      ...p,
      isShortlisted: true,
      age,
      profession: p.jobDetail,
      nakshatra: p.star,
      user: undefined
    };
  });
};
