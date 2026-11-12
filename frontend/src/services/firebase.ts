export function normalizeIndianMobile(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return digits.slice(2);
  return digits;
}