import { openDB } from "idb";
import { KeyRecord } from "../types/api"

const DB_NAME = "aella_crypto";
const STORE = "keys";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    const store = db.createObjectStore(STORE, { keyPath: "id" });
    store.createIndex("userId", "userId", { unique: false });
  },
});

function getDeviceId(): string {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
}

export async function savePrivateKey(userId: number, privateKey: string): Promise<void> {
  const db = await dbPromise;
  const deviceId = getDeviceId();

  const record: KeyRecord = {
    id: `${userId}:${deviceId}`,
    userId,
    deviceId,
    privateKey,
    createdAt: Date.now(),
  };

  await db.put(STORE, record);
}

export async function getPrivateKey(userId: number): Promise<string | null> {
  const db = await dbPromise;
  const deviceId = getDeviceId();
  const byDevice = await db.get(STORE, `${userId}:${deviceId}`);
  if (byDevice) return byDevice.privateKey;
  const all = await db.getAllFromIndex(STORE, "userId", userId);
  return all?.[0]?.privateKey ?? null;
}

export async function deletePrivateKey(userId: number, all: boolean = false): Promise<void> {
  const db = await dbPromise;
  const deviceId = getDeviceId();
  if (!all) {
    await db.delete(STORE, `${userId}:${deviceId}`);
    return;
  }
  const records = await db.getAllFromIndex(STORE, "userId", userId);
  await Promise.all(records.map((k) => db.delete(STORE, k.id)));
}