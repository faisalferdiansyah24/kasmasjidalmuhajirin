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
import { db, handleFirestoreError, OperationType, localDb, isLocalMode } from '../lib/firebase.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Button } from './ui/button.tsx';
import { Input } from './ui/input.tsx';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select.tsx';
import { Label } from './ui/label.tsx';
import { toast } from 'sonner';
import { Transaction, Category, TransactionType } from '../types.ts';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Jumlah harus positif'),
  categoryName: z.string().min(1, 'Pilih atau ketik kategori'),
  description: z.string().min(3, 'Deskripsi minimal 3 karakter'),
  date: z.string().min(1, 'Pilih tanggal'),
});

type TransactionValues = z.infer<typeof transactionSchema>;

interface Props {
  editingTransaction?: Transaction | null;
  initialType?: TransactionType;
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const TransactionForm: React.FC<Props> = ({ editingTransaction, initialType, categories, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: editingTransaction ? {
      type: editingTransaction.type,
      amount: editingTransaction.amount,
      categoryName: editingTransaction.categoryName,
      description: editingTransaction.description,
      date: format(new Date(editingTransaction.date), 'yyyy-MM-dd'),
    } : {
      type: initialType || 'income',
      amount: 0,
      categoryName: '',
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
        categoryName: editingTransaction.categoryName,
        description: editingTransaction.description,
        date: format(new Date(editingTransaction.date), 'yyyy-MM-dd'),
      });
    } else if (initialType) {
      reset({
        type: initialType,
        amount: 0,
        categoryName: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
    }
  }, [editingTransaction, initialType, reset]);

  const onSubmit = async (values: any) => {
    const data = values as TransactionValues;
    if (!user) return;
    setLoading(true);
    const local = isLocalMode();

    try {
      // Find if category already exists
      let category = categories.find(c => c.name.toLowerCase() === data.categoryName.toLowerCase() && c.type === data.type);
      let categoryId = category?.id || '';
      let finalCategoryName = data.categoryName;

      // If it doesn't exist, create it automatically
      if (!categoryId) {
        if (local) {
          const localCat = localDb.saveCategory({ name: data.categoryName, type: data.type });
          categoryId = localCat.id;
        } else {
          try {
            const newCatRef = await addDoc(collection(db, 'categories'), {
              name: data.categoryName,
              type: data.type,
              createdAt: serverTimestamp()
            });
            categoryId = newCatRef.id;
          } catch (e) {
            console.error("Failed to create new category record, using local/temporary ID", e);
            const localCat = localDb.saveCategory({ name: data.categoryName, type: data.type });
            categoryId = localCat.id;
          }
        }
      }

      const transactionData = {
        type: data.type,
        amount: data.amount,
        categoryId,
        categoryName: finalCategoryName,
        description: data.description,
        date: data.date,
        updatedAt: serverTimestamp(),
      };

      if (local) {
        localDb.saveTransaction({
          ...transactionData,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          date: data.date || new Date().toISOString(),
        });
        toast.success('Transaksi disimpan (Mode Lokal)');
      } else {
        try {
          if (editingTransaction) {
            const docRef = doc(db, 'transactions', editingTransaction.id);
            await updateDoc(docRef, transactionData);
            toast.success('Transaksi berhasil diperbarui');
          } else {
            try {
              await addDoc(collection(db, 'transactions'), {
                ...transactionData,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
              });
              toast.success('Transaksi berhasil ditambahkan');
            } catch (e: any) {
              console.warn("Firestore save failed, using local storage fallback", e.message);
              localDb.saveTransaction({
                ...transactionData,
                createdBy: user.uid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              });
              toast.warning('Tersimpan di penyimpanan lokal browser (Cloud Offline)');
            }
          }
        } catch (e) {
          handleFirestoreError(e, editingTransaction ? OperationType.UPDATE : OperationType.CREATE, 'transactions');
        }
      }
      onSuccess();
      reset();
    } catch (e) {
      console.error("Generic form error:", e);
      toast.error('Gagal memproses transaksi');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = watch('type');
  const filteredCategories = categories.filter(c => c.type === selectedType);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Jenis</Label>
          <Select 
            onValueChange={(v) => setValue('type', v as any)} 
            value={watch('type')}
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
        <div className="relative">
          <Input 
            placeholder="Pilih atau ketik kategori baru..." 
            list="category-suggestions"
            {...register('categoryName')}
            className="pr-10"
          />
          <datalist id="category-suggestions">
            {filteredCategories.map(c => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        </div>
        {errors.categoryName && <p className="text-xs text-red-500">{errors.categoryName.message}</p>}
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
