import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'
import { openDB } from 'idb'

// Custom IndexedDB storage for Zustand
let dbPromise: Promise<any> | null = null;
const getDB = () => {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB('krishisetu-records-db', 1, {
      upgrade(db) {
        db.createObjectStore('keyval')
      },
    });
  }
  return dbPromise;
}

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const db = getDB();
    if (!db) return null;
    return (await db).get('keyval', name) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    const db = getDB();
    if (!db) return;
    await (await db).put('keyval', value, name)
  },
  removeItem: async (name: string): Promise<void> => {
    const db = getDB();
    if (!db) return;
    await (await db).delete('keyval', name)
  },
}

export interface CropRecord {
  id?: string;
  local_id: string; // Used for offline tracking before sync
  crop_name: string;
  variety: string;
  area: number;
  sowing_date: string;
  status: string;
  sync_status: 'PENDING' | 'SYNCED' | 'FAILED';
}

export interface ReceiptRecord {
  id?: string;
  local_id: string;
  market: string;
  commodity: string;
  variety?: string;
  quantity: number;
  unit: string;
  price_per_unit: number;
  gross_amount?: number;
  commission?: number;
  deductions?: number;
  net_amount: number;
  receipt_date?: string;
  farmer_name?: string;
  receipt_number?: string;
  vehicle_number?: string;
  image_url?: string;
  confidence?: number;
  sync_status: 'PENDING' | 'SYNCED' | 'FAILED';
  created_at: string;
}

interface RecordsState {
  crops: CropRecord[];
  receipts: ReceiptRecord[];
  addCrop: (crop: Omit<CropRecord, 'sync_status' | 'local_id'>) => void;
  markCropSynced: (local_id: string, server_id: string) => void;
  addReceipt: (receipt: Omit<ReceiptRecord, 'sync_status' | 'local_id' | 'created_at'>) => void;
  markReceiptSynced: (local_id: string, server_id: string) => void;
}

export const useRecordsStore = create<RecordsState>()(
  persist(
    (set) => ({
      crops: [],
      receipts: [],
      addCrop: (crop) => 
        set((state) => ({
          crops: [...state.crops, { ...crop, local_id: crypto.randomUUID(), sync_status: 'PENDING' }]
        })),
      markCropSynced: (local_id, server_id) =>
        set((state) => ({
          crops: state.crops.map(c => 
            c.local_id === local_id ? { ...c, id: server_id, sync_status: 'SYNCED' } : c
          )
        })),
      addReceipt: (receipt) =>
        set((state) => ({
          receipts: [
            ...(state.receipts || []),
            {
              ...receipt,
              local_id: crypto.randomUUID(),
              sync_status: 'PENDING',
              created_at: new Date().toISOString()
            }
          ]
        })),
      markReceiptSynced: (local_id, server_id) =>
        set((state) => ({
          receipts: (state.receipts || []).map(r =>
            r.local_id === local_id ? { ...r, id: server_id, sync_status: 'SYNCED' } : r
          )
        }))
    }),
    {
      name: 'krishisetu-records',
      storage: createJSONStorage(() => idbStorage),
    }
  )
)

