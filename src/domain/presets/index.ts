import type { EventBody } from '../events';
import type { Preset } from '../types';
import classic from './classic.json';

export const presets: Preset[] = [classic];

export const getPreset = (id: string): Preset | undefined => presets.find((preset) => preset.id === id);

export const presetLoaded = (preset: Preset): EventBody => ({
  type: 'preset.loaded',
  presetId: preset.id,
  roles: preset.roles,
  phases: preset.phases,
});
