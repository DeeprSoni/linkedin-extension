const REFERRAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Generate a unique referral code
 */
export async function generateUniqueReferralCode(
  length: number = 8,
  exists?: (code: string) => Promise<boolean>
): Promise<string> {
  const generateCode = () =>
    Array.from({ length }, () =>
      REFERRAL_ALPHABET[Math.floor(Math.random() * REFERRAL_ALPHABET.length)]
    ).join('');

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const alreadyExists = exists ? await exists(code) : false;
    if (!alreadyExists) {
      return code;
    }
  }

  // Fallback in the rare case of repeated collisions
  return `${generateCode()}${Date.now().toString().slice(-2)}`;
}
