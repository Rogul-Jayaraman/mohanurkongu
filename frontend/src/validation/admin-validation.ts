import { z } from 'zod';

export const REASON_MIN = 10;
export const REASON_MAX = 500;
export const NAME_MIN = 2;
export const NAME_MAX = 100;
export const TEXT_MAX = 255;

export const rejectionSchema = z.object({
  reasonEn: z
    .string()
    .min(REASON_MIN, `REJECTION_REASON_TOO_SHORT:${REASON_MIN}`)
    .max(REASON_MAX, `REJECTION_REASON_TOO_LONG:${REASON_MAX}`),
  reasonTa: z.string().max(REASON_MAX, `REJECTION_REASON_TOO_LONG:${REASON_MAX}`).optional(),
});

export const archiveReasonSchema = z.object({
  reasonEn: z
    .string()
    .min(REASON_MIN, `ARCHIVE_REASON_TOO_SHORT:${REASON_MIN}`)
    .max(REASON_MAX, `ARCHIVE_REASON_TOO_LONG:${REASON_MAX}`),
  reasonTa: z.string().max(REASON_MAX, `ARCHIVE_REASON_TOO_LONG:${REASON_MAX}`).optional(),
});

export const adminEditFieldSchema = z.object({
  firstNameEn: z.string().min(NAME_MIN).max(NAME_MAX).optional(),
  lastNameEn: z.string().min(NAME_MIN).max(NAME_MAX).optional(),
  firstNameTa: z.string().min(NAME_MIN).max(NAME_MAX).optional(),
  lastNameTa: z.string().min(NAME_MIN).max(NAME_MAX).optional(),
  fatherNameEn: z.string().min(NAME_MIN).max(NAME_MAX).optional(),
  motherNameEn: z.string().min(NAME_MIN).max(NAME_MAX).optional(),
  kuladeivamEn: z.string().min(NAME_MIN).max(NAME_MAX).optional(),
  education: z.string().max(TEXT_MAX).optional(),
  jobDetail: z.string().max(TEXT_MAX).optional(),
  companyName: z.string().max(TEXT_MAX).optional(),
  landEn: z.string().max(TEXT_MAX).optional(),
  otherAssetsEn: z.string().max(TEXT_MAX).optional(),
  vehicle: z.string().max(TEXT_MAX).optional(),
  expectationNoteEn: z.string().max(TEXT_MAX * 2).optional(),
  reasonEn: z.string().optional(),
  reasonTa: z.string().optional(),
});

export type RejectionInput = z.infer<typeof rejectionSchema>;
export type ArchiveReasonInput = z.infer<typeof archiveReasonSchema>;
export type AdminEditFieldInput = z.infer<typeof adminEditFieldSchema>;

export function validateRejectionReason(data: unknown) {
  return rejectionSchema.safeParse(data);
}

export function validateArchiveReason(data: unknown) {
  return archiveReasonSchema.safeParse(data);
}

export function validateAdminEditField(data: unknown) {
  return adminEditFieldSchema.safeParse(data);
}
