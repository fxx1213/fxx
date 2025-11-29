import React, { useState, useEffect } from 'react';
import { SettingsIcon, CloseIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (token: string) => void;
  initialToken: string;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialToken }) => {
  const [token, setToken] = useState(initialToken);

  useEffect(() => {
    setToken(initialToken);
  }, [initialToken]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
            <SettingsIcon className="w-5 h-5 text-slate-500" />
            Settings
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition">
            <CloseIcon className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        
        <div className="p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            SiliconFlow API Token
          </label>
          <p className="text-xs text-slate-500 mb-4">
            Required for voice transcription (TeleSpeechASR).
          </p>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="sk-..."
            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
          />
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => onSave(token)}
              className="bg-primary hover:bg-indigo-600 text-white font-medium py-2 px-6 rounded-xl transition shadow-md shadow-indigo-200"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
