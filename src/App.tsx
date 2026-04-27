import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  limit,
  deleteDoc,
  doc,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, localDb } from './lib/firebase.ts';
import { useAuth, AuthProvider } from './context/AuthContext.tsx';
import { Transaction, Category, TransactionType } from './types.ts';
import { 
  LayoutDashboard, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plus, 
  LogOut, 
  History,
  TrendingUp,
  Wallet,
  Menu,
  X,
  Trash2,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './components/ui/button.tsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card.tsx';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from './components/ui/dialog.tsx';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './components/ui/table.tsx';
import { Badge } from './components/ui/badge.tsx';
import { TransactionForm } from './components/TransactionForm.tsx';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Toaster } from './components/ui/sonner.tsx';
import { toast } from 'sonner';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip
} from 'recharts';

const LoginScreen = () => {
  const { manualLogin, login } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'manual' | 'google'>('manual');

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const success = await manualLogin(username, password);
      if (success) {
        toast.success('Selamat Datang, Admin');
      } else {
        toast.error('Username atau Password salah');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan saat login');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
      toast.success('Berhasil masuk dengan Google');
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        toast.error('Popup diblokir browser');
      } else {
        toast.error('Gagal masuk');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-masjid-emerald-dark overflow-hidden relative">
      {/* Dynamic Background Patterns */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="islamic-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 20 10 L 10 20 L 0 10 Z" fill="none" stroke="white" strokeWidth="0.5" />
            <circle cx="10" cy="10" r="2" fill="white" fillOpacity="0.2" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#islamic-grid)" />
        </svg>
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-emerald-400 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 15, repeat: Infinity, delay: 2 }}
          className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-teal-500 rounded-full blur-[120px]" 
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 w-full max-w-[420px] mx-4"
      >
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 lg:p-10 border border-white/20 overflow-hidden relative">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto text-emerald-600 mb-6 shadow-sm">
              <Wallet size={40} className="stroke-[1.5]" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-800">Al-Muhajirin</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Sistem Keuangan Masjid</p>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'manual' ? (
              <motion.form 
                key="manual"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleManualLogin} 
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">Username</label>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: admin"
                    className="w-full h-14 bg-slate-50 border-transparent focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 rounded-2xl px-5 text-sm font-bold transition-all outline-none text-slate-700"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-14 bg-slate-50 border-transparent focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 rounded-2xl px-5 text-sm font-bold transition-all outline-none text-slate-700"
                    required
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full h-14 bg-masjid-emerald-dark hover:bg-masjid-emerald text-white rounded-2xl font-bold text-base shadow-xl shadow-emerald-200 transition-all active:scale-95"
                >
                  {isLoggingIn ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Masuk Ke Sistem'}
                </Button>
              </motion.form>
            ) : (
              <motion.div 
                key="google"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 py-4"
              >
                <Button 
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full h-14 bg-white border-2 border-slate-100 hover:border-emerald-500/30 hover:bg-emerald-50 text-slate-700 rounded-2xl flex items-center justify-center gap-3 transition-all font-bold group shadow-sm"
                >
                  {isLoggingIn ? (
                    <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  Google Login
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black text-slate-300">
              <span className="bg-white px-4">Atau</span>
            </div>
          </div>

          <button 
            onClick={() => setMode(mode === 'manual' ? 'google' : 'manual')}
            className="w-full text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Masuk {mode === 'manual' ? 'dengan Google Akun' : 'dengan Username & Password'}
          </button>
        </div>
        
        <p className="text-center mt-8 text-white/50 text-[10px] font-bold uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} Masjid Al-Muhajirin
        </p>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const { user, isAdmin, profile, logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'categories'>('overview');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    // Seed and fetch categories
    const initCategories = async () => {
      const catRef = collection(db, 'categories');
      const q = query(catRef, orderBy('name', 'asc'));
      
      const unsubscribe = onSnapshot(q, async (snap) => {
        const remoteCats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        const localCats = localDb.getCategories() as Category[];
        
        // Merge without duplicates by name+type
        const merged = [...remoteCats];
        localCats.forEach(lc => {
          if (!merged.find(mc => mc.name.toLowerCase() === lc.name.toLowerCase() && mc.type === lc.type)) {
            merged.push(lc);
          }
        });
        
        setCategories(merged);

        if (snap.empty && isAdmin && remoteCats.length === 0) {
          const defaultCats = [
            { name: 'Infaq Jumat', type: 'income' },
            { name: 'Sedekah Subuh', type: 'income' },
            { name: 'Kotak Amal', type: 'income' },
            { name: 'Zakat/Wakaf', type: 'income' },
            { name: 'Listrik/Air', type: 'expense' },
            { name: 'Kebersihan', type: 'expense' },
            { name: 'Gaji Marbot', type: 'expense' },
            { name: 'Kegiatan Masjid', type: 'expense' },
            { name: 'Lain-lain', type: 'expense' }
          ];
          for (const cat of defaultCats) {
            try {
              await addDoc(collection(db, 'categories'), cat);
            } catch (e) {
              console.error("Failed to seed default categories to cloud", e);
            }
          }
        }
      }, (error) => {
        console.warn("Retrying category connection...", error.message);
        // Fallback to purely local if cloud fails
        setCategories(localDb.getCategories() as Category[]);
      });
      
      return unsubscribe;
    };
    
    let unsub: any;
    initCategories().then(u => unsub = u);
    return () => unsub && unsub();
  }, [isAdmin]);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remoteData = snapshot.docs.map(doc => {
        const d = doc.data();
        return { 
          ...d, 
          id: doc.id,
          date: d.date || new Date().toISOString(), // safety
        } as Transaction;
      });
      const localData = localDb.getTransactions() as Transaction[];
      
      // Merge and sort
      const merged = [...remoteData, ...localData].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setTransactions(merged);
    }, (error) => {
      console.warn("Firestore transactions snapshot error:", error.message);
      // Fallback to local
      setTransactions(localDb.getTransactions() as Transaction[]);
    });

    return () => unsubscribe();
  }, []);

  const stats = transactions.reduce((acc: { income: number; expense: number }, curr) => {
    if (curr.type === 'income') acc.income += curr.amount;
    else acc.expense += curr.amount;
    return acc;
  }, { income: 0, expense: 0 });

  // Data preparation for charts - ONLY EXPENSES for "Allocation"
  const pieData = Object.entries(
    transactions
      .filter(t => t.type === 'expense')
      .reduce((acc: Record<string, number>, curr) => {
        const cat = curr.categoryName || 'Lainnya';
        acc[cat] = (acc[cat] || 0) + curr.amount;
        return acc;
      }, {})
  ).map(([name, value]) => ({ name, value: value as number }))
   .sort((a, b) => b.value - a.value)
   .slice(0, 5);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];


  const balance = stats.income - stats.expense;

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus transaksi ini?')) return;
    try {
      await deleteDoc(doc(db, 'transactions', id));
      toast.success('Transaksi dihapus');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'transactions');
    }
  };

  const [dialogType, setDialogType] = useState<TransactionType>('income');

  const openForm = (type: TransactionType) => {
    setDialogType(type);
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setDialogType(tx.type);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-masjid-cream flex flex-col lg:flex-row">
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-masjid-emerald/10 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-masjid-emerald rounded-lg flex items-center justify-center text-white shadow-sm font-bold">
            M
          </div>
          <span className="font-bold text-masjid-slate tracking-tight">Al-Muhajirin</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-masjid-slate">
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Overlay Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed lg:relative z-[60] w-72 h-full bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="py-8 px-8">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 gradient-green rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-200 text-lg">
                M
              </div>
              <div>
                <h2 className="text-sm font-bold leading-tight text-masjid-slate">Masjid Al-Muhajirin</h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Keuangan Masjid</p>
              </div>
            </div>

            <nav className="space-y-1.5">
              <div 
                className={`px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold cursor-pointer transition-all duration-200 ${activeTab === 'overview' ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100' : 'text-slate-500 hover:bg-slate-50'}`}
                onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
              >
                <LayoutDashboard size={20} /> Dashboard
              </div>
              <div 
                className={`px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold cursor-pointer transition-all duration-200 ${activeTab === 'history' ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100' : 'text-slate-500 hover:bg-slate-50'}`}
                onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}
              >
                <History size={20} /> Transaksi
              </div>
              <div 
                className={`px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold cursor-pointer transition-all duration-200 ${activeTab === 'categories' ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100' : 'text-slate-500 hover:bg-slate-50'}`}
                onClick={() => {setActiveTab('categories'); setIsSidebarOpen(false);}}
              >
                <TrendingUp size={20} /> Kategori Dana
              </div>
            </nav>
          </div>

          <div className="mt-auto p-6">
            <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 mb-4 border border-slate-100">
              <img src={profile?.photoURL || ''} alt={profile?.displayName || 'User'} className="w-10 h-10 rounded-full bg-slate-300 ring-4 ring-white shadow-sm" />
              <div className="overflow-hidden">
                <p className="text-xs font-bold truncate text-masjid-slate">{profile?.displayName}</p>
                <p className="text-[10px] text-slate-400 truncate uppercase tracking-widest font-bold">{profile?.role}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 h-12 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl font-bold transition-all"
              onClick={logout}
            >
              <LogOut size={20} /> Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-10 overflow-y-auto bg-masjid-cream">
        <div className="max-w-6xl mx-auto space-y-6 lg:space-y-10">
          
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-masjid-slate">
                {activeTab === 'overview' ? 'Dashboard Utama' : 
                 activeTab === 'history' ? 'Riwayat Transaksi' : 'Pengaturan Kategori'}
              </h2>
              <p className="text-slate-400 text-xs lg:text-sm mt-1 uppercase tracking-wider font-medium">
                {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
              </p>
            </div>
            
            {isAdmin && activeTab !== 'categories' && (
              <div className="flex gap-2 w-full md:w-auto">
                <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) setEditingTransaction(null); }}>
                  <div className="flex gap-2 w-full">
                    <Button 
                      onClick={() => openForm('income')}
                      className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 h-10"
                    >
                      + Masuk
                    </Button>
                    <Button 
                      onClick={() => openForm('expense')}
                      className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 h-10"
                    >
                      + Keluar
                    </Button>
                  </div>
                  <DialogContent className="sm:max-w-lg rounded-[2rem]">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold">
                        {editingTransaction ? 'Ubah Transaksi' : (dialogType === 'income' ? 'Catat Uang Masuk' : 'Catat Uang Keluar')}
                      </DialogTitle>
                      <DialogDescription>
                        Lengkapi rincian dana {dialogType === 'income' ? 'masuk' : 'keluar'} Masjid.
                      </DialogDescription>
                    </DialogHeader>
                    <TransactionForm 
                      editingTransaction={editingTransaction}
                      initialType={dialogType}
                      categories={categories}
                      onSuccess={() => setIsFormOpen(false)} 
                      onCancel={() => setIsFormOpen(false)} 
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {activeTab === 'categories' && (
            <div className="space-y-6">
              <Card className="bento-card">
                <CardHeader>
                  <CardTitle>Daftar Kategori Dana</CardTitle>
                  <CardDescription>Kategori yang tersedia untuk memilah transaksi keuangan.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-bold text-emerald-700 mb-4 flex items-center gap-2">
                        <ArrowUpCircle size={18} /> Pemasukan (Masuk)
                      </h4>
                      <div className="space-y-2">
                        {categories.filter(c => c.type === 'income').map(c => (
                          <div key={c.id} className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
                            <span className="font-bold text-emerald-900">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-orange-700 mb-4 flex items-center gap-2">
                        <ArrowDownCircle size={18} /> Pengeluaran (Keluar)
                      </h4>
                      <div className="space-y-2">
                        {categories.filter(c => c.type === 'expense').map(c => (
                          <div key={c.id} className="p-3 bg-orange-50 rounded-xl border border-orange-100 flex justify-between items-center">
                            <span className="font-bold text-orange-900">{c.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6">
              {/* Summary Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <div className="bento-card gradient-green text-white flex flex-col justify-between py-6 shadow-xl shadow-emerald-100 min-h-[160px]">
                  <div>
                    <p className="text-[10px] md:text-xs font-semibold opacity-80 uppercase tracking-wider">Total Saldo Kas</p>
                    <h3 className="text-2xl lg:text-3xl font-bold mt-1">{formatCurrency(balance)}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="bg-white/20 px-2 py-1 rounded-lg border border-white/10 backdrop-blur-sm">Update {format(new Date(), 'HH:mm')}</span>
                  </div>
                </div>

                <div className="bento-card flex flex-col justify-between py-6 bg-white border border-slate-100 min-h-[160px]">
                  <div>
                    <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">Pemasukan</p>
                    <h3 className="text-xl lg:text-2xl font-bold text-slate-800 mt-1">{formatCurrency(stats.income)}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 self-start px-2 py-1 rounded-lg">
                    <ArrowUpCircle size={14} /> Total Infaq
                  </div>
                </div>

                <div className="bento-card flex flex-col justify-between py-6 bg-white border border-slate-100 min-h-[160px]">
                  <div>
                    <p className="text-[10px] md:text-xs font-semibold text-slate-400 uppercase tracking-wider">Dana Keluar</p>
                    <h3 className="text-xl lg:text-2xl font-bold text-slate-800 mt-1">{formatCurrency(stats.expense)}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-red-500 font-bold bg-red-50 self-start px-2 py-1 rounded-lg">
                    <ArrowDownCircle size={14} /> Operasional
                  </div>
                </div>
              </div>

              {/* Data Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Recent Activity */}
                <div className="lg:col-span-8 bento-card overflow-hidden p-6 bg-white border border-slate-100 flex flex-col min-h-[480px]">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-lg text-masjid-slate">Transaksi Terakhir</h4>
                    <button 
                      className="text-xs text-emerald-600 font-bold hover:underline bg-emerald-50 px-3 py-1.5 rounded-lg" 
                      onClick={() => setActiveTab('history')}
                    >
                      Lihat Semua
                    </button>
                  </div>
                  <div className="overflow-x-auto flex-1">
                    <Table className="w-full text-sm">
                      <TableHeader>
                        <TableRow className="text-slate-400 text-left border-b border-slate-50">
                          <TableHead className="pb-4 font-bold uppercase text-[10px] tracking-widest">Keterangan</TableHead>
                          <TableHead className="pb-4 font-bold hidden sm:table-cell uppercase text-[10px] tracking-widest">Kategori</TableHead>
                          <TableHead className="pb-4 font-bold text-right uppercase text-[10px] tracking-widest">Jumlah</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-50">
                        {transactions.slice(0, 6).map((tx) => (
                          <TableRow key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 font-medium">
                              <div className="flex flex-col">
                                <span className="text-masjid-slate font-bold">{tx.description}</span>
                                <span className="text-[10px] text-slate-400 font-bold lg:hidden mt-0.5">
                                  {tx.categoryName} • {format(new Date(tx.date), 'dd MMM')}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 hidden sm:table-cell">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${tx.type === 'income' ? 'text-emerald-700 bg-emerald-50' : 'text-orange-700 bg-orange-50'}`}>
                                {tx.categoryName}
                              </span>
                            </td>
                            <td className={`py-4 text-right font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                              {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                            </td>
                          </TableRow>
                        ))}
                        {transactions.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-20 text-slate-400 italic text-sm font-medium">
                              Belum ada transaksi terekam hari ini.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Allocation Chart */}
                <div className="lg:col-span-4 bento-card flex flex-col p-6 bg-white border border-slate-100 min-h-[480px]">
                  <h4 className="font-bold text-lg text-masjid-slate mb-1">Alokasi Dana</h4>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-6">Distribusi Pengeluaran</p>
                  
                  <div className="flex-1 min-h-[250px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius="65%"
                          outerRadius="90%"
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '12px' }}
                          formatter={(value: any) => formatCurrency(Number(value || 0))}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-8 space-y-3">
                    {pieData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-slate-600 font-bold truncate max-w-[140px]">{item.name}</span>
                        </div>
                        <span className="text-slate-800 font-black">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                    {pieData.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-xs italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        <span>Data alokasi belum tersedia</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <Card className="bento-card overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="font-bold">Seluruh Riwayat Transaksi</CardTitle>
                <CardDescription>Manajemen data keuangan masjid secara transparan</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      {isAdmin && <TableHead className="text-center">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id} className="group transition-colors">
                        <TableCell className="text-xs font-medium text-slate-400">
                          {format(new Date(tx.date), 'dd MMM yyyy', { locale: id })}
                        </TableCell>
                        <TableCell className="font-bold text-masjid-slate">{tx.description}</TableCell>
                        <TableCell>
                          <Badge className={tx.type === 'income' ? 'bg-emerald-50 text-emerald-700 border-none' : 'bg-red-50 text-red-700 border-none'} variant="outline">
                            {tx.categoryName}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-bold ${tx.type === 'income' ? 'text-emerald-700' : 'text-red-600'}`}>
                           {tx.type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-masjid-slate" onClick={() => handleEdit(tx)}>
                                <Edit2 size={14} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(tx.id)}>
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

function MainContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-masjid-cream">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-masjid-emerald"
        >
          <Wallet size={48} />
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LoginScreen />
          </motion.div>
        ) : (
          <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Dashboard />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
