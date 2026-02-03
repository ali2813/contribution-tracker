import React, { useState, useEffect } from 'react';
import { Member, PaymentFrequency } from '../types';
import { X, User, Phone, Mail, DollarSign, Calendar, Save } from 'lucide-react';

interface AddMemberModalProps {
  onClose: () => void;
  onSave: (member: Member) => void;
  nextId: number;
  memberToEdit?: Member;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ onClose, onSave, nextId, memberToEdit }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    committedAmount: '',
    frequency: PaymentFrequency.YEARLY,
    notes: ''
  });

  useEffect(() => {
    if (memberToEdit) {
        setFormData({
            name: memberToEdit.name,
            phone: memberToEdit.phone,
            email: memberToEdit.email || '',
            committedAmount: memberToEdit.committedAmount.toString(),
            frequency: memberToEdit.frequency,
            notes: memberToEdit.notes || ''
        });
    }
  }, [memberToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const memberData: Member = {
      id: memberToEdit ? memberToEdit.id : nextId,
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      committedAmount: parseFloat(formData.committedAmount) || 0,
      frequency: formData.frequency,
      payments: memberToEdit ? memberToEdit.payments : [],
      notes: formData.notes
    };
    
    onSave(memberData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 transition-colors duration-300 flex flex-col max-h-[90vh]">
        
        <div className="bg-blue-50 dark:bg-blue-600/20 p-6 border-b border-blue-100 dark:border-blue-500/20 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {memberToEdit ? 'Edit Member' : 'Add New Member'}
            </h2>
            <p className="text-blue-600 dark:text-blue-200 text-sm">
                {memberToEdit ? 'Update member details below' : 'Enter the details below'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Full Name</label>
            <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                <input 
                    type="text" 
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-600"
                    placeholder="Brother/Sister Name"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Phone Number</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                    <input 
                        type="tel" 
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-600"
                        placeholder="(555) 000-0000"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                </div>
            </div>
            <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Email (Optional)</label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                    <input 
                        type="email" 
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-600"
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Committed Amount ($)</label>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                    <input 
                        type="number" 
                        required
                        min="0"
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400 dark:placeholder-slate-600"
                        placeholder="0.00"
                        value={formData.committedAmount}
                        onChange={e => setFormData({...formData, committedAmount: e.target.value})}
                    />
                </div>
            </div>
            <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Frequency</label>
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
                    <select 
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 appearance-none"
                        value={formData.frequency}
                        onChange={e => setFormData({...formData, frequency: e.target.value as PaymentFrequency})}
                    >
                        <option value={PaymentFrequency.MONTHLY}>Monthly</option>
                        <option value={PaymentFrequency.YEARLY}>Yearly</option>
                        <option value={PaymentFrequency.ONE_TIME}>One-time</option>
                    </select>
                </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Notes (Optional)</label>
            <textarea 
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-2.5 px-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none h-20 placeholder-slate-400 dark:placeholder-slate-600"
                placeholder="Any additional information..."
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <div className="pt-4 flex gap-3 shrink-0">
            <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
                Cancel
            </button>
            <button 
                type="submit" 
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition shadow-lg shadow-blue-500/25"
            >
                {memberToEdit ? (
                    <>
                        <Save size={18} />
                        <span>Update Member</span>
                    </>
                ) : (
                    <>
                        <span>Add Member</span>
                    </>
                )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;