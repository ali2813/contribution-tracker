import React, { useState, useRef, useMemo } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, FileText, Loader2, Save, Users, ArrowRight, RefreshCw, AlertTriangle } from 'lucide-react';
import { Member, PaymentFrequency } from '../types';

interface ImportMembersModalProps {
  onClose: () => void;
  onImport: (toInsert: Omit<Member, 'id' | 'payments'>[], toUpdate: Member[]) => Promise<void>;
  existingMembers: Member[];
}

interface Conflict {
  csvMember: Omit<Member, 'id' | 'payments'>;
  existingMember: Member;
  reason: string;
  resolution: 'skip' | 'update' | 'create';
}

const ImportMembersModal: React.FC<ImportMembersModalProps> = ({ onClose, onImport, existingMembers }) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'resolve'>('upload');
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Omit<Member, 'id' | 'payments'>[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [cleanData, setCleanData] = useState<Omit<Member, 'id' | 'payments'>[]>([]);
  
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = ['Name', 'Phone', 'Email', 'Committed Amount', 'Frequency', 'Notes'];
    const exampleRow = ['Brother Ahmed Ali', '555-123-4567', 'ahmed@example.com', '1200', 'Yearly', 'New neighbor'];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), exampleRow.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "markaz_members_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVLine = (text: string): string[] => {
    const result: string[] = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
            result.push(cell.trim());
            cell = '';
        } else cell += char;
    }
    result.push(cell.trim());
    return result.map(c => c.replace(/^"|"$/g, '').trim());
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r\n|\n/);
    const headers = parseCSVLine(lines[0] || '').map(h => h.toLowerCase());
    
    if (!headers || headers.length < 1) {
      setErrors(['Invalid CSV format: Header row missing.']);
      return;
    }

    const getIndex = (key: string) => headers.findIndex(h => h.includes(key));
    const nameIdx = getIndex('name');
    const phoneIdx = getIndex('phone');
    const emailIdx = getIndex('email');
    const amountIdx = getIndex('amount');
    const freqIdx = getIndex('frequency');
    const notesIdx = getIndex('note');

    if (nameIdx === -1) {
      setErrors(['Invalid CSV: "Name" column is required.']);
      return;
    }

    const parsed: Omit<Member, 'id' | 'payments'>[] = [];
    const newErrors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cleanRow = parseCSVLine(line);
      if (cleanRow.length < 1) continue;

      const name = cleanRow[nameIdx];
      if (!name) {
        newErrors.push(`Row ${i + 1}: Name is missing. Skipped.`);
        continue;
      }

      let committedAmount = 0;
      if (amountIdx !== -1 && cleanRow[amountIdx]) {
        committedAmount = parseFloat(cleanRow[amountIdx].replace(/[^0-9.]/g, '')) || 0;
      }

      let frequency = PaymentFrequency.YEARLY;
      if (freqIdx !== -1 && cleanRow[freqIdx]) {
        const val = cleanRow[freqIdx].toLowerCase();
        if (val.includes('month')) frequency = PaymentFrequency.MONTHLY;
        else if (val.includes('one')) frequency = PaymentFrequency.ONE_TIME;
      }

      parsed.push({
        name,
        phone: phoneIdx !== -1 ? cleanRow[phoneIdx] : '',
        email: emailIdx !== -1 ? cleanRow[emailIdx] : undefined,
        committedAmount,
        frequency,
        notes: notesIdx !== -1 ? cleanRow[notesIdx] : undefined,
      });
    }

    setParsedData(parsed);
    setErrors(newErrors);
    setStep('preview');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        parseCSV(text);
      };
      reader.readAsText(selectedFile);
    }
  };

  const normalize = (str: string) => str.toLowerCase().trim();
  const normalizePhone = (str: string) => str.replace(/\D/g, '');

  const analyzeDuplicates = () => {
    const newConflicts: Conflict[] = [];
    const newCleanData: Omit<Member, 'id' | 'payments'>[] = [];

    parsedData.forEach(row => {
        const rowName = normalize(row.name);
        const rowPhone = normalizePhone(row.phone);

        // Find match in existing members
        const match = existingMembers.find(m => {
            const mName = normalize(m.name);
            const mPhone = normalizePhone(m.phone);
            
            const nameMatch = mName === rowName;
            const phoneMatch = rowPhone.length > 6 && mPhone.length > 6 && rowPhone === mPhone; // Strict phone match length

            return nameMatch || phoneMatch;
        });

        if (match) {
            newConflicts.push({
                csvMember: row,
                existingMember: match,
                reason: normalize(match.name) === rowName ? 'Name Match' : 'Phone Match',
                resolution: 'skip' // Default resolution
            });
        } else {
            newCleanData.push(row);
        }
    });

    setConflicts(newConflicts);
    setCleanData(newCleanData);

    if (newConflicts.length > 0) {
        setStep('resolve');
    } else {
        // No conflicts, proceed directly
        executeImport(newCleanData, []);
    }
  };

  const executeImport = async (inserts: Omit<Member, 'id' | 'payments'>[], updates: Member[]) => {
    setIsSubmitting(true);
    try {
      await onImport(inserts, updates);
      onClose();
    } catch (err) {
      setErrors(prev => ['Failed to upload data to server.', ...prev]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalConfirm = () => {
      const inserts = [...cleanData];
      const updates: Member[] = [];

      conflicts.forEach(c => {
          if (c.resolution === 'create') {
              inserts.push(c.csvMember);
          } else if (c.resolution === 'update') {
              // Merge CSV data into existing member, preserving ID and Payments
              updates.push({
                  ...c.existingMember,
                  ...c.csvMember, // Overwrite details
                  id: c.existingMember.id, // Ensure ID stays same
                  payments: c.existingMember.payments // Ensure payments stay same
              });
          }
      });

      executeImport(inserts, updates);
  };

  const setAllResolutions = (res: 'skip' | 'update' | 'create') => {
      setConflicts(prev => prev.map(c => ({ ...c, resolution: res })));
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 transition-colors">
        
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-600/20 p-6 border-b border-blue-100 dark:border-blue-500/20 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload size={24} className="text-blue-600 dark:text-blue-400" />
                Import Members
            </h2>
            <p className="text-blue-600 dark:text-blue-200 text-sm">
                {step === 'upload' && "Upload a CSV file to bulk add members."}
                {step === 'preview' && "Review your data before confirming."}
                {step === 'resolve' && "Duplicate members detected. Please resolve conflicts."}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
            
            {/* STEP 1: UPLOAD */}
            {step === 'upload' && (
                <>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">1. Download Template</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Use this CSV format for your data.</p>
                    </div>
                    <button onClick={downloadTemplate} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors">
                        <Download size={16} /> Download CSV
                    </button>
                </div>

                <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">2. Upload File</h3>
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${file ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                        {file ? (
                            <div className="flex flex-col items-center text-emerald-600 dark:text-emerald-400">
                                <FileText size={32} className="mb-2" />
                                <span className="font-medium">{file.name}</span>
                                <span className="text-xs text-emerald-500">Click to change file</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-slate-500 dark:text-slate-400">
                                <Upload size={32} className="mb-2" />
                                <span className="font-medium">Click to upload CSV</span>
                                <span className="text-xs">or drag and drop here</span>
                            </div>
                        )}
                    </div>
                </div>
                </>
            )}

            {/* ERROR DISPLAY */}
            {errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-2">
                        <AlertCircle size={18} />
                        <h4 className="font-semibold text-sm">Issues Found</h4>
                    </div>
                    <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-400 space-y-1">
                        {errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                        {errors.length > 5 && <li>...and {errors.length - 5} more.</li>}
                    </ul>
                </div>
            )}

            {/* STEP 2: PREVIEW */}
            {step === 'preview' && parsedData.length > 0 && (
                <div className="space-y-2">
                     <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Preview ({parsedData.length} records)</h3>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle size={14} /> Ready to check
                        </span>
                     </div>
                     <div className="max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                                <tr>
                                    <th className="p-3 font-medium text-slate-500 dark:text-slate-400">Name</th>
                                    <th className="p-3 font-medium text-slate-500 dark:text-slate-400">Phone</th>
                                    <th className="p-3 font-medium text-slate-500 dark:text-slate-400">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {parsedData.map((m, i) => (
                                    <tr key={i} className="text-slate-700 dark:text-slate-300">
                                        <td className="p-3 truncate max-w-[150px]">{m.name}</td>
                                        <td className="p-3">{m.phone}</td>
                                        <td className="p-3">${m.committedAmount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                     <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-lg text-xs flex gap-2 items-center">
                        <AlertTriangle size={16} />
                        Next step will check for duplicates in the database.
                     </div>
                </div>
            )}

            {/* STEP 3: RESOLVE CONFLICTS */}
            {step === 'resolve' && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl border border-amber-200 dark:border-amber-500/20">
                        <div>
                            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200 flex items-center gap-2">
                                <Users size={18} />
                                {conflicts.length} Duplicates Found
                            </h3>
                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                                Some imported records match existing members by Name or Phone.
                            </p>
                        </div>
                        <div className="flex gap-2 text-xs">
                            <button onClick={() => setAllResolutions('skip')} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition">Skip All</button>
                            <button onClick={() => setAllResolutions('update')} className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition">Merge All</button>
                        </div>
                    </div>

                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                        <div className="max-h-96 overflow-y-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 font-medium text-slate-500 dark:text-slate-400 w-1/3">CSV Data (New)</th>
                                        <th className="p-3 font-medium text-slate-500 dark:text-slate-400 w-1/3">Existing DB Data</th>
                                        <th className="p-3 font-medium text-slate-500 dark:text-slate-400 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {conflicts.map((c, i) => (
                                        <tr key={i} className="text-slate-700 dark:text-slate-300">
                                            <td className="p-3 bg-blue-50/30 dark:bg-blue-500/5">
                                                <div className="font-semibold">{c.csvMember.name}</div>
                                                <div className="text-slate-500">{c.csvMember.phone}</div>
                                                <div className="font-mono text-xs mt-1">${c.csvMember.committedAmount} / {c.csvMember.frequency}</div>
                                            </td>
                                            <td className="p-3 bg-slate-50/50 dark:bg-slate-800/50">
                                                <div className="font-semibold">{c.existingMember.name}</div>
                                                <div className="text-slate-500">{c.existingMember.phone}</div>
                                                <div className="font-mono text-xs mt-1">${c.existingMember.committedAmount} / {c.existingMember.frequency}</div>
                                                <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 uppercase font-bold tracking-wider">{c.reason}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-col gap-1">
                                                    <label className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer border ${c.resolution === 'skip' ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-500' : 'border-transparent'}`}>
                                                        <input type="radio" name={`res-${i}`} checked={c.resolution === 'skip'} onChange={() => {
                                                            const newConflicts = [...conflicts];
                                                            newConflicts[i].resolution = 'skip';
                                                            setConflicts(newConflicts);
                                                        }} />
                                                        <span>Skip</span>
                                                    </label>
                                                    <label className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer border ${c.resolution === 'update' ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-500' : 'border-transparent'}`}>
                                                        <input type="radio" name={`res-${i}`} checked={c.resolution === 'update'} onChange={() => {
                                                            const newConflicts = [...conflicts];
                                                            newConflicts[i].resolution = 'update';
                                                            setConflicts(newConflicts);
                                                        }} />
                                                        <span>Merge (Update DB)</span>
                                                    </label>
                                                    <label className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer border ${c.resolution === 'create' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-500' : 'border-transparent'}`}>
                                                        <input type="radio" name={`res-${i}`} checked={c.resolution === 'create'} onChange={() => {
                                                            const newConflicts = [...conflicts];
                                                            newConflicts[i].resolution = 'create';
                                                            setConflicts(newConflicts);
                                                        }} />
                                                        <span>Create New</span>
                                                    </label>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 shrink-0">
             <button 
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
            >
                Cancel
            </button>
            
            {step === 'upload' && (
               <button disabled className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-medium cursor-not-allowed">
                   Upload a File first
               </button>
            )}

            {step === 'preview' && (
                 <button 
                    onClick={analyzeDuplicates}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition shadow-lg shadow-blue-500/25"
                >
                    <span>Check for Duplicates</span>
                    <ArrowRight size={18} />
                </button>
            )}

            {step === 'resolve' && (
                 <button 
                    onClick={handleFinalConfirm}
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            <span>Confirm Import</span>
                        </>
                    )}
                </button>
            )}
        </div>

      </div>
    </div>
  );
};

export default ImportMembersModal;