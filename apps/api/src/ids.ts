const ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";

export function createId(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => ALPHABET[byte % ALPHABET.length]).join("");
}

export function createMessageId(): string {
  return crypto.randomUUID();
}
