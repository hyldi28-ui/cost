import { create } from 'zustand';
import type { DashboardStore, FilterState } from '../types';

const initialFilterState: FilterState = {
  primaryRange: { start: '2025-01', end: '2025-02' },
  compareRange: null,
  accounts: null,
  platforms: null,
  categories: null,
};

export const useDashboardStore = create<DashboardStore>((set) => ({
  records: [],
  filterState: { ...initialFilterState },
  theme: 'light',
  isLoading: false,

  setRecords: (records) => set({ records }),

  setFilterState: (patch) =>
    set((state) => ({
      filterState: { ...state.filterState, ...patch },
    })),

  resetFilter: () => set({ filterState: { ...initialFilterState } }),

  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light',
    })),

  setLoading: (v) => set({ isLoading: v }),
}));
