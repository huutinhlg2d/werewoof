import type { Preset } from '../types';
import classic from './classic.json';

export const presets: Preset[] = [classic];

export const getPreset = (id: string): Preset | undefined => presets.find((preset) => preset.id === id);
