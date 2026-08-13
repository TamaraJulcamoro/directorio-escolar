export const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  return String(phone)
    .replace(/[^\d+]/g, '')
    .trim();
};