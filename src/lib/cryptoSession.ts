import * as openpgp from "openpgp";
import { getPrivateKey } from "./keyStore";

let unlockedPrivKey: openpgp.PrivateKey | null = null;
let currentUserId: number | null = null;

export async function unlockPrivateKey(
  userId: number,
  passphrase: string
): Promise<boolean> {
  const armoredKey = await getPrivateKey(userId);

  if (!armoredKey) {
    throw new Error("No private key found for user");
  }

  const privateKey = await openpgp.decryptKey({
    privateKey: await openpgp.readPrivateKey({
      armoredKey,
    }),
    passphrase,
  });

  unlockedPrivKey = privateKey;
  currentUserId = userId;

  return true;
}

export function getUnlockedPrivateKey(): openpgp.PrivateKey {
  if (!unlockedPrivKey) throw new Error("Private key not unlocked");
  return unlockedPrivKey;
}

export function clearCryptoSession(): void {
  unlockedPrivKey = null;
  currentUserId = null;
}