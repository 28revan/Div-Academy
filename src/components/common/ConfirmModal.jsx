import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-brand-card border border-brand-border rounded-[32px] p-6 lg:p-8 w-full max-w-md relative z-10 shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-red-600" />
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-wide">{title || 'Təsdiq edin'}</h3>
            <p className="text-gray-400 text-sm mb-8 font-medium">{message || 'Bu əməliyyatı yerinə yetirmək istədiyinizə əminsiniz?'}</p>
            
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={onCancel}
                className="flex-1 py-3.5 bg-brand-surface border border-brand-border text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all"
              >
                Ləğv et
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 active:scale-[0.98] transition-all"
              >
                təsdiqlə
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
