export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function savePinHash(hash: string) {
  localStorage.setItem('comfort_app_pin_hash', hash);
}

export function getPinHash(): string | null {
  return localStorage.getItem('comfort_app_pin_hash');
}

export function removePinHash() {
  localStorage.removeItem('comfort_app_pin_hash');
}
