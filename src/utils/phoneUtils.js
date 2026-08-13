/**
 * Limpia un número de teléfono para usarlo en enlaces tel: o whatsapp:
 * - Elimina espacios, guiones, paréntesis, etc.
 * - Conserva solo dígitos y el signo + si está presente.
 */
export const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  return String(phone)
    .replace(/[^\d+]/g, '') // elimina todo excepto dígitos y +
    .trim();
};