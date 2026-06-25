import * as openpgp from "openpgp";
import { savePrivateKey } from "./keyStore";

export async function generateKeyPair(
  userId: number,
  username: string,
  password: string
): Promise<{ publicKey: string }> {
  const keyPair = await openpgp.generateKey({
    type: "ecc",
    curve: "curve25519" as any,
    userIDs: [{ name: username }],
    passphrase: password,
  });

  await savePrivateKey(userId, keyPair.privateKey);

  return {
    publicKey: keyPair.publicKey,
  };
}