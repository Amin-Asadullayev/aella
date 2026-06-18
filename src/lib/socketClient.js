import { encryptMessage, decryptMessage } from "./cryptoUtils";

let socket = null;
let userId = null;
let isConnected = false;
const BASE_URL = "http://localhost:3141"

const pubKeyCache = new Map();
const listeners = new Set();

export function connect(token, uid, onReady) {
    console.log("conenct called")
        userId = uid;
        socket = new WebSocket("ws://localhost:3141");
        socket.onopen = () => {
            console.log("WS CONNECTED")
            isConnected = true;
            socket.send(JSON.stringify({ type: "auth", token }));
            onReady?.();
        };

    socket.onclose = () => { isConnected = false; };
    socket.onerror = (e) => console.error("WebSocket error:", e);

    socket.onmessage = async (e) => {
        try {
            const data = JSON.parse(e.data);

            listeners.forEach(fn => fn(data));

            if (data.type === "receive_message") {
                await handleIncomingMessage(data.message);
            }
        } catch (err) {
            console.error("WS message parse error:", err);
        }
    };
}

export function onEvent(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export function disconnect() {
    socket?.close();
    socket = null;
    isConnected = false;
    userId = null;
    pubKeyCache.clear();
}

async function fetchPublicKey(id) {
    if (pubKeyCache.has(id)) return pubKeyCache.get(id);
    const res = await fetch(`${BASE_URL}/api/keys/${id}`);
    if (!res.ok) throw new Error(`Could not fetch public key for user ${id}`);
    const data = await res.json();
    pubKeyCache.set(id, data.publicKey);
    return data.publicKey;
}

export async function sendMessage(receiverId, plaintext) {
    if (!isConnected) throw new Error("WebSocket not connected");

    const [receiverKey, senderKey] = await Promise.all([
        fetchPublicKey(receiverId),
        fetchPublicKey(userId),
    ]);

    const encrypted = await encryptMessage([receiverKey, senderKey], plaintext);

    socket.send(JSON.stringify({
        type: "send_message",
        receiver: receiverId,
        message: encrypted,
    }));
}

export function getConversations() {
    socket?.send(JSON.stringify({ type: "get_conversations" }));
}

export function getConversation(id){
    socket?.send(JSON.stringify({type: "get_conversation", id}))
}

export function getMessages(conversationId) {
    socket?.send(JSON.stringify({ type: "get_messages", conversationId }));
}

export function markAsRead(sender) {
    socket?.send(JSON.stringify({ type: "mark_conversation_read", sender }));
}

export async function handleIncomingMessage(msg) {
    try {
        if (!msg?.ciphertext) return null;
        const decrypted = await decryptMessage(msg.ciphertext);
        const out = { ...msg, plaintext: decrypted };
        window.dispatchEvent(new CustomEvent("incoming_message", { detail: out }));
        return out;
    } catch (e) {
        console.error("Failed to decrypt incoming message:", e);
        const out = { ...msg, plaintext: null };
        window.dispatchEvent(new CustomEvent("incoming_message", { detail: out }));
        return out;
    }
}

export function getSocket() {
    return socket;
}

export function createConversation(payload) {
    console.log("sending create_conversation", payload)
    socket?.send(JSON.stringify({
        type: "create_conversation",
        ...payload
    }));
}