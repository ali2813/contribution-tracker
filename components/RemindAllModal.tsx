import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Member } from '../types';
import { X, SkipForward, Send, CheckCircle2, Loader2, MessageCircle, Users } from 'lucide-react';

declare global {
  interface Window {
    html2canvas: (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  }
}

interface RemindAllModalProps {
  members: Member[];
  onClose: () => void;
}

const RemindAllModal: React.FC<RemindAllModalProps> = ({ members, onClose }) => {
  // Build queue: only members with balance > 0 AND a phone number
  const queue = useMemo(() => {
    return members.filter(m => {
      const totalPaid = m.payments.reduce((sum, p) => sum + p.amount, 0);
      const balance = m.committedAmount - totalPaid;
      const hasPhone = m.phone && m.phone.replace(/\D/g, '').length > 0;
      return balance > 0 && hasPhone;
    });
  }, [members]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Map<number, 'sent' | 'skipped'>>(new Map());
  const [isComplete, setIsComplete] = useState(false);
  const [snapshotDataUrl, setSnapshotDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const currentMember = queue[currentIndex] ?? null;

  // Generate snapshot whenever currentIndex changes
  useEffect(() => {
    if (!currentMember || isComplete || queue.length === 0) return;

    const generate = async () => {
      // Small delay to let the receipt DOM render
      await new Promise(r => setTimeout(r, 100));
      if (!receiptRef.current || !window.html2canvas) return;

      setIsGenerating(true);
      setSnapshotDataUrl(null);
      try {
        const canvas = await window.html2canvas(receiptRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
        });
        setSnapshotDataUrl(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Snapshot generation failed:', err);
      } finally {
        setIsGenerating(false);
      }
    };

    generate();
  }, [currentIndex, currentMember, isComplete, queue.length]);

  const advance = () => {
    if (currentIndex + 1 >= queue.length) {
      setIsComplete(true);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    if (!currentMember) return;
    setResults(prev => new Map(prev).set(currentMember.id, 'skipped'));
    advance();
  };

  const handleSendWhatsApp = async () => {
    if (!currentMember || !snapshotDataUrl) return;

    try {
      // Copy snapshot to clipboard
      const response = await fetch(snapshotDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);

      // Open WhatsApp
      const cleanPhone = currentMember.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');

      // Mark as sent
      setResults(prev => new Map(prev).set(currentMember.id, 'sent'));
    } catch (err) {
      console.error('Failed to copy/share:', err);
      // Still open WhatsApp as fallback
      const cleanPhone = currentMember.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
      setResults(prev => new Map(prev).set(currentMember.id, 'sent'));
    }
  };

  const handleNext = () => {
    if (!currentMember) return;
    // Mark as sent if not already tracked (user manually sent)
    if (!results.has(currentMember.id)) {
      setResults(prev => new Map(prev).set(currentMember.id, 'sent'));
    }
    advance();
  };

  // Derived stats for summary
  const sentMembers = queue.filter(m => results.get(m.id) === 'sent');
  const skippedMembers = queue.filter(m => results.get(m.id) === 'skipped');

  // Helper to get member financials
  const getMemberStats = (m: Member) => {
    const totalPaid = m.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = m.committedAmount - totalPaid;
    const percent = Math.min(100, Math.round((totalPaid / (m.committedAmount || 1)) * 100));
    return { totalPaid, balance, percent };
  };

  // ── Screen: Empty Queue ──
  if (queue.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">All Caught Up!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              No members have outstanding balances with a phone number on file.
            </p>
            <button
              onClick={onClose}
              className="mt-6 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-500 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Screen: Summary ──
  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reminder Summary</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {sentMembers.length} sent, {skippedMembers.length} skipped out of {queue.length} members
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {sentMembers.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
                  <Send size={14} /> Sent ({sentMembers.length})
                </h3>
                <div className="space-y-1">
                  {sentMembers.map(m => (
                    <p key={m.id} className="text-sm text-slate-700 dark:text-slate-300 py-1 px-3 bg-emerald-50 dark:bg-emerald-500/5 rounded-lg">
                      {m.name}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {skippedMembers.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
                  <SkipForward size={14} /> Skipped ({skippedMembers.length})
                </h3>
                <div className="space-y-1">
                  {skippedMembers.map(m => (
                    <p key={m.id} className="text-sm text-slate-500 dark:text-slate-400 py-1 px-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      {m.name}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-medium hover:bg-blue-500 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Screen: Active Queue ──
  const stats = currentMember ? getMemberStats(currentMember) : null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send size={18} className="text-[#25D366]" />
              Remind All
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentIndex + 1} of {queue.length} members
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 shrink-0">
          <div
            className="h-full bg-[#25D366] transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentMember && stats && (
            <>
              {/* Member Info */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{currentMember.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{currentMember.phone}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Committed</p>
                    <p className="font-bold text-slate-900 dark:text-white">${currentMember.committedAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Paid</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">${stats.totalPaid.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Balance</p>
                    <p className="font-bold text-blue-600 dark:text-blue-400">${stats.balance.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Snapshot Preview */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {isGenerating ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={24} className="animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Generating snapshot...</span>
                  </div>
                ) : snapshotDataUrl ? (
                  <img src={snapshotDataUrl} alt="Contribution snapshot" className="w-full" />
                ) : (
                  <div className="flex items-center justify-center py-16 text-sm text-slate-400">
                    Preparing snapshot...
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handleSkip}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-2.5 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-600"
            >
              <SkipForward size={16} />
              Skip
            </button>
            <button
              onClick={handleSendWhatsApp}
              disabled={!snapshotDataUrl || isGenerating}
              className="flex-[2] flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageCircle size={16} />
              Send via WhatsApp
            </button>
            <button
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-medium transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Receipt Template for html2canvas */}
      {currentMember && stats && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div
            ref={receiptRef}
            style={{
              width: '400px',
              padding: '24px',
              backgroundColor: '#ffffff',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 4px 0' }}>
                Markaz Masjid
              </h1>
              <p style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 8px 0' }}>
                Contribution Statement
              </p>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Member Info */}
            <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 4px 0' }}>
                {currentMember.name}
              </h2>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                {currentMember.phone || 'No phone'}
              </p>
            </div>

            {/* Financial Summary */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <div style={{ flex: 1, backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Committed</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#334155', margin: 0 }}>${currentMember.committedAmount.toLocaleString()}</p>
              </div>
              <div style={{ flex: 1, backgroundColor: '#dcfce7', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '10px', color: '#16a34a', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Paid</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>${stats.totalPaid.toLocaleString()}</p>
              </div>
              <div style={{ flex: 1, backgroundColor: '#dbeafe', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                <p style={{ fontSize: '10px', color: '#2563eb', textTransform: 'uppercase', margin: '0 0 4px 0' }}>Balance</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb', margin: 0 }}>${stats.balance.toLocaleString()}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${stats.percent}%`, backgroundColor: '#22c55e', borderRadius: '4px' }} />
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'right', marginTop: '4px' }}>{stats.percent}% Complete</p>
            </div>

            {/* Recent Activity */}
            {currentMember.payments.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Recent Activity
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentMember.payments.slice(0, 4).map((payment) => (
                    <div key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>{payment.date}</span>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>${payment.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                JazakAllah Khair for your continued support.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RemindAllModal;
