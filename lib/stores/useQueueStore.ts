import { create } from 'zustand';

interface QueueItem {
  id: string;
  customerName: string;
  service: string;
  professional: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  timestamp: Date;
  priority: number;
}

interface QueueState {
  items: QueueItem[];
  activeItem: QueueItem | null;
  isLoading: boolean;
  addItem: (item: Omit<QueueItem, 'id' | 'timestamp'>) => void;
  removeItem: (id: string) => void;
  updateItemStatus: (id: string, status: QueueItem['status']) => void;
  setActiveItem: (item: QueueItem | null) => void;
  setLoading: (loading: boolean) => void;
  clearQueue: () => void;
}

export const useQueueStore = create<QueueState>()((set, get) => ({
  items: [],
  activeItem: null,
  isLoading: false,
  addItem: (item) => {
    const newItem: QueueItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    set((state) => ({
      items: [...state.items, newItem].sort((a, b) => b.priority - a.priority),
    }));
  },
  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },
  updateItemStatus: (id, status) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    }));
  },
  setActiveItem: (item) => set({ activeItem: item }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearQueue: () => set({ items: [], activeItem: null }),
}));
