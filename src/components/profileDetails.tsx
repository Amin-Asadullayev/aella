import React, { useState, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { faXmark, faPenToSquare, faImages } from "@fortawesome/free-solid-svg-icons";
import ProfilePhoto from "@/assets/profile.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OtherUser } from "@/types/api";

export default function ProfileDetails({ open, onClose, data }: {
    open: boolean;
    onClose: () => void;
    data: OtherUser;
}) {
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
                        className="bg-white/70 rounded-2xl w-[500px] h-[400px] shadow-xl overflow-hidden flex"
                        initial={{ scale: 0.85, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 10, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex-1 flex flex-col p-5"
                            >

                                <div className="flex justify-between items-center mb-2">
                                    <h1 className="font-semibold text-xl">User Details</h1>
                                    <FontAwesomeIcon icon={faXmark} onClick={onClose} className="cursor-pointer" />
                                </div>
                                <div className="flex flex-col overflow-y-auto items-center justify-center flex-1 gap-2">
                                    <div className="relative group mb-3">
                                        <img
                                            src={data.avatarUrl || ProfilePhoto}
                                            className="w-[140px] h-[140px] rounded-full object-cover ring-2 ring-offset-2 ring-c1/20 cursor-pointer transition group-hover:brightness-75"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl text-c1 font-bold leading-tight">{data.displayName || "—"}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-base text-c1/80">@{data.username || "—"}</span>
                                    </div>

                                    <div className="flex items-center gap-2 mt-1 px-5 py-3 bg-c1/5 rounded-xl max-w-[300px]">
                                        <span className="text-sm text-c1/60 text-center leading-relaxed flex-1">{data.bio || "No bio yet"}</span>
                                    </div>
                                </div>
                            </motion.div>
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