import { en } from './en';
import { es } from './es';
import { fr } from './fr';

export const dictionaries: Record<string, typeof en> = {
  en,
  es,
  fr,
};

export type Dictionary = typeof en;
export type DictionaryPath = string; // Using simple string access for now

// Helper function to resolve dot notation paths
export function resolvePath(obj: any, path: string): string {
  return path.split('.').reduce((prev, curr) => {
    return prev ? prev[curr] : null;
  }, obj) as string || path;
}
