import profile from '@/assets/profile.png'
import { useState, useEffect, useRef, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faXmark, faCheck, faCheckDouble } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '@/lib/AuthContext'
import { unlockPrivateKey } from '@/lib/cryptoSession'
import { decryptMessage } from '@/lib/cryptoUtils'
import { motion, AnimatePresence } from "framer-motion"
import SettingsModal from '@/components/settingsModal'
import { getSettings, getUsername, saveSettings } from '@/lib/settings'
import type {Settings} from "@/types/api"
import {
  connect,
  onEvent,
  sendMessage as socketSend,
  getConversations,
  getMessages,
  markAsRead,
  createConversation,
  disconnect,
  handleIncomingMessage,
  getConversation
} from '@/lib/socketClient'
import { OtherUser, Conversation, ChatMessage, SocketEventData } from '@/types/api'

export default function Chat() {
  const { user, token, passphrase } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [cryptoReady, setCryptoReady] = useState(false)
  const [sending, setSending] = useState(false)
  const isFirstRender = useRef(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatInput, setNewChatInput] = useState("");
  const [showError, setShowError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [settings, setSettings] = useState<Settings>({
    displayName: "",
    bio: "",
    avatar: "",

    privacy: {
      readReceipts: false,
      onlineStatus: false,
      lastSeen: false,
    },

    chat: {
      showTimestamps: false,
    },

    appearance: {
      darkMode: false,
    },
  });
  const [username, setUsername] = useState("");

  useEffect(() => {
    console.log("auth state:", { user, token, passphrase })
    if (!user || !token || !passphrase) return
    let offEvent = () => { }
    async function init() {
      try {
        await unlockPrivateKey(user?.id as number, passphrase as string)
        setCryptoReady(true)
      } catch (err) {
        console.error("Failed to unlock private key:", err)
        return
      }

      connect(token as string, user?.id as number, () => {
        getConversations();
      })
      offEvent = onEvent(handleSocketEvent)
    }

    init()

    return () => {
      offEvent()
      disconnect()
    }
  }, [user, token, passphrase])

  useEffect(() => {
    async function loadSettings() {
        const saved = await getSettings();
        const username = await getUsername();
        if (saved) setSettings(saved);
        if (username) setUsername(username);
    }
    loadSettings();
}, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setShowNewChat(true);
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() == 'k') {
        e.preventDefault()
        setShowSettings(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return function cleanUp() {
      document.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      saveSettings(settings);
    }, 800);

    return () => clearTimeout(timer);
  }, [settings]);

  useEffect(() => {
    if (!showError) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === "Escape") setShowError(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showError]);

  useEffect(() => {
    if (!showSettings) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setShowSettings(false);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showSettings]);

  function updateSidebar(msg: ChatMessage) {
    setConversations(prev => {
      const updated = prev.map(convo => {
        if (convo.conversationId !== msg.conversationId) return convo;
        return {
          ...convo,
          lastMessage: msg.plaintext ?? msg.text ?? "",
          updatedAt: msg.createdAt
        };
      });
      updated.sort(
        (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
      );
      return updated;
    });
  }

  const handleSocketEvent = useCallback(async (data: SocketEventData) => {
    switch (data.type) {

      case "conversations": {
        console.log(data.data)
        const decrypt = await Promise.all(
          data.data.map(async (convo: Conversation) => {
            try {
              const lastMessage = await decryptMessage(convo.lastMessage as any);
              return { ...convo, lastMessage }
            } catch {
              return { ...convo, lastMessage: null }
            }
          })
        )
        setConversations(decrypt)
        console.log(decrypt)
        break
      }
      case "conversation": {
        console.log("hey")
        console.log(data.data)
        setActiveConvo(data.data);
        break;
      }
      case "message_stored": {
        break;
      }
      case "messages": {
        console.log(data.data)
        const decrypted = await Promise.all(
          data.data.map(async (msg: ChatMessage) => {
            try {
              const plaintext = await decryptMessage(msg.ciphertext as string)
              return { ...msg, plaintext }
            } catch {
              return { ...msg, plaintext: null }
            }
          })
        )
        setMessages(decrypted)
        break
      }
      case "receive_message": {
        getConversations();
        if (data.data.senderId != data.data.receiverId) await handleIncomingMessage(data.data);
        break
      }
      case "conversation_created": {
        console.log(data.data)
        getConversation(data.data.id);
        getConversations();
        break;
      }
      case "error": {
        if (data.message == "User not found") {
          setShowError("Could not find the user")
        }
        break;
      }
      case "message_updated": {
        const updated = data.message;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === updated.id ? { ...msg, ...updated } : msg
          )
        );
        break;
      }
      case "conversation_read": {
        console.log("hellnah")
        const { conversationId } = data;
        console.log("received")
        setMessages(prev =>
          prev.map(msg => {
            if (
              msg.conversationId === conversationId && msg.senderId === user?.id
            ) {
              return { ...msg, readAt: new Date().toISOString() };
            }
            return msg;
          })
        );
        break;
      }
      default:
        break
    }
  }, [user])

  useEffect(() => {
    function onIncoming(e: Event) {
      console.log("maak")
      const msg = (e as CustomEvent<ChatMessage>).detail;
      updateSidebar(msg);
      if (!activeConvo) return;
      if (
        msg.conversationId === activeConvo.conversationId ||
        msg.senderId === activeConvo.otherUser.id
      ) {
        setMessages(prev => [...prev, msg]);
        console.log(activeConvo.conversationId)
        markAsRead(activeConvo.conversationId);
      }
    }

    window.addEventListener("incoming_message", onIncoming)
    return () => window.removeEventListener("incoming_message", onIncoming)
  }, [activeConvo])

  useEffect(() => {
    if (!activeConvo) return
    setMessages([])
    getMessages(activeConvo.conversationId)
    markAsRead(activeConvo.conversationId)
  }, [activeConvo])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function newConvo() {
    if (newChatInput.trim() != "") {
      createConversation({ userId: newChatInput });
      setShowNewChat(false);
      setNewChatInput("");
    }
  }

  async function handleSend() {
    if (!input.trim() || !activeConvo || !cryptoReady || sending || !user) return
    setSending(true)

    try {
      console.log(activeConvo.otherUser.id, input.trim());
      await socketSend(activeConvo.otherUser.id, input.trim())

      const possibleMessage: ChatMessage = {
        id: crypto.randomUUID(),
        senderId: user.id,
        receiverId: activeConvo.otherUser.id,
        conversationId: activeConvo.conversationId,
        plaintext: input.trim(),
        createdAt: new Date().toISOString(),
      };

      setMessages(prev => [...prev, possibleMessage]);
      updateSidebar(possibleMessage);
      setInput("")
    } catch (err) {
      console.error("Send failed:", err)
    } finally {
      setSending(false)
    }
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function displayText(msg: ChatMessage) {
    return msg.plaintext || msg.text || "you cannot see"
  }

  function isMine(msg: ChatMessage) {
    return msg.senderId === user?.id
  }

  function initials(str?: string) {
    if (!str) return "?"
    let temp = str.split(" ");
    if (temp.length > 1) return temp[0].toUpperCase() + temp[1].toUpperCase();
    return str.slice(0, 2).toUpperCase()
  }

  let activeConvoName = activeConvo
    ? conversations.find(c => c.conversationId === activeConvo.conversationId)?.otherUser.username
    || `User ${activeConvo.otherUser.id}`
    : null

  return (

    <div className="flex w-screen h-screen">

      <div id="sidebar" className="w-[300px] bg-[#1C2321] text-white flex flex-col">
        <h1 className="text-3xl font-bold p-5 text-center shrink-0">
          <span className="tracking-[20px]">
            AELL<span className="text-[#DE6449]">A</span>
          </span>
          <span className="-ml-[10px] text-[#DE6449]">.</span>
        </h1>
        <div className="px-4 pb-3 shrink-0">
          <button
            onClick={() => setShowNewChat(true)}
            className="w-full mt-2 bg-[#7D98A1] text-[#1C2321] font-bold py-2 rounded-full"
          >
            + New Chat
          </button>
        </div>
        <div className="px-4 pb-3 shrink-0">
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-[#2e3b38] text-white placeholder-gray-400 text-sm rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-[#7D98A1] font-['Inter']"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-center text-white/40 text-sm mt-8 px-4">
              No conversations yet.
            </p>
          )}
          {conversations.map(convo => (
            <div
              key={convo.conversationId}
              onClick={() => setActiveConvo(convo)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                ${activeConvo?.conversationId === convo.conversationId
                  ? "bg-[#2e3b38]"
                  : "hover:bg-[#26302e]"
                }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#7D98A1] flex items-center justify-center text-[#1C2321] font-bold text-md shrink-0">
                {initials(convo.otherUser.username || String(convo.otherUser.id))}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {convo.otherUser.username || `User ${convo.otherUser.id}`}
                </div>
                <div className="text-xs text-white/40 truncate">
                  {convo.lastMessage}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeConvo && <div className="flex-1 flex flex-col bg-gray-100">

        <div className="w-full bg-[#7D98A1] h-20 flex items-center px-3.5 rounded-br-[60%] shrink-0">
          {activeConvo ? (
            <>
              <img
                className="w-[50px] h-[50px] overflow-hidden rounded-full outline outline-2 outline-offset-2 outline-[#1C2321]"
                src={profile}
                alt="profile"
              />
              <span className="font-medium tracking-wide pl-3">
                {activeConvoName}
              </span>
            </>
          ) : (
            <span className="font-medium tracking-wide pl-3">
              :username:
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-3 px-5 py-4">
          {!activeConvo && (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              :messages:
            </div>
          )}

          {activeConvo && messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${isMine(msg) ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[65%] px-4 py-2.5 rounded-2xl text-sm
  ${isMine(msg)
                    ? "bg-[#1C2321] text-white rounded-br-sm"
                    : "bg-white text-gray-800 rounded-bl-sm"
                  }`}
              >
                <div>{displayText(msg)}</div>

                <div
                  className={`flex justify-end items-center gap-1 mt-1 text-[10px]
    ${isMine(msg) ? "text-white/60" : "text-gray-500"}`}
                >
                  <span>{formatTime(msg.createdAt)}</span>

                  {isMine(msg) && (
                    <FontAwesomeIcon
                      icon={msg.readAt ? faCheckDouble : faCheck}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}


          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 px-4 py-3 bg-white border-t border-gray-200 flex items-center gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            type="text"
            placeholder={
              !cryptoReady
                ? "Unlocking encryption…"
                : !activeConvo
                  ? "Select a conversation first"
                  : "Type a message…"
            }
            disabled={!cryptoReady || !activeConvo || sending}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#7D98A1] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!cryptoReady || !activeConvo || !input.trim() || sending}
            className="w-10 h-10 rounded-full bg-[#7D98A1] flex items-center justify-center shrink-0 disabled:opacity-80 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon style={{ color: "#1C2321" }} icon={faPaperPlane} />
          </button>
        </div>
      </div>}

      {!activeConvo && <div className="flex-1 flex flex-col bg-gray-200 justify-center items-center">
        <p className="text-lg">Start a conversation.</p>
      </div>}
      <AnimatePresence>
        {showNewChat && (
          <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}>
            <motion.div className="bg-white/60 p-6 rounded-2xl w-[375px] shadow-xl" initial={{ scale: 0.85, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 10, opacity: 0 }}
              transition={{
                duration: 0.18,
                ease: "easeOut",
              }}>
              <div className="flex justify-between items-center">
                <h1 className="font-semibold text-xl mb-1">Find someone to chat</h1>
                <FontAwesomeIcon className="text-lg" icon={faXmark} onClick={() => {
                  setShowNewChat(false);
                  setNewChatInput("");
                }} />
              </div>
              <p className="text-sm mb-5 text-c1/80 font-medium">Start a new conversation</p>

              <label htmlFor="username" className="text-sm font-medium mb-1.5 block">
                Username
              </label>
              <input
                autoFocus={true}
                onKeyUp={(e) => {
                  if (e.key == "Enter") {
                    newConvo()
                  }
                }}
                id="username"
                value={newChatInput}
                onChange={(e) => setNewChatInput(e.target.value)}
                placeholder="Enter a username..."
                className="w-full border border-c1 bg-c1/5 px-3 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-c1/20 placeholder-c1/80 transition"
              />
              <button
                className="mt-4 w-full bg-c1 text-c2 font-semibold py-3 rounded-lg text-sm hover:opacity-90 active:scale-95 transition duration-500 disabled:opacity-85 disabled:active:scale-100" disabled={!newChatInput.trim()}
                onClick={newConvo}
              >
                Start Chatting
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showError != null && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowError(null)}
          >
            <motion.div
              className="bg-white/60 p-3 w-[375px] rounded-2xl shadow-2xl overflow-hidden"
              initial={{ scale: 0.85, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 10, opacity: 0 }}
              transition={{
                duration: 0.18,
                ease: "easeOut",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 flex flex-col items-center text-center">

                <div className="w-12 h-12 rounded-full bg-c1/10 flex items-center justify-center mb-3">
                  <FontAwesomeIcon
                    icon={faXmark}
                    className="text-c2 text-lg"
                  />
                </div>

                <h2 className="text-[#1C2321] font-semibold text-lg">
                  Something went wrong
                </h2>

                <p className="text-sm text-[#1C2321]/70 mt-2 mb-5 leading-relaxed">
                  {showError}
                </p>

                <button
                  onClick={() => setShowError(null)}
                  className="w-full bg-[#7D98A1] text-[#1C2321] font-semibold py-2.5 rounded-xl
                       hover:opacity-90 active:scale-95 transition"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        username={username}
        setUsername={setUsername}
        setSettings={setSettings}
      />
    </div>
  )
}