import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faDownload } from "@fortawesome/free-solid-svg-icons";
import { getPrivateKey } from "@/lib/keyStore";
import { useAuth } from "@/lib/AuthContext";
import { KeyExportTabId } from "@/types/api";

export default function KeyExportModal({
  onClose,
  tabOpen,
}: {
  onClose: () => void;
  tabOpen: KeyExportTabId;
}) {
  const { user } = useAuth();
  const [tab, setTab] = useState<KeyExportTabId>(tabOpen || "export");
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabs: { id: KeyExportTabId; label: string }[] = [
    { id: "export", label: "Export Key" },
  ];

  useEffect(() => {
    if (tabOpen == null) {
      setPrivateKey(null);
      setError(null);
      setLoading(false);
    }
  }, [tabOpen]);

  useEffect(() => {
    if (tabOpen == null || !user) return;
    setLoading(true);
    getPrivateKey(user.id)
      .then(async (key) => {
        if (!key) {
          setError("No private key found on this device.");
          return;
        }
        setPrivateKey(key);
      })
      .catch(() => setError("Failed to load private key."))
      .finally(() => setLoading(false));
  }, [tabOpen, user]);

  useEffect(() => {
    if (tabOpen == null) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tabOpen, onClose]);

  function handleDownload() {
    if (!privateKey) return;
    const blob = new Blob([privateKey], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aellaPrivate.key";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AnimatePresence>
      {tabOpen != null && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-50"
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

            <div className="flex flex-col flex-1 p-6 overflow-y-auto">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h1 className="font-semibold text-xl">Key Manager</h1>
                  <FontAwesomeIcon
                    icon={faXmark}
                    onClick={onClose}
                    className="cursor-pointer"
                  />
                </div>
                <p className="text-sm mb-6 text-c1/80">
                  Export your private key to use on another device
                </p>
              </div>

              <AnimatePresence mode="wait">
                {tab === "export" && (
                  <motion.div
                    key="export"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex-1 flex flex-col"
                  >
                    {loading && (
                      <div className="flex-1 flex items-center justify-center text-c1/40 text-sm">
                        Loading key…
                      </div>
                    )}

                    {error && (
                      <div className="flex-1 flex items-center justify-center text-red-400 text-sm">
                        {error}
                      </div>
                    )}

                    {!loading && !error && (
                      <div className="flex flex-col flex-1 justify-center gap-4">
                        <button
                          onClick={handleDownload}
                          className="group flex flex-col flex-1 items-center gap-2 justify-center w-full px-5 py-4 rounded-xl
        bg-c1/5 hover:bg-c1/10 border border-c1/10 hover:border-c1/20
        transition-all duration-200"
                        >
                          <FontAwesomeIcon icon={faDownload} className="text-c1/60 text-4xl" />
                          <span className="text-lg font-semibold text-c1">Download your private key</span>
                        </button>
                        <p className="text-xs text-c1/70 leading-relaxed">
                          Be careful with your private key. Keep it a secret and never share it with a third person.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}