import * as openpgp from "openpgp";
import { getPrivateKey } from "./keyStore";

let unlockedprivKey = null;
let currentUserId = null;

export async function unlockPrivateKey(userId, passphrase) {
    const armoredKey = await getPrivateKey(userId);
    if (!armoredKey) {
        throw new Error("No private key found for user");
    }
    const privKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({
            armoredKey,
        }),
        passphrase,
    });

    unlockedprivKey = privKey;
    currentUserId = userId;

    return true;
}

export function getUnlockedPrivateKey() {
    if (!unlockedprivKey) {
        throw new Error("Private key not unlocked");
    }
    return unlockedprivKey;
}

export function clearCryptoSession() {
    unlockedprivKey = null;
    currentUserId = null;
}