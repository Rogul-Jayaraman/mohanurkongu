import * as smsService from './sms.service';

export const sendPhoneOTP = async (phone: string, otp: string): Promise<boolean> => {
  return smsService.sendOTP(phone, otp);
};

export const sendPasswordResetSMS = async (phone: string, otp: string): Promise<boolean> => {
  return smsService.sendPasswordReset(phone, otp);
};
