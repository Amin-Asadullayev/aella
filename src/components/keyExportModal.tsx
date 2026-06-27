import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { getPrivateKey } from "@/lib/keyStore";
import { useAuth } from "@/lib/AuthContext";
import QRCode from "qrcode";

type TabId = "export";

export default function KeyExportModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("export");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabs: { id: TabId; label: string }[] = [
    { id: "export", label: "Export Key" },
  ];

  useEffect(() => {
    if (!open) {
      setQrDataUrl(null);
      setPrivateKey(null);
      setRevealed(false);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    getPrivateKey(user.id)
      .then(async (key) => {
        if (!key) {
          setError("No private key found on this device.");
          return;
        }
        setPrivateKey(key);
        const url = await QRCode.toDataURL(key, {
          errorCorrectionLevel: "L",
          margin: 1,
          width: 220,
          color: { dark: "#1C2321", light: "#ffffff" },
        });
        setQrDataUrl(url);
      })
      .catch(() => setError("Failed to load private key."))
      .finally(() => setLoading(false));
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  function handleDownload() {
    if (!privateKey) return;
    const blob = new Blob([privateKey], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aella-private-key.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AnimatePresence>
      {open && (
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
                      <div className="flex gap-6 flex-1">
                        <div className="flex flex-col items-center justify-center gap-3 w-full">
                          <div className="relative">
                            <div className={`transition-all duration-300 ${!revealed ? "blur-md" : ""}`}>
                              {qrDataUrl && (
                                <img src={qrDataUrl} className="w-64 h-64 border border-c1/10" />
                              )}
                            </div>
                            {!revealed && (
                              <button
                                onClick={() => setRevealed(true)}
                                className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-c1"
                              >
                                <span className="text-md font-semibold">Tap to reveal</span>
                              </button>
                            )}
                          </div>
                          <p className="text-[14px] text-c1/40 text-center">
                            Scan with your other device to import
                          </p>
                        </div>
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







