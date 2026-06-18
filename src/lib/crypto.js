import * as openpgp from "openpgp";
import { savePrivateKey } from "./keyStore";

export async function generateKeyPair(userId, username, password) {
  const keyPair = await openpgp.generateKey({
    type: "ecc",
    curve: "curve25519",
    userIDs: [{ name: username }],
    passphrase: password,
  });

  await savePrivateKey(userId, keyPair.privateKey);

  return {
    publicKey: keyPair.publicKey,
  };
}