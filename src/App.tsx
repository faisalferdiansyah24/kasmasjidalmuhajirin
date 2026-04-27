import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  limit,
  deleteDoc,
  doc,
  addDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase.ts';
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
  Edit2,
  Lock
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

const LoginContent = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { manualLogin, login } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await manualLogin(username || 'admin', password);
      toast.success('Selamat Datang, Admin');
      onSuccess?.();
    } catch (error: any) {
      if (error.code === 'auth/admin-restricted-operation') {
        toast.error('Gagal: Aktifkan "Anonymous Auth" di Firebase Console');
      } else {
        toast.error('Gagal masuk. Periksa koneksi atau kredensial.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await login();
      toast.success('Berhasil masuk dengan Google');
      onSuccess?.();
    } catch (error: any) {
      toast.error('Gagal masuk dengan Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem]">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 mb-4 shadow-sm">
          <Lock size={32} className="stroke-[1.5]" />
        </div>
        <h1 className="text-2xl font-black text-slate-800">Akses Admin</h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Masjid Al-Muhajirin</p>
      </div>

      <form onSubmit={handleManualLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            className="w-full h-12 bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 text-sm font-bold outline-none text-slate-700"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full h-12 bg-slate-50 border-none focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 text-sm font-bold outline-none text-slate-700"
            required
          />
        </div>
        <Button 
          type="submit"
          disabled={isLoggingIn}
          className="w-full h-12 bg-masjid-emerald-dark hover:bg-masjid-emerald text-white rounded-xl font-bold transition-all"
        >
          {isLoggingIn ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Masuk Admin'}
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-100"></div>
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-black text-slate-300">
          <span className="bg-white px-2">Atau</span>
        </div>
      </div>

      <Button 
        onClick={handleGoogleLogin}
        disabled={isLoggingIn}
        variant="outline"
        className="w-full h-12 border-2 border-slate-100 hover:border-emerald-500/30 hover:bg-emerald-50 text-slate-700 rounded-xl flex items-center justify-center gap-2 font-bold transition-all"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Login Google
      </Button>
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
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    const catRef = collection(db, 'categories');
    const q = query(catRef, orderBy('name', 'asc'));
    
    const unsubscribe = onSnapshot(q, async (snap) => {
      const remoteCats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(remoteCats);

      if (snap.empty && isAdmin && remoteCats.length === 0) {
        const defaultCats = [
          { name: 'Infaq Jumat', type: 'income' },
          { name: 'Sedekah Subuh', type: 'income' },
          { name: 'Kotak Amal', type: 'income' },
          { name: 'Zakat/Wakaf', type: 'income' },
          { name: 'Listrik/Air', type: 'expense' },
          { name: 'Gaji Marbot', type: 'expense' },
          { name: 'Lain-lain', type: 'expense' }
        ];
        for (const cat of defaultCats) {
          try {
            await addDoc(collection(db, 'categories'), cat);
          } catch (e) {
            console.error("Failed to seed default categories", e);
          }
        }
      }
    }, (error) => {
      console.error("Category sync error:", error.message);
    });
    
    return unsubscribe;
  }, [isAdmin]);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const remoteData = snapshot.docs.map(doc => {
        const d = doc.data();
        return { 
          ...d, 
          id: doc.id,
          date: d.date || new Date().toISOString(),
        } as Transaction;
      });
      
      setTransactions(remoteData);
    }, (error) => {
      console.error("Transaction sync error:", error.message);
    });

    return () => unsubscribe();
  }, []);

  const stats = transactions.reduce((acc: { income: number; expense: number }, curr) => {
    if (curr.type === 'income') acc.income += curr.amount;
    else acc.expense += curr.amount;
    return acc;
  }, { income: 0, expense: 0 });

  const pieData = Object.entries(
    transactions
      .filter(t => t.type === 'expense')
      .reduce((acc: Record<string, number>, curr) => {
        const cat = curr.categoryName || 'Lainnya';
        if (cat) acc[cat] = (acc[cat] || 0) + curr.amount;
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

      <aside className={`fixed lg:relative z-[60] w-72 h-full bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
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
                <TrendingUp size={20} /> Dana
              </div>
            </nav>
          </div>

          <div className="mt-auto p-6 space-y-4">
            {profile && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 border border-slate-100">
                  {profile.photoURL ? (
                    <img src={profile.photoURL} alt="Profile" className="w-10 h-10 rounded-full bg-slate-300 ring-4 ring-white shadow-sm" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold ring-4 ring-white shadow-sm">
                      {profile.displayName?.charAt(0) || 'A'}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold truncate text-masjid-slate">{profile.displayName}</p>
                    <p className="text-[10px] text-slate-400 truncate uppercase tracking-widest font-bold">Pengelola</p>
                  </div>
                </div>
                <Button variant="ghost" className="w-full justify-start gap-3 h-12 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl font-bold transition-all" onClick={logout}>
                  <LogOut size={20} /> Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-10 overflow-y-auto bg-masjid-cream">
        <div className="max-w-6xl mx-auto space-y-6 lg:space-y-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-masjid-slate">
                {activeTab === 'overview' ? 'Dashboard Utama' : 
                 activeTab === 'history' ? 'Riwayat Transaksi' : 'Pengaturan Dana'}
              </h2>
              <p className="text-slate-400 text-xs lg:text-sm mt-1 uppercase tracking-wider font-medium">
                {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })}
              </p>
            </div>
            
            {isAdmin && activeTab !== 'categories' && (
              <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) setEditingTransaction(null); }}>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button onClick={() => openForm('income')} className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 h-10">
                    + Masuk
                  </Button>
                  <Button onClick={() => openForm('expense')} className="flex-1 md:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 h-10">
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
            )}
          </div>

          {activeTab === 'categories' && (
            <Card className="bento-card">
              <CardHeader>
                <CardTitle>Daftar Dana Masjid</CardTitle>
                <CardDescription>Kategori yang tersedia untuk memilah transaksi keuangan.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-emerald-700 mb-4 flex items-center gap-2">
                      <ArrowUpCircle size={18} /> Pemasukan
                    </h4>
                    <div className="space-y-2">
                      {categories.filter(c => c.type === 'income').map(c => (
                        <div key={c.id} className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                          <span className="font-bold text-emerald-900">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-700 mb-4 flex items-center gap-2">
                      <ArrowDownCircle size={18} /> Pengeluaran
                    </h4>
                    <div className="space-y-2">
                      {categories.filter(c => c.type === 'expense').map(c => (
                        <div key={c.id} className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                          <span className="font-bold text-orange-900">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bento-card gradient-green text-white flex flex-col justify-between py-6 shadow-xl shadow-emerald-100 min-h-[160px]">
                  <div>
                    <p className="text-[10px] font-semibold opacity-80 uppercase tracking-wider">Total Kas Masjid</p>
                    <h3 className="text-3xl font-bold mt-1">{formatCurrency(balance)}</h3>
                  </div>
                </div>
                <div className="bento-card flex flex-col justify-between py-6 bg-white border border-slate-100 min-h-[160px]">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Dana Masuk</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(stats.income)}</h3>
                  </div>
                </div>
                <div className="bento-card flex flex-col justify-between py-6 bg-white border border-slate-100 min-h-[160px]">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Dana Keluar</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(stats.expense)}</h3>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bento-card p-6 bg-white border border-slate-100 min-h-[480px]">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-bold text-lg text-masjid-slate">Transaksi Terakhir</h4>
                    <Button variant="ghost" size="sm" className="text-xs text-emerald-600 font-bold" onClick={() => setActiveTab('history')}>
                      Semua
                    </Button>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-none">
                          <TableHead className="uppercase text-[10px] font-black tracking-widest text-slate-300">Detail</TableHead>
                          <TableHead className="hidden md:table-cell uppercase text-[10px] font-black tracking-widest text-slate-300">Kategori</TableHead>
                          <TableHead className="text-right uppercase text-[10px] font-black tracking-widest text-slate-300">Nominal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.slice(0, 6).map((tx) => (
                          <TableRow key={tx.id} className="border-slate-50">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-bold text-masjid-slate">{tx.description}</span>
                                <span className="text-[10px] text-slate-400 md:hidden">{tx.categoryName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${tx.type === 'income' ? 'text-emerald-700 bg-emerald-50' : 'text-orange-700 bg-orange-50'}`}>
                                {tx.categoryName}
                              </span>
                            </TableCell>
                            <TableCell className={`text-right font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                              {formatCurrency(tx.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="lg:col-span-4 bento-card p-6 bg-white border border-slate-100 min-h-[480px] flex flex-col">
                  <h4 className="font-bold text-lg text-masjid-slate mb-6">Distribusi Dana</h4>
                  <div className="flex-1 min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius="60%" outerRadius="85%" paddingAngle={5} dataKey="value">
                          {pieData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={5} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(v: any) => formatCurrency(Number(v))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 space-y-2">
                    {pieData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-[11px] font-bold">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-slate-500">{item.name}</span>
                        </div>
                        <span className="text-slate-800">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <Card className="bento-card overflow-hidden">
               <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="font-bold">Data Keuangan Lengkap</CardTitle>
                <CardDescription>Transparansi pengelolaan dana umat</CardDescription>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tgl</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Nominal</TableHead>
                      {isAdmin && <TableHead className="text-right">Opsi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id} className="group">
                        <TableCell className="text-[10px] font-bold text-slate-400">{format(new Date(tx.date), 'dd/MM/yy')}</TableCell>
                        <TableCell className="font-bold text-masjid-slate">{tx.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={tx.type === 'income' ? 'bg-emerald-50 text-emerald-700 border-none' : 'bg-red-50 text-red-700 border-none'}>
                            {tx.categoryName}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-bold ${tx.type === 'income' ? 'text-emerald-700' : 'text-red-600'}`}>
                           {formatCurrency(tx.amount)}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(tx)}><Edit2 size={12} /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(tx.id)}><Trash2 size={12} /></Button>
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
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-masjid-cream">
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-masjid-emerald">
          <Wallet size={48} />
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" richColors />
      <AnimatePresence mode="wait">
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Dashboard />
        </motion.div>
      </AnimatePresence>
    </>
  );
}
