export interface Point {
  x: number;
  y: number;
  radius: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface CloudShape {
  points: Point[];
  bounds: Bounds;
  width: number;
  height: number;
  area: number;
  roughness: number;
  seed: number;
}

export type TraitType =
  | 'face'
  | 'accessory'
  | 'movement'
  | 'body'
  | 'weather'
  | 'personality';

export interface CreatureTrait {
  type: TraitType;
  label: string;
}

export type EyeStyle = 'sleepy' | 'happy' | 'surprised' | 'tiny' | 'big';
export type MouthStyle = 'smile' | 'o' | 'sleepy' | 'grin';
export type Accessory = 'antennae' | 'bow' | 'crown' | 'halo' | 'horns' | 'none';
export type BodyExtra = 'wings' | 'legs' | 'many-legs' | 'tail' | 'raindrops' | 'sparkles';
export type GenerationSource = 'ai' | 'procedural';

export interface CreatureFeatures {
  eyes: EyeStyle;
  mouth: MouthStyle;
  accessory: Accessory;
  extras: BodyExtra[];
  blush: boolean;
  asymmetry: number;
}

export interface Creature {
  id: string;
  name: string;
  mood: string;
  traits: CreatureTrait[];
  size: string;
  shape: CloudShape;
  features: CreatureFeatures;
}

export interface SavedCreature extends Creature {
  savedAt: string;
  generationSource?: GenerationSource;
}
