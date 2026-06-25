import type {ChatMessage, Conversation, State} from "../types/api"

const state: State = {
  convos: new Map(),
  messages: new Map(),
  activeConvo: null,
};

const listeners = new Set<(state: State) => void>();

export function subscribe(callback: (state: State) => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function emit() {
  for (const cb of listeners) cb(state);
}

export function setActiveConvo(convoId: number) {
  state.activeConvo = convoId;
  emit();
}

export async function loadMessages(convoId: number) {
  const res = await fetch(`/api/messages/${convoId}`);
  const data = await res.json();

  if (data.success) {
    state.messages.set(convoId, data.data);
  } else {
    state.messages.set(convoId, []);
  }

  emit();
}

export function addMessage(convoId: number, message: ChatMessage) {
  if (!state.messages.has(convoId)) {
    state.messages.set(convoId, []);
  }

  state.messages.get(convoId)!.push(message);

  const convo = state.convos.get(convoId);

  emit();
}

export function setConversations(list: Conversation[]) {
  state.convos.clear();

  for (const c of list) {
    state.convos.set(c.conversationId, c);
  }

  emit();
}