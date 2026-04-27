import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  getDocs, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Transaction, Category, TransactionType } from '../types';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Jumlah harus positif'),
  categoryId: z.string().min(1, 'Pilih kategori'),
  description: z.string().min(3, 'Deskripsi minimal 3 karakter'),
  date: z.string().min(1, 'Pilih tanggal'),
});

type TransactionValues = z.infer<typeof transactionSchema>;

interface Props {
  editingTransaction?: Transaction | null;
  initialType?: TransactionType;
  onSuccess: () => void;
  onCancel: () => void;
}

export const TransactionForm: React.FC<Props> = ({ editingTransaction, initialType, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: editingTransaction ? {
      type: editingTransaction.type,
      amount: editingTransaction.amount,
      categoryId: editingTransaction.categoryId,
      description: editingTransaction.description,
      date: format(new Date(editingTransaction.date), 'yyyy-MM-dd'),
    } : {
      type: initialType || 'income',
      amount: 0,
      categoryId: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    }
  });

  // Keep form in sync with props when they change
  useEffect(() => {
    if (editingTransaction) {
      reset({
        type: editingTransaction.type,
        amount: editingTransaction.amount,
        categoryId: editingTransaction.categoryId,
        description: editingTransaction.description,
        date: format(new Date(editingTransaction.date), 'yyyy-MM-dd'),
      });
    } else if (initialType) {
      reset({
        type: initialType,
        amount: 0,
        categoryId: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
    }
  }, [editingTransaction, initialType, reset]);

  const selectedType = watch('type');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'categories'), orderBy('name', 'asc'));
        const snap = await getDocs(q);
        setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
      } catch (e) {
        console.error(e);
      }
    };
    fetchCategories();
  }, []);

  const onSubmit = async (values: any) => {
    const data = values as TransactionValues;
    if (!user) return;
    setLoading(true);

    const category = categories.find(c => c.id === data.categoryId);
    const categoryName = category?.name || '';

    try {
      if (editingTransaction) {
        const docRef = doc(db, 'transactions', editingTransaction.id);
        await updateDoc(docRef, {
          ...data,
          categoryName,
          updatedAt: serverTimestamp(),
        });
        toast.success('Transaksi berhasil diperbarui');
      } else {
        await addDoc(collection(db, 'transactions'), {
          ...data,
          categoryName,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        toast.success('Transaksi berhasil ditambahkan');
      }
      onSuccess();
      reset();
    } catch (e) {
      handleFirestoreError(e, editingTransaction ? OperationType.UPDATE : OperationType.CREATE, 'transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => c.type === selectedType);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Jenis</Label>
          <Select 
            onValueChange={(v) => setValue('type', v as any)} 
            defaultValue={watch('type')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Pemasukan (Masuk)</SelectItem>
              <SelectItem value="expense">Pengeluaran (Keluar)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tanggal</Label>
          <Input type="date" {...register('date')} />
          {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Kategori</Label>
        <Select 
          onValueChange={(v) => setValue('categoryId', v)} 
          defaultValue={watch('categoryId')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih Kategori" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.length === 0 ? (
              <div className="p-4 text-xs text-slate-400 text-center">
                Memuat kategori... <br/>
                (Pastikan Anda sudah masuk sebagai Admin)
              </div>
            ) : (
              filteredCategories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Jumlah (Rp)</Label>
        <Input type="number" placeholder="Contoh: 100000" {...register('amount', { valueAsNumber: true })} />
        {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Keterangan</Label>
        <Input placeholder="Keterangan transaksi..." {...register('description')} />
        {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>Batal</Button>
        <Button type="submit" disabled={loading} className="bg-masjid-emerald hover:bg-masjid-emerald/90">
          {loading ? 'Menyimpan...' : (editingTransaction ? 'Simpan Perubahan' : 'Tambah Transaksi')}
        </Button>
      </div>
    </form>
  );
};
