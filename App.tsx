import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_MEMBERS } from './constants';
import { Member } from './types';
import Dashboard from './components/Dashboard';
import MemberDetailModal from './components/MemberDetailModal';
import AddMemberModal from './components/AddMemberModal';
import ImportMembersModal from './components/ImportMembersModal';
import GeminiChat from './components/GeminiChat';
import LoginPage from './components/LoginPage';
import VantaBackground from './components/VantaBackground';
import { supabase, mapMemberFromDB, mapMemberToDB, DbMember, validateAccessCode } from './services/supabaseClient';
import { Search, LayoutDashboard, Users, Plus, Moon, Sun, LogOut, RotateCw, AlertCircle, Upload } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'members'>('dashboard');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  
  // Modal States
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | undefined>(undefined);

  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // 1. Fetch Initial Data
  const fetchMembers = async () => {
    setLoading(true);
    try {
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .order('name');
            
        if (error) throw error;

        if (data && data.length > 0) {
            setMembers(data.map(mapMemberFromDB));
            setSyncError(null);
        } else {
            console.log("Database empty. Auto-seeding...");
            const payload = INITIAL_MEMBERS.map(mapMemberToDB);
            const { error: seedError } = await supabase.from('members').upsert(payload);
            
            if (seedError) {
                console.error("Auto-seed failed:", seedError);
                setMembers(INITIAL_MEMBERS);
                setSyncError("Connected, but failed to save initial data.");
            } else {
                setMembers(INITIAL_MEMBERS);
                setSyncError(null);
            }
        }
    } catch (err: any) {
        console.error('Error fetching members:', err);
        setMembers(INITIAL_MEMBERS);
        setSyncError("Offline Mode: Database connection failed.");
    } finally {
        setLoading(false);
    }
  };

  // 2. Realtime Subscription (The "Magic" Auto-Update)
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchMembers();

    // Subscribe to changes on the 'members' table
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'members',
        },
        (payload) => {
          console.log('Realtime Change Received:', payload);

          if (payload.eventType === 'INSERT') {
            const newMember = mapMemberFromDB(payload.new);
            setMembers((prev) => {
                // Prevent duplicate if already added via optimistic update or bulk fetch
                if (prev.some(m => m.id === newMember.id)) {
                    return prev;
                }
                return [...prev, newMember];
            });
          } 
          else if (payload.eventType === 'UPDATE') {
            const updatedMember = mapMemberFromDB(payload.new);
            setMembers((prev) => 
              prev.map((m) => (m.id === updatedMember.id ? updatedMember : m))
            );
            
            // CRITICAL: If the user has a modal open for this member, update it too
            setSelectedMember(prev => prev && prev.id === updatedMember.id ? updatedMember : prev);
          } 
          else if (payload.eventType === 'DELETE') {
            setMembers((prev) => prev.filter((m) => m.id !== payload.old.id));
            setSelectedMember(prev => prev && prev.id === payload.old.id ? null : prev);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  // Auth & Theme Logic
  useEffect(() => {
    const storedAuth = localStorage.getItem('isAuth');
    if (storedAuth === 'true') setIsAuthenticated(true);

    const storedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (storedTheme) setTheme(storedTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    root.classList.remove('dark', 'light');
    body.classList.remove('dark', 'light');
    root.classList.add(theme);
    body.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleLogin = async (password: string) => {
    const isValid = await validateAccessCode(password);
    if (isValid) {
        setIsAuthenticated(true);
        localStorage.setItem('isAuth', 'true');
        return true;
    }
    return false;
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      localStorage.removeItem('isAuth');
  };

  // CRUD Operations
  const handleSaveMember = async (member: Member) => {
    const dbMember = mapMemberToDB(member);
    
    // Optimistic Update (UI updates before Server responds)
    if (memberToEdit) {
        setMembers(prev => prev.map(m => m.id === member.id ? member : m));
        if (selectedMember?.id === member.id) setSelectedMember(member);
    } else {
        setMembers(prev => [...prev, member]);
    }

    try {
        const { error } = await supabase.from('members').upsert(dbMember);
        if (error) throw error;
    } catch (err) {
        console.error("Error saving to DB:", err);
        alert("Failed to save changes to the cloud. Please check connection.");
    }

    setIsMemberFormOpen(false);
    setMemberToEdit(undefined);
  };

  const handleDeleteMember = async (id: number) => {
      // Confirmation moved to Modal component for better UX/Event handling
      
      // Optimistic UI Update
      setMembers(prev => prev.filter(m => m.id !== id));
      if (selectedMember?.id === id) setSelectedMember(null);

      try {
          const { error } = await supabase.from('members').delete().eq('id', id);
          if (error) throw error;
      } catch (err) {
          console.error("Error deleting member:", err);
          alert("Failed to delete member from database.");
          fetchMembers(); // Revert
      }
  };

  const handleBulkImport = async (
    inserts: Omit<Member, 'id' | 'payments'>[], 
    updates: Member[]
  ) => {
    // 1. Prepare Inserts
    let nextId = Math.max(0, ...members.map(m => m.id)) + 1;
    const insertPayload: DbMember[] = inserts.map((m, index) => {
        const fullMember: Member = {
            id: nextId + index,
            ...m,
            payments: [] 
        };
        return mapMemberToDB(fullMember);
    });

    // 2. Prepare Updates
    const updatePayload: DbMember[] = updates.map(m => mapMemberToDB(m));

    try {
        // We use upsert for both. Inserts have new IDs, Updates have existing IDs.
        // It's safe to batch them if the count isn't massive.
        const allPayload = [...insertPayload, ...updatePayload];
        
        if (allPayload.length === 0) return;

        // Splitting into chunks of 100 just in case
        const chunkSize = 100;
        for (let i = 0; i < allPayload.length; i += chunkSize) {
             const chunk = allPayload.slice(i, i + chunkSize);
             const { error } = await supabase.from('members').upsert(chunk);
             if (error) throw error;
        }
        
        // We still fetch to ensure consistency, but realtime logic now handles dupes
        await fetchMembers(); 
        
    } catch (error) {
        console.error("Bulk Import Failed:", error);
        throw error;
    }
  };

  // Robust Update Function used for Adding/Deleting Payments
  const handlePaymentUpdate = async (updatedMember: Member) => {
    // 1. Optimistic Update (Update UI immediately)
    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    setSelectedMember(updatedMember);

    try {
        const { error } = await supabase
            .from('members')
            .update({ payments: updatedMember.payments })
            .eq('id', updatedMember.id);

        if (error) throw error;

    } catch (err) {
        console.error("Error updating payments:", err);
        alert("Failed to sync payment. The database might be locked or offline.");
    }
  };

  const openAddModal = () => {
      setMemberToEdit(undefined);
      setIsMemberFormOpen(true);
  };

  const openEditModal = (member: Member) => {
      setMemberToEdit(member);
      setIsMemberFormOpen(true);
  };

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone.includes(searchTerm)
    );
  }, [members, searchTerm]);

  if (!isAuthenticated) {
      return <LoginPage onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />;
  }

  return (
    <div className={`min-h-screen font-sans selection:bg-blue-500/30 text-slate-900 dark:text-slate-200 flex flex-col relative`}>

      {/* 3D Animated Background */}
      <VantaBackground theme={theme} />

      {/* Top Navigation */}
      <header className="relative bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md shadow-sm dark:shadow-lg sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button onClick={() => setActiveTab('dashboard')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Markaz Masjid" className="h-10 w-auto rounded-lg" />
            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                Markaz Masjid
            </span>
          </button>
          
          <nav className="flex items-center gap-2">
            <button
                onClick={toggleTheme}
                className="hidden sm:block p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                title="Toggle Theme"
            >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="hidden sm:block w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>
            <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
            </button>
            <button
                onClick={() => setActiveTab('members')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === 'members' ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'}`}
            >
                <Users size={18} />
                <span>Members</span>
            </button>
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>
            <button 
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                title="Sign Out"
            >
                <LogOut size={18} />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 w-full">
        
        {/* Sync Status / Error */}
        {syncError && (
             <div className="mb-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-xl flex items-center gap-3 text-amber-800 dark:text-amber-200">
                <AlertCircle size={20} />
                <p className="text-sm font-medium">{syncError}</p>
             </div>
        )}

        {/* Loading State */}
        {loading && members.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96">
                <RotateCw className="animate-spin text-blue-600 dark:text-blue-400 mb-4" size={40} />
                <p className="text-slate-500 dark:text-slate-400">Syncing with database...</p>
            </div>
        ) : activeTab === 'dashboard' ? (
            <Dashboard members={members} />
        ) : (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="relative w-full sm:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search members..." 
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b]/50 focus:bg-white dark:focus:bg-[#1e293b] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        {/* Manual Reload Button */}
                         <button 
                            onClick={fetchMembers}
                            className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-medium whitespace-nowrap shadow-sm"
                            title="Reload Data"
                        >
                            <RotateCw size={18} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        
                        <button 
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 px-4 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-medium whitespace-nowrap shadow-sm"
                            title="Import CSV"
                        >
                            <Upload size={18} />
                            <span className="hidden sm:inline">Import</span>
                        </button>

                        <button 
                            onClick={openAddModal}
                            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 font-medium active:scale-95"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Add Member</span>
                            <span className="inline sm:hidden">Add</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMembers.map(member => {
                         const totalPaid = member.payments.reduce((acc, p) => acc + p.amount, 0);
                         const progress = Math.min(100, (totalPaid / (member.committedAmount || 1)) * 100);
                         const balance = Math.max(0, member.committedAmount - totalPaid);
                         
                         return (
                            <div 
                                key={member.id} 
                                onClick={() => setSelectedMember(member)}
                                className="bg-white dark:bg-[#1e293b]/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-lg hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500/30 transition-all cursor-pointer group hover:-translate-y-1"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{member.name}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{member.phone || 'No Phone'}</p>
                                    </div>
                                    <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                                        {member.frequency}
                                    </span>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Collected</span>
                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">${totalPaid.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-blue-500 h-1.5 rounded-full shadow-sm dark:shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all" style={{ width: `${progress}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-500 pt-1">
                                        <span>Committed: ${member.committedAmount.toLocaleString()}</span>
                                        <span className={`${balance > 0 ? 'text-blue-600 dark:text-blue-300' : 'text-slate-400 dark:text-slate-500'}`}>Balance: ${balance.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                         )
                    })}
                </div>
                
                {filteredMembers.length === 0 && (
                    <div className="text-center py-12 text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white/50 dark:bg-[#1e293b]/30">
                        <Users size={48} className="mx-auto mb-3 opacity-20" />
                        <p>{loading ? 'Initializing...' : 'No members found.'}</p>
                    </div>
                )}
            </div>
        )}
      </main>

      {/* Modals */}
      {selectedMember && (
        <MemberDetailModal 
            member={selectedMember} 
            onClose={() => setSelectedMember(null)} 
            onUpdateMember={handlePaymentUpdate}
            onEditMember={() => openEditModal(selectedMember)}
            onDeleteMember={() => handleDeleteMember(selectedMember.id)}
        />
      )}

      {isMemberFormOpen && (
        <AddMemberModal 
            onClose={() => {
                setIsMemberFormOpen(false);
                setMemberToEdit(undefined);
            }}
            onSave={handleSaveMember}
            nextId={Math.max(0, ...members.map(m => m.id)) + 1}
            memberToEdit={memberToEdit}
        />
      )}

      {isImportModalOpen && (
        <ImportMembersModal
            onClose={() => setIsImportModalOpen(false)}
            onImport={handleBulkImport}
            existingMembers={members}
        />
      )}

      {/* AI Assistant */}
      <GeminiChat members={members} />

      {/* Mobile Theme Toggle - Bottom */}
      <button
        onClick={toggleTheme}
        className="sm:hidden fixed bottom-4 left-4 z-40 p-3 rounded-full bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-95"
        title="Toggle Theme"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-slate-400 text-xs border-t border-slate-200 dark:border-slate-700/50 bg-white/50 dark:bg-slate-900/50">
          <p>© {new Date().getFullYear()} Markaz Masjid | Built by <span className="font-semibold text-slate-500 dark:text-slate-300">BlackScale Digital</span></p>
      </footer>
    </div>
  );
};

export default App;