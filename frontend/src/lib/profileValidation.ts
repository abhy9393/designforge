export const registrationNameError = 'Name must contain letters and cannot contain numbers.';

export function validateRegistrationName(name: string) {
  const trimmedName = name.trim();
  if (trimmedName.length < 2) return 'Name must be at least 2 characters.';
  if (!/\p{L}/u.test(trimmedName) || /\p{N}/u.test(trimmedName)) return registrationNameError;
  return '';
}

export function needsNameUpdate(name: string | undefined) {
  return Boolean(name && /\p{N}/u.test(name));
}
