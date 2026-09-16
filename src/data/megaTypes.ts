/** Shared types for mega outfit catalogs (core + full). */

export type MegaIntensity = 'soft' | 'hard';
export type MegaIrl = 'home' | 'out' | 'work' | 'public' | 'alone';
export type MegaTheme =
  | 'bdsm'
  | 'clothing'
  | 'sex'
  | 'irl'
  | 'porn'
  | 'anime'
  | 'hentai'
  | 'fantasy';

export type MegaSituation =
  | 'fest'
  | 'traening'
  | 'sex'
  | 'bdsm'
  | 'gaatur'
  | 'bytur'
  | 'familie'
  | 'bil'
  | 'handel'
  | 'hjemme'
  | 'gaming'
  | 'kontor'
  | 'date'
  | 'weekend'
  | 'morgen';

export type MegaAesthetic = 'irl' | 'porn' | 'anime' | 'fantasy' | 'hentai';

export interface MegaOutfit {
  id: string;
  nameDa: string;
  situation: MegaSituation;
  aesthetic: MegaAesthetic;
  intensity: MegaIntensity;
  variant: string;
  tags: string[];
  themes: MegaTheme[];
  irlBias: MegaIrl[];
  roleHint: string;
  undertøj: string;
  ydre_lag: string;
  sko_accessories: string;
  orderBlurbDa: string;
  gamingGod: string;
  gamingDaarlig: string;
  weight: number;
}
