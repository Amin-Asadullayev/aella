import React, { useState, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faPenToSquare, faImages } from "@fortawesome/free-solid-svg-icons";
import ProfilePhoto from "@/assets/profile.png";
import { EditField, TabId } from "@/types/api";
import { Settings } from "@/types/api";
import { saveUsername, changeAvatar } from "@/lib/settings";
import imageCompression from "browser-image-compression";

export default function SettingsModal({ open, onClose, settings, setSettings, username, setUsername, avatarUrl, setAvatarUrl }: {
    open: boolean;
    onClose: () => void;
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
    username: string;
    setUsername: React.Dispatch<React.SetStateAction<string>>;
    avatarUrl: string,
    setAvatarUrl: React.Dispatch<React.SetStateAction<string>>;
}) {
    const [tab, setTab] = useState<TabId>("profile");
    const [editField, setEditField] = useState<EditField>(null);
    const [tempValue, setTempValue] = useState("");
    const [error, setError] = useState("");

    const tabs: { id: TabId; label: string }[] = [
        { id: "profile", label: "Profile" },
        { id: "privacy", label: "Privacy" },
        { id: "chat", label: "Chat" },
        { id: "appearance", label: "Appearance" },
        { id: "account", label: "Account" },
    ];

    function openEdit(field: EditField, value?: string) {
        setEditField(field);
        setTempValue(value || "");
    }

    function closeEdit() {
        setEditField(null);
        setTempValue("");
        setError("")
    }

    async function handleSave() {
        if (editField === "displayName") {
            if (tempValue.length < 2 || tempValue.length > 20) {
                setError("Display name is too short or too long")
                return;
            }
            setSettings(prev => ({ ...prev, displayName: tempValue }));
        } else if (editField === "username") {
            if (tempValue.length < 2 || tempValue.length > 20) {
                setError("Username is too short or too long")
                return;
            }
            if (!/^[a-z]+$/.test(tempValue)) {
                setError("Invalid username")
                return;
            }
            const result = await saveUsername(tempValue.toLowerCase());
            if (!result.success) {
                setError(result.message)
                return;
            }
            setError("")
            setUsername(tempValue)
        } else if (editField === "bio") {
            if (tempValue.length > 70) {
                setError("Bio is too long")
                return;
            }
            setSettings(prev => ({ ...prev, bio: tempValue }));
        }
        closeEdit();
    }


    async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setEditField(null);
        const compressedFile = await imageCompression(file, {
            maxSizeMB: 0.2,
            maxWidthOrHeight: 256,
            useWebWorker: true,
        });
        const formData = new FormData();
        formData.append("avatar", compressedFile);
        const res = await changeAvatar(formData);

        if (res.success) setAvatarUrl(res.data.avatarUrl);
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
                                    className={`text-sm px-3 py-2 rounded-lg text-left transition ${tab === t.id ? "bg-c1 text-white" : "hover:bg-c1/10 text-c1"}`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col flex-1 p-6 overflow-y-auto">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h1 className="font-semibold text-xl">Settings</h1>
                                    <FontAwesomeIcon icon={faXmark} onClick={onClose} className="cursor-pointer" />
                                </div>
                                <p className="text-sm mb-6 text-c1/80">
                                    Manage your account and preferences
                                </p>
                            </div>

                            <AnimatePresence mode="wait">
                                {tab === "profile" && (
                                    <motion.div
                                        key="profile"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="flex-1 flex"
                                    >
                                        <div className="flex flex-col overflow-y-auto items-center justify-center flex-1 gap-2">
                                            <div className="relative group mb-3">
                                                <img
                                                    src={avatarUrl || ProfilePhoto}
                                                    onClick={() => openEdit("avatar", avatarUrl)}
                                                    className="w-[140px] h-[140px] rounded-full object-cover ring-2 ring-offset-2 ring-c1/20 cursor-pointer transition group-hover:brightness-75"
                                                />
                                                <button
                                                    onClick={() => openEdit("avatar", avatarUrl)}
                                                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    <FontAwesomeIcon icon={faPenToSquare} className="w-7 h-7 text-white" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl text-c1 font-bold leading-tight">{settings.displayName || "—"}</span>
                                                <button onClick={() => openEdit("displayName", settings.displayName)} className="text-c1/50 hover:text-c1 transition">
                                                    <FontAwesomeIcon icon={faPenToSquare} className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-base text-c1/80">@{username || "—"}</span>
                                                <button onClick={() => openEdit("username", username)} className="text-c1/50 hover:text-c1 transition">
                                                    <FontAwesomeIcon icon={faPenToSquare} className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2 mt-1 px-5 py-3 bg-c1/5 rounded-xl max-w-[300px]">
                                                <span className="text-sm text-c1/60 text-center leading-relaxed flex-1">{settings.bio || "No bio yet"}</span>
                                                <button onClick={() => openEdit("bio", settings.bio)} className="text-c1/50 hover:text-c1 transition shrink-0">
                                                    <FontAwesomeIcon icon={faPenToSquare} className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {tab === "privacy" && (
                                    <motion.div
                                        key="privacy"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                    >
                                        <div className="space-y-2">
                                            <ToggleRow
                                                label="Read Receipts"
                                                value={settings.privacy.readReceipts}
                                                onChange={(value) =>
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        privacy: { ...prev.privacy, readReceipts: value },
                                                    }))
                                                }
                                            />
                                            <ToggleRow
                                                label="Online Status"
                                                value={settings.privacy.onlineStatus}
                                                onChange={(value) =>
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        privacy: { ...prev.privacy, onlineStatus: value },
                                                    }))
                                                }
                                            />
                                            <ToggleRow
                                                label="Last Seen"
                                                value={settings.privacy.lastSeen}
                                                onChange={(value) =>
                                                    setSettings(prev => ({
                                                        ...prev,
                                                        privacy: { ...prev.privacy, lastSeen: value },
                                                    }))
                                                }
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {tab === "chat" && (
                                    <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <ToggleRow
                                            label="Show Timestamps"
                                            value={settings.chat.showTimestamps}
                                            onChange={(value) =>
                                                setSettings(prev => ({
                                                    ...prev,
                                                    chat: { ...prev.chat, showTimestamps: value },
                                                }))
                                            }
                                        />
                                    </motion.div>
                                )}

                                {tab === "appearance" && (
                                    <motion.div key="appearance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <ToggleRow
                                            label="Dark Mode"
                                            value={settings.appearance.darkMode}
                                            onChange={(value) =>
                                                setSettings(prev => ({
                                                    ...prev,
                                                    appearance: { ...prev.appearance, darkMode: value },
                                                }))
                                            }
                                        />
                                    </motion.div>
                                )}

                                {tab === "account" && (
                                    <motion.div key="account" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <button className="w-full bg-red-500 text-white py-2.5 rounded-lg text-sm">
                                            Delete Account
                                        </button>
                                    </motion.div>
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
                                        className="bg-white/85 p-5 rounded-xl w-[350px]"
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                    >
                                        {editField === "avatar" ? (
                                            <>
                                                <h2 className="font-semibold mb-3 mt-0.5">Change your profile photo</h2>
                                                <input id="uploadProfilePic" type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
                                                <div
                                                    className="w-full gap-2.5 bg-c2/35 p-10 flex flex-col justify-center items-center rounded-lg cursor-pointer"
                                                    onClick={() => document.getElementById("uploadProfilePic")?.click()}
                                                >
                                                    <FontAwesomeIcon icon={faImages} className="text-2xl" />
                                                    Select or drop a file.
                                                </div>
                                                <div className="flex justify-end mt-3">
                                                    <button onClick={closeEdit} className="text-sm px-3 py-2">
                                                        Cancel
                                                    </button>
                                                    <button className="bg-c1 text-white text-sm px-4 py-2 rounded-lg" onClick={handleSave}>
                                                        Upload
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <h2 className="font-semibold mb-3 mt-0.5">
                                                    Change your {editField === "displayName" ? "display name" : editField === "username" ? "username" : "bio"}
                                                </h2>
                                                {error && (
                                                    <p className="-mt-1 text-sm mb-1 text-c3 font-medium">{error}</p>
                                                )
                                                }

                                                {editField === "bio" ? (
                                                    <div className="relative w-full">
                                                        <textarea
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") handleSave()
                                                            }}
                                                            autoFocus
                                                            value={tempValue}
                                                            onChange={(e) => setTempValue(e.target.value)}
                                                            maxLength={70}
                                                            placeholder="Your bio"
                                                            className="w-full border border-c1 px-3.5 py-2.5 pr-3 pb-7 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 focus:ring-offset-0 bg-transparent focus:border-c1 resize-none min-h-[120px] leading-relaxed overflow-none"
                                                        />
                                                        <span className={`absolute bottom-2.5 right-3 text-[11px] pointer-events-none transition-colors ${tempValue.length >= 70 ? "text-red-400" : tempValue.length >= 60 ? "text-amber-400" : "text-muted-foreground/40"}`}>
                                                            {tempValue.length} / 70
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <input
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") handleSave()
                                                        }}
                                                        maxLength={20}
                                                        value={tempValue}
                                                        onChange={(e) => setTempValue(e.target.value)}
                                                        className="w-full border border-c1 px-3.5 py-2.5 rounded-xl text-sm bg-transparent text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-c1"
                                                    />
                                                )}

                                                <div className="flex justify-end gap-2 mt-3">
                                                    <button onClick={closeEdit} className="text-sm px-3 py-2">
                                                        Cancel
                                                    </button>
                                                    <button className="bg-c1 text-white text-sm px-3 py-2 rounded-lg" onClick={handleSave}>
                                                        Save
                                                    </button>
                                                </div>
                                            </>
                                        )}
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

interface ToggleRowProps {
    label: string;
    value: boolean;
    onChange: (value: boolean) => void;
}

function ToggleRow({ label, value, onChange }: ToggleRowProps) {
    return (
        <div className="flex items-center justify-between bg-c1/5 border border-c1/10 px-3 py-2 rounded-lg">
            <span className="text-sm text-c1">{label}</span>
            <input
                type="checkbox"
                checked={value}
                className="focus:outline-none focus:ring-0 focus:ring-offset-0 bg-c1/0 border-c1/30 text-c1 rounded checked:bg-c1 transition duration-300"
                onChange={(e) => onChange(e.target.checked)}
            />
        </div>
    );
}