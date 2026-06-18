const state = {
    convos: new Map(),
    messages: new Map(),
    activeConvo: null,
}
const listeners = new Set();

export function subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback)
}

function emit() { for (const cb of listeners) {cb(state)} }

export function setActiveConvos(convoId){
    state.activeConvo = convoId;
    emit();
}

export async function loadMessages(convoId){
    const result = await fetch(`/api/messages/${convoId}`);
    const data = await result.json();
    state.messages.set(convoId, data);
    emit();
}

export function addMessage(convoId, message) {
    if (!state.messages.has(convoId)) state.messages.set(convoId, []);
    state.messages.get(convoId).push(message);
    const convo = state.convos.get(convoId);
    if (convo) {
        convo.lastMessage = message;
        convo.updatedAt = Date.now();
    }
    emit();
}

export function setConversations(list) {
    state.convos.clear();
    for (const c of list) {
        state.conversations.set(c.conversationId, c);
    }
    emit();
}