import React, { useState, useEffect } from 'react';
import { Member, Payment } from '../types';
import { X, Plus, Trash2, Calendar, DollarSign, Phone, FileText, Mail, Pencil, MessageCircle, Copy, Check, Loader2, AlertTriangle } from 'lucide-react';

interface MemberDetailModalProps {
  member: Member;
  onClose: () => void;
  onUpdateMember: (updatedMember: Member) => Promise<void>;
  onEditMember: () => void;
  onDeleteMember?: () => Promise<void>;
}

const MemberDetailModal: React.FC<MemberDetailModalProps> = ({ member, onClose, onUpdateMember, onEditMember, onDeleteMember }) => {
  // Local form states
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Track deleting state per item
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Local state for payments to ensure immediate UI feedback
  const [localPayments, setLocalPayments] = useState<Payment[]>(member.payments || []);

  // Sync local payments if prop changes (e.g. Realtime update from server)
  useEffect(() => {
    setLocalPayments(member.payments || []);
  }, [member.payments]);

  // Derived calculations
  const totalPaid = localPayments.reduce((sum, p) => sum + p.amount, 0);
  const percent = Math.min(100, Math.round((totalPaid / (member.committedAmount || 1)) * 100));

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) return;

    // Generate robust ID (ensure uniqueness even in rapid creation)
    const id = crypto.randomUUID ? crypto.randomUUID() : `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const newPayment: Payment = {
      id,
      date,
      amount: parseFloat(amount),
      note
    };

    // 1. Calculate new state locally first
    const updatedPayments = [newPayment, ...localPayments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // 2. Update Local UI immediately
    setLocalPayments(updatedPayments);

    // 3. Prepare full member object for parent sync
    const updatedMember = {
      ...member,
      payments: updatedPayments
    };

    try {
        await onUpdateMember(updatedMember);
        setAmount('');
        setNote('');
        setIsAdding(false);
    } catch (error) {
        console.error("Failed to add payment:", error);
        // Revert local state on failure
        setLocalPayments(localPayments); 
        alert("Failed to save payment to database.");
    }
  };

  const handleDeletePayment = async (e: React.MouseEvent, paymentId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Critical: Stop event from bubbling up
    
    if(!window.confirm("Are you sure you want to permanently delete this payment?")) return;
    
    setDeletingId(paymentId);
    
    // Snapshot current state for rollback
    const previousPayments = [...localPayments];

    // 1. Filter out the item locally
    const updatedPayments = localPayments.filter(p => p.id !== paymentId);
    
    // 2. Update UI immediately
    setLocalPayments(updatedPayments);

    // 3. Prepare full member object with the filtered list
    const updatedMember = {
        ...member,
        payments: updatedPayments // This is the crucial payload sent to Supabase
    };

    try {
        console.log(`Deleting payment ${paymentId}. New payment count: ${updatedPayments.length}`);
        await onUpdateMember(updatedMember);
    } catch (error) {
        console.error("Failed to delete payment:", error);
        alert("An error occurred while deleting. Changes reverted.");
        setLocalPayments(previousPayments); // Revert
    } finally {
        setDeletingId(null);
    }
  };

  const handleMemberDeleteClick = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!onDeleteMember) return;
      
      // Inline confirmation logic
      if (!confirmDelete) {
          setConfirmDelete(true);
          // Auto-reset if user doesn't confirm within 4 seconds
          setTimeout(() => setConfirmDelete(false), 4000);
          return;
      }

      setIsDeletingMember(true);
      try {
          await onDeleteMember();
          // Modal unmounts on success
      } catch (error) {
          console.error("Delete failed", error);
          setIsDeletingMember(false);
          setConfirmDelete(false);
      }
  };

  const openWhatsApp = () => {
      const cleanPhone = member.phone.replace(/\D/g, '');
      if (cleanPhone) {
          window.open(`https://wa.me/${cleanPhone}`, '_blank');
      } else {
          alert('No phone number available for WhatsApp');
      }
  };

  const copyReminder = () => {
      const remaining = member.committedAmount - totalPaid;
      const text = `As-salamu alaykum ${member.name}, \n\nThis is a friendly reminder regarding your pledge to Markaz Masjid. \nCommitted: $${member.committedAmount}\nPaid so far: $${totalPaid}\nRemaining Balance: $${remaining}\n\nJazakAllah Khair for your continued support!`;
      
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transition-colors duration-300 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-slate-800 dark:from-blue-900 dark:to-slate-900 p-6 border-b border-slate-700 shrink-0">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl sm:text-2xl font-bold text-white line-clamp-1">{member.name}</h2>
                        <button 
                            onClick={onEditMember}
                            className="bg-white/10 hover:bg-white/20 p-1.5 rounded-lg text-white transition-colors"
                            title="Edit Member Details"
                        >
                            <Pencil size={14} />
                        </button>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-2 text-slate-300 text-sm">
                            <Phone size={14} />
                            <span>{member.phone || 'No phone number'}</span>
                        </div>
                        {member.email && (
                            <div className="flex items-center gap-2 text-slate-300 text-sm">
                                <Mail size={14} />
                                <span>{member.email}</span>
                            </div>
                        )}
                    </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all">
                    <X size={24} />
                </button>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-2 sm:flex sm:gap-8">
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Committed</p>
                    <p className="font-bold text-lg sm:text-xl text-white truncate">${member.committedAmount.toLocaleString()}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Paid</p>
                    <p className="font-bold text-lg sm:text-xl text-emerald-400 truncate">${totalPaid.toLocaleString()}</p>
                </div>
                 <div>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Balance</p>
                    <p className="font-bold text-lg sm:text-xl text-blue-400 truncate">${(member.committedAmount - totalPaid).toLocaleString()}</p>
                </div>
            </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-200 dark:bg-slate-800 w-full shrink-0">
            <div className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500" style={{ width: `${percent}%` }}></div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-[#0f172a] transition-colors duration-300 space-y-6">
          
          {/* Quick Contact Actions */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Quick Contact</h3>
            <div className="grid grid-cols-3 gap-2">
                <button 
                    onClick={openWhatsApp}
                    className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm"
                >
                    <MessageCircle size={16} />
                    <span>WhatsApp</span>
                </button>
                <a 
                    href={`tel:${member.phone}`}
                    className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-slate-200 dark:border-slate-600"
                >
                    <Phone size={16} />
                    <span>Call</span>
                </a>
                <button 
                    onClick={copyReminder}
                    className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-slate-200 dark:border-slate-600"
                >
                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    <span>{copied ? 'Copied' : 'Reminder'}</span>
                </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText size={18} className="text-blue-600 dark:text-blue-500" />
                    History
                </h3>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-500 transition shadow-lg shadow-blue-500/20"
                >
                    {isAdding ? <X size={14} /> : <Plus size={14} />}
                    {isAdding ? 'Cancel' : 'Add Payment'}
                </button>
            </div>

            {/* Add Payment Form */}
            {isAdding && (
                <form onSubmit={handleAddPayment} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg mb-6 animate-in fade-in slide-in-from-top-4">
                <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3">Record New Contribution</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Amount ($)</label>
                            <input 
                                type="number" 
                                required
                                min="1"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-600"
                                placeholder="e.g. 100"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date</label>
                            <input 
                                type="date" 
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Notes (Optional)</label>
                            <input 
                                type="text" 
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none placeholder-slate-400 dark:placeholder-slate-600"
                                placeholder="e.g. Received by Zubair"
                            />
                        </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/20">
                        Save Payment
                    </button>
                </div>
                </form>
            )}

            {/* List */}
            <div className="space-y-3">
                {localPayments.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                        <p>No contributions recorded yet.</p>
                    </div>
                ) : (
                    localPayments.map(payment => (
                        <div key={payment.id} className="bg-white dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 transition-colors flex justify-between items-center group shadow-sm dark:shadow-none">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-50 dark:bg-blue-500/10 p-2 rounded-full text-blue-600 dark:text-blue-400 shrink-0">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">${payment.amount.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                        <Calendar size={10} />
                                        {payment.date}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4">
                                {payment.note && (
                                    <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md hidden sm:inline-block border border-slate-200 dark:border-slate-600 max-w-[100px] truncate">
                                        {payment.note}
                                    </span>
                                )}
                                <button 
                                    type="button"
                                    onClick={(e) => handleDeletePayment(e, payment.id)}
                                    disabled={deletingId === payment.id}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50 relative z-10"
                                    title="Delete Payment"
                                >
                                    {deletingId === payment.id ? (
                                        <Loader2 size={16} className="animate-spin text-red-500" />
                                    ) : (
                                        <Trash2 size={16} className="pointer-events-none" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>
          
           {onDeleteMember && (
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-center pb-2">
                    <button 
                        type="button"
                        onClick={handleMemberDeleteClick}
                        disabled={isDeletingMember}
                        className={`flex items-center gap-2 text-sm font-medium px-6 py-3 rounded-xl transition-all disabled:opacity-50 border ${
                            confirmDelete 
                            ? 'bg-red-600 text-white hover:bg-red-700 border-red-600 shadow-lg shadow-red-500/30' 
                            : 'bg-transparent text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 border-transparent hover:border-red-200 dark:hover:border-red-800'
                        }`}
                    >
                        {isDeletingMember ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : confirmDelete ? (
                            <AlertTriangle size={18} />
                        ) : (
                            <Trash2 size={18} />
                        )}
                        <span>{confirmDelete ? 'Are you sure? Click to Confirm' : 'Delete Member Record'}</span>
                    </button>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default MemberDetailModal;