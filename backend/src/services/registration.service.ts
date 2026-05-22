import prisma from '../config/prisma';
import { getDistrictShortCode } from '../utils/districtCodes';

/**
 * Service to handle registration number generation.
 * Managed separately to ensure atomicity and a consistent numbering sequence.
 */
export class RegistrationService {
  /**
   * Generates a unique registration number for a profile.
   * Format: [DISTRICT_CODE]-[4_DIGIT_SEQUENTIAL_ID]
   * Example: NKL-0001
   * 
   * @param district - The district enum value or name
   * @param tx - Optional Prisma transaction client to ensure atomicity within a larger transaction
   */
  static async generateRegNo(district: string | null | undefined, tx?: any): Promise<string> {
    const districtCode = getDistrictShortCode(district);
    const db = tx || prisma;

    // Use upsert to atomically increment the counter for this district
    const counter = await db.registrationCounter.upsert({
      where: { districtCode },
      update: { count: { increment: 1 } },
      create: { districtCode, count: 1 },
    });

    const sequentialPart = counter.count.toString().padStart(4, '0');
    return `${districtCode}-${sequentialPart}`;
  }
}
