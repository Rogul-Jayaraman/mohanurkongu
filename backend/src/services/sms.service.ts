import https from 'https';

const BULKBLASTER_API_KEY = process.env.BULKBLASTER_API_KEY || '';
const BULKBLASTER_BASE_URL = process.env.BULKBLASTER_BASE_URL || '';

const removeCountryCode = (phone: string): string => {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('91') && digits.length > 10) {
    return digits.slice(2);
  }
  if (digits.length === 10) return digits;
  return digits;
};

const sendRequest = (payload: string, endpoint = '/send-sms'): Promise<boolean> => {
  const url = new URL(endpoint, BULKBLASTER_BASE_URL);

  const options: https.RequestOptions = {
    hostname: url.hostname,
    path: url.pathname,
    port: url.port || 443,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(payload)),
    },
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      const statusCode = res.statusCode || 0;
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const success = parsed?.success === true;
          if (!success) {
            console.error('[BulkBlaster] SMS failed', {
              statusCode,
              response: parsed,
            });
          }
          resolve(success);
        } catch {
          console.error('[BulkBlaster] Non-JSON response:', {
            statusCode,
            raw: data,
          });
          resolve(statusCode >= 200 && statusCode < 300);
        }
      });
    });

    req.on('error', (error) => {
      console.error('[BulkBlaster] Request failed:', {
        message: error.message,
        code: (error as any).code,
      });
      resolve(false);
    });

    req.write(payload);
    req.end();
  });
};

export const sendOTP = async (phone: string, otp: string): Promise<boolean> => {
  if (!BULKBLASTER_API_KEY || !BULKBLASTER_BASE_URL) {
    console.log(`[BulkBlaster] Credentials not configured. Would send OTP to ${phone}`);
    return true;
  }

  const cleanedPhone = removeCountryCode(phone);
  const message = `Your verification code is ${otp}. Valid for 3 minutes.`;
  const payload = JSON.stringify({ apiKey: BULKBLASTER_API_KEY, phone: cleanedPhone, message });

  console.log(`[BulkBlaster] Sending OTP to ${cleanedPhone}`);
  return sendRequest(payload);
};

export const sendPasswordReset = async (phone: string, otp: string): Promise<boolean> => {
  return sendOTP(phone, otp);
};

export const sendProfileApproved = async (phone: string): Promise<boolean> => {
  const cleanedPhone = removeCountryCode(phone);
  const message = 'Your profile has been verified successfully.';
  const payload = JSON.stringify({ apiKey: BULKBLASTER_API_KEY, phone: cleanedPhone, message });

  console.log(`[BulkBlaster] Sending profile approved to ${cleanedPhone}`);
  return sendRequest(payload);
};

export const sendProfileRejected = async (phone: string): Promise<boolean> => {
  const cleanedPhone = removeCountryCode(phone);
  const message = 'Your profile verification could not be completed. Please contact support.';
  const payload = JSON.stringify({ apiKey: BULKBLASTER_API_KEY, phone: cleanedPhone, message });

  console.log(`[BulkBlaster] Sending profile rejected to ${cleanedPhone}`);
  return sendRequest(payload);
};

export const sendBookingConfirmed = async (phone: string, bookingId: string): Promise<boolean> => {
  const cleanedPhone = removeCountryCode(phone);
  const message = `Your booking has been confirmed. Booking ID: ${bookingId}`;
  const payload = JSON.stringify({ apiKey: BULKBLASTER_API_KEY, phone: cleanedPhone, message });

  console.log(`[BulkBlaster] Sending booking confirmed to ${cleanedPhone}`);
  return sendRequest(payload);
};

export const sendBulkSMS = async (phones: string[], message: string): Promise<boolean> => {
  const recipients = phones.map((p) => removeCountryCode(p));
  const payload = JSON.stringify({ apiKey: BULKBLASTER_API_KEY, recipients, message });

  console.log(`[BulkBlaster] Sending bulk SMS to ${recipients.length} numbers`);
  return sendRequest(payload, '/send-bulk-sms');
};

export const sendNotification = async (phone: string, message: string): Promise<boolean> => {
  const cleanedPhone = removeCountryCode(phone);
  const payload = JSON.stringify({ apiKey: BULKBLASTER_API_KEY, phone: cleanedPhone, message });

  console.log(`[BulkBlaster] Sending notification to ${cleanedPhone}`);
  return sendRequest(payload);
};
