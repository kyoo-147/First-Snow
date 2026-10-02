import 'server-only';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a child PIN using bcryptjs with salt rounds = 12.
 * PINs are treated as sensitive secrets — never store plaintext.
 */
export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

/**
 * Verify a plaintext PIN against a bcrypt hash.
 * Returns false if hash is invalid or PIN doesn't match.
 */
export async function verifyPin(
  pin: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}
