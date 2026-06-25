import * as openpgp from "openpgp";
import { getUnlockedPrivateKey } from "./cryptoSession";

export async function encryptMessage(armoredPublicKeys: string | string[], message: string): Promise<string> {
  const keys = Array.isArray(armoredPublicKeys) ? armoredPublicKeys : [armoredPublicKeys];

  const encryptionKeys = await Promise.all(
    keys.map((k) => openpgp.readKey({ armoredKey: k }))
  );

  const signingKey = getUnlockedPrivateKey();
  const encrypted = await openpgp.encrypt({
    message: await openpgp.createMessage({ text: message }),
    encryptionKeys,
    signingKeys: signingKey,
  });

  return encrypted;
}

export async function decryptMessage(
  armoredMessage: string
): Promise<string> {
  const privateKey = getUnlockedPrivateKey();
  const message = await openpgp.readMessage({
    armoredMessage,
  });
  const { data: decrypted } = await openpgp.decrypt({
    message,
    decryptionKeys: privateKey,
  });
  return decrypted as string;
}




