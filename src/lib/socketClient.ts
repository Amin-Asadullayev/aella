import { encryptMessage, decryptMessage } from "./cryptoUtils";
import { Listener, WSMessage } from "../types/api";

let socket: WebSocket | null = null;
let userId: number | null = null;
let isConnected = false;

const BASE_URL = "http://localhost:3141";

const pubKeyCache = new Map<number, string>();
const listeners = new Set<Listener>();

export function connect(token: string, uid: number, onReady?: () => void): void {
  userId = uid;
  socket = new WebSocket("ws://localhost:3141");

  socket.onopen = () => {
    isConnected = true;
    socket?.send(JSON.stringify({ type: "auth", token }));
    onReady?.();
  };

  socket.onclose = () => {
    isConnected = false;
  };

  socket.onerror = (e) => {
    console.error("WebSocket error:", e);
  };

  socket.onmessage = async (e) => {
    try {
      const data: WSMessage = JSON.parse(e.data);
      listeners.forEach((fn) => fn(data));
      if (data.type === "receive_message") {
        await handleIncomingMessage(data.message);
      }
    } catch (err) {
      console.error("WS message parse error:", err);
    }
  };
}

export function onEvent(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function disconnect(): void {
  socket?.close();
  socket = null;
  isConnected = false;
  userId = null;
  pubKeyCache.clear();
}

async function fetchPublicKey(id: number): Promise<string> {
  if (pubKeyCache.has(id)) return pubKeyCache.get(id)!;
  const res = await fetch(`${BASE_URL}/api/keys/${id}`);
  if (!res.ok) throw new Error(`Could not fetch public key for user ${id}`);
  const data = await res.json();
  pubKeyCache.set(id, data.publicKey);
  return data.publicKey;
}

export async function sendMessage(receiverId: number, plaintext: string): Promise<void> {
  if (!isConnected || !socket) throw new Error("WebSocket not connected");

  if (!userId) throw new Error("User not initialized");

  const [receiverKey, senderKey] = await Promise.all([
    fetchPublicKey(receiverId),
    fetchPublicKey(userId),
  ]);

  const encrypted = await encryptMessage(
    [receiverKey, senderKey],
    plaintext
  );

  socket.send(
    JSON.stringify({
      type: "send_message",
      receiver: receiverId,
      message: encrypted,
    })
  );
}

export function getConversations(): void {
  socket?.send(JSON.stringify({ type: "get_conversations" }));
}

export function getConversation(id: number): void {
  socket?.send(
    JSON.stringify({ type: "get_conversation", id })
  );
}

export function getMessages(conversationId: number): void {
  socket?.send(
    JSON.stringify({ type: "get_messages", conversationId })
  );
}

export function markAsRead(sender: number): void {
  socket?.send(
    JSON.stringify({ type: "mark_conversation_read", sender })
  );
}

export async function handleIncomingMessage(msg: any) {
  try {
    if (!msg?.ciphertext) return null;

    const decrypted = await decryptMessage(msg.ciphertext);
    const out = { ...msg, plaintext: decrypted };

    window.dispatchEvent(
      new CustomEvent("incoming_message", { detail: out })
    );
    return out;
  } catch (e) {
    console.error("Failed to decrypt incoming message:", e);
    const out = { ...msg, plaintext: null };
    window.dispatchEvent(
      new CustomEvent("incoming_message", { detail: out })
    );
    return out;
  }
}

export function getSocket(): WebSocket | null {
  return socket;
}

export function createConversation(payload: any): void {
  socket?.send(
    JSON.stringify({
      type: "create_conversation",
      ...payload,
    })
  );
}