export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const masked = local.charAt(0) + '***' + local.charAt(local.length - 1);
  return `${masked}@${domain}`;
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return '***' + phone.slice(-2);
  return phone.slice(0, 2) + '****' + phone.slice(-2);
}
