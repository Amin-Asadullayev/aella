import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

export default function SettingsModal({
    open,
    onClose,
    displayName,
    username,
    bio,
    readReceipts,
    setReadReceipts,
    onlineStatus,
    setOnlineStatus,
    lastSeen,
    setLastSeen,
    showTimestamps,
    setShowTimestamps,
    darkMode,
    setDarkMode,
}) {
    const [tab, setTab] = useState("profile");

    const [editField, setEditField] = useState(null);
    const [tempValue, setTempValue] = useState("");

    const tabs = [
        { id: "profile", label: "Profile" },
        { id: "privacy", label: "Privacy" },
        { id: "chat", label: "Chat" },
        { id: "appearance", label: "Appearance" },
        { id: "account", label: "Account" },
    ];

    function openEdit(field, value) {
        setEditField(field);
        setTempValue(value || "");
    }

    function closeEdit() {
        setEditField(null);
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-white/60 rounded-2xl w-[700px] h-[500px] shadow-xl overflow-hidden flex"
                        initial={{ scale: 0.85, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 10, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                    >
                        <div className="w-[180px] border-r border-c1/10 bg-white/30 p-3 flex flex-col gap-2">
                            {tabs.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`text-sm px-3 py-2 rounded-lg text-left transition ${tab === t.id
                                        ? "bg-c1 text-white"
                                        : "hover:bg-c1/10 text-c1"
                                        }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="flex justify-between items-center mb-2">
                                <h1 className="font-semibold text-xl">Settings</h1>
                                <FontAwesomeIcon
                                    icon={faXmark}
                                    className="cursor-pointer"
                                    onClick={onClose}
                                />
                            </div>

                            <p className="text-sm mb-6 text-c1/80">
                                Manage your account and preferences
                            </p>

                            <AnimatePresence mode="wait">
                                {tab === "profile" && (
                                    <TabPanel key="profile">
                                        <Section title="Profile">
                                            <ActionRow
                                                label="Display Name"
                                                value={displayName}
                                                onEdit={() => openEdit("displayName", displayName)}
                                            />
                                            <ActionRow
                                                label="Username"
                                                value={username}
                                                onEdit={() => openEdit("username", username)}
                                            />
                                            <ActionRow
                                                label="Bio"
                                                value={bio}
                                                onEdit={() => openEdit("bio", bio)}
                                            />
                                        </Section>
                                    </TabPanel>
                                )}

                                {tab === "privacy" && (
                                    <TabPanel key="privacy">
                                        <Section title="Privacy">
                                            <ToggleRow label="Read Receipts" value={readReceipts} onChange={setReadReceipts} />
                                            <ToggleRow label="Online Status" value={onlineStatus} onChange={setOnlineStatus} />
                                            <ToggleRow label="Last Seen" value={lastSeen} onChange={setLastSeen} />
                                        </Section>
                                    </TabPanel>
                                )}

                                {tab === "chat" && (
                                    <TabPanel key="chat">
                                        <Section title="Chat">
                                            <ToggleRow label="Show Timestamps" value={showTimestamps} onChange={setShowTimestamps} />
                                        </Section>
                                    </TabPanel>
                                )}

                                {tab === "appearance" && (
                                    <TabPanel key="appearance">
                                        <Section title="Appearance">
                                            <ToggleRow label="Dark Mode" value={darkMode} onChange={setDarkMode} />
                                            <ActionRow label="Accent Color" />
                                        </Section>
                                    </TabPanel>
                                )}

                                {tab === "account" && (
                                    <TabPanel key="account">
                                        <Section title="Account">
                                            <button className="w-full mt-2 bg-red-500 text-white font-semibold py-2.5 rounded-lg text-sm hover:opacity-90">
                                                Delete Account
                                            </button>
                                        </Section>
                                    </TabPanel>
                                )}
                            </AnimatePresence>
                        </div>

                        <AnimatePresence>
                            {editField && (
                                <motion.div
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <motion.div
                                        className="bg-white/80 p-4 rounded-xl w-[300px]"
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                    >
                                        <h2 className="font-semibold mb-3 mt-0.5">Change your {
                                            (() => {
                                                switch (editField) {
                                                    case "displayName":
                                                        return "display name"
                                                    case "username": return "username"
                                                    case "bio": return "bio"
                                                }
                                            })()
                                        }
                                        </h2>

                                        {editField === "bio" ? (
                                            <div className="relative w-full">
                                                <textarea
                                                    autoFocus
                                                    value={tempValue}
                                                    onChange={(e) => setTempValue(e.target.value)}
                                                    maxLength={70}
                                                    placeholder="Your bio"
                                                    className="w-full border border-c1 px-3.5 py-2.5 pr-3 pb-7 rounded-xl text-sm
        text-foreground placeholder:text-muted-foreground/50
        focus:outline-none focus:ring-0 focus:ring-offset-0
        bg-transparent
        focus:border-c1
        resize-none min-h-[120px] leading-relaxed overflow-none"
                                                />
                                                <span className={`absolute bottom-2.5 right-3 text-[11px] pointer-events-none transition-colors
                                                    ${tempValue.length >= 70 ? "text-red-400" : tempValue.length >= 60 ? "text-amber-400" : "text-muted-foreground/40"}`}>
                                                    {tempValue.length} / 70
                                                </span>
                                            </div>
                                        ) : (
                                            <input
                                                autoFocus
                                                value={tempValue}
                                                onChange={(e) => setTempValue(e.target.value)}
                                                className="w-full border border-c1 px-3.5 py-2.5 rounded-xl text-sm
      bg-transparent text-foreground placeholder:text-muted-foreground/50
      focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-c1"
                                            />
                                        )}
                                        <div className="flex justify-end gap-2 mt-3">
                                            <button onClick={closeEdit} className="text-sm px-3 py-2">
                                                Cancel
                                            </button>
                                            <button
                                                className="bg-c1 text-white text-sm px-3 py-2 rounded-lg"
                                                onClick={closeEdit}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function TabPanel({ children }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
        >
            {children}
        </motion.div>
    );
}

function Section({ title, children }) {
    return (
        <div className="mb-6">
            <h2 className="text-xs font-bold text-c1/70 uppercase mb-3">{title}</h2>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function ActionRow({ label, value, onEdit }) {
    return (
        <div className="flex items-center justify-between bg-c1/5 border border-c1/10 px-3 py-2 rounded-lg">
            <span className="text-sm text-c1">{label}</span>

            <div className="flex items-center gap-3">
                <span className="text-xs text-c1/60">{value || "—"}</span>
                <button
                    onClick={onEdit}
                    className="text-xs font-semibold text-c1 bg-c1/10 px-3 py-1 rounded-md hover:opacity-80"
                >
                    Edit
                </button>
            </div>
        </div>
    );
}

function ToggleRow({ label, value, onChange }) {
    return (
        <div className="flex items-center justify-between bg-c1/5 border border-c1/10 px-3 py-2 rounded-lg">
            <span className="text-sm text-c1">{label}</span>
            <input
                type="checkbox"
                checked={value}
                className="focus:outline-none focus:ring-0 focus:ring-offset-0 bg-c1/30 border-c1/30 text-c1 rounded checked:bg-c1 transition duration-300"
                onChange={(e) => onChange(e.target.checked)}
            />
        </div>
    );
}