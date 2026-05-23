import { create } from 'zustand';
import api from '../lib/axios';

export interface FieldType {
  name: string;
  type: string;
  required?: boolean;
  options?: string[];
  label?: Record<string, string>;
}

export interface EntityType {
  name: string;
  tableName?: string;
  fields: FieldType[];
}

export interface AppConfigType {
  appName: string;
  entities: EntityType[];
}

interface ConfigState {
  config: AppConfigType | null;
  loading: boolean;
  error: string | null;
  fetchConfig: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: null,
  loading: false,
  error: null,
  fetchConfig: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/config');
      set({ config: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
}));
