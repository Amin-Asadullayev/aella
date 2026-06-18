import * as openpgp from "openpgp";
import { getUnlockedPrivateKey } from "./cryptoSession";

export async function encryptMessage(armoredPublicKeys, message) {
    const keys = Array.isArray(armoredPublicKeys)
        ? armoredPublicKeys
        : [armoredPublicKeys];

    const encryptionKeys = await Promise.all(
        keys.map(k => openpgp.readKey({ armoredKey: k }))
    );

    const signingKey = getUnlockedPrivateKey(); 

    const encrypted = await openpgp.encrypt({
        message: await openpgp.createMessage({ text: message }),
        encryptionKeys,
        signingKeys: signingKey,
    });

    return encrypted;
}

export async function decryptMessage(armoredMessage) {
    const privateKey = getUnlockedPrivateKey();

    const message = await openpgp.readMessage({ armoredMessage });

    const { data: decrypted } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey,
    });

    return decrypted;
}
