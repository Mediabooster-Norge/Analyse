/** Normalize Norwegian phone to 8 digits (strips +47, spaces, dashes). */
export function normalizeNorwegianPhone(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("47") && digits.length === 10) {
    digits = digits.slice(2);
  }
  return digits;
}

/** Norwegian mobile/landline: 8 digits after normalization. */
export function isValidNorwegianPhone(input: string): boolean {
  const digits = normalizeNorwegianPhone(input);
  return /^\d{8}$/.test(digits);
}

export function formatNorwegianPhone(input: string): string {
  const digits = normalizeNorwegianPhone(input);
  if (digits.length !== 8) return input.trim();
  return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
}
