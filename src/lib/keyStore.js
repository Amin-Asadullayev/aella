import { openDB } from "idb";

const DB_NAME = "aella_crypto";
const STORE = "keys";

const dbPromise = openDB(DB_NAME, 1, {
    upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
    },
});

function getDeviceId() {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
}

export async function savePrivateKey(userId, privateKey) {
    const db = await dbPromise;
    const deviceId = getDeviceId();

    await db.put(STORE, {
        id: `${userId}:${deviceId}`,
        userId,
        deviceId,
        privateKey,
        createdAt: Date.now(),
    });
}


export async function getPrivateKey(userId) {
    const db = await dbPromise;
    const deviceId = getDeviceId();

    const byDevice = await db.get(STORE, `${userId}:${deviceId}`);
    if (byDevice) return byDevice.privateKey;

    // Fallback: any key for this user (e.g. device ID changed)
    const all = await db.getAllFromIndex(STORE, "userId", userId);
    return all?.[0]?.privateKey ?? null;
}

export async function deletePrivateKey(userId, all = false) {
    const db = await dbPromise;
    const deviceId = getDeviceId();

    if (!all) {
        await db.delete(STORE, `${userId}:${deviceId}`);
        return;
    }

    const records = await db.getAllFromIndex(STORE, "userId", userId);
    await Promise.all(records.map(k => db.delete(STORE, k.id)));
}
