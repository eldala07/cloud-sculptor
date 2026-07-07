import { analyzeCloud, createCreatureFromPoints } from './generator';
import type {
  Accessory,
  BodyExtra,
  Creature,
  CreatureTrait,
  EyeStyle,
  MouthStyle,
  Point,
} from './types';

interface AiCreatureSuggestion {
  name: string;
  mood: string;
  traits: string[];
  eyes: EyeStyle;
  mouth: MouthStyle;
  accessory: Accessory;
  extras: BodyExtra[];
  blush: boolean;
}

export interface CreatureGenerationResult {
  creature: Creature;
  source: 'ai' | 'procedural';
}

const eyeStyles: EyeStyle[] = ['sleepy', 'happy', 'surprised', 'tiny', 'big'];
const mouthStyles: MouthStyle[] = ['smile', 'o', 'sleepy', 'grin'];
const accessories: Accessory[] = ['antennae', 'bow', 'crown', 'halo', 'horns', 'none'];
const bodyExtras: BodyExtra[] = ['wings', 'legs', 'many-legs', 'tail', 'raindrops', 'sparkles'];

function isInList<T extends string>(value: unknown, list: T[]): value is T {
  return typeof value === 'string' && list.includes(value as T);
}

function normalizeSuggestion(value: unknown): AiCreatureSuggestion | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const suggestion = value as Record<string, unknown>;
  const extras = Array.isArray(suggestion.extras)
    ? suggestion.extras.filter((extra) => isInList(extra, bodyExtras)).slice(0, 3)
    : [];

  if (
    typeof suggestion.name !== 'string' ||
    typeof suggestion.mood !== 'string' ||
    !Array.isArray(suggestion.traits) ||
    !isInList(suggestion.eyes, eyeStyles) ||
    !isInList(suggestion.mouth, mouthStyles) ||
    !isInList(suggestion.accessory, accessories) ||
    typeof suggestion.blush !== 'boolean' ||
    extras.length === 0
  ) {
    return null;
  }

  return {
    name: suggestion.name.trim().slice(0, 32),
    mood: suggestion.mood.trim().slice(0, 24),
    traits: suggestion.traits
      .filter((trait): trait is string => typeof trait === 'string')
      .map((trait) => trait.trim().slice(0, 34))
      .filter(Boolean)
      .slice(0, 5),
    eyes: suggestion.eyes,
    mouth: suggestion.mouth,
    accessory: suggestion.accessory,
    extras,
    blush: suggestion.blush,
  };
}

function toTraits(suggestion: AiCreatureSuggestion, fallbackTraits: CreatureTrait[]): CreatureTrait[] {
  const aiTraits = suggestion.traits.map((label): CreatureTrait => ({ type: 'personality', label }));
  const faceTrait: CreatureTrait = { type: 'face', label: `${suggestion.eyes} eyes` };
  const accessoryTrait: CreatureTrait | null =
    suggestion.accessory === 'none' ? null : { type: 'accessory', label: suggestion.accessory };

  return [...aiTraits, faceTrait, accessoryTrait].filter((trait): trait is CreatureTrait => Boolean(trait)).slice(0, 6)
    || fallbackTraits;
}

export async function createCreatureWithAi(points: Point[]): Promise<CreatureGenerationResult> {
  const baseCreature = createCreatureFromPoints(points);
  const shape = analyzeCloud(points);

  try {
    const response = await fetch('/api/generate-creature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metrics: {
          width: shape.width,
          height: shape.height,
          area: shape.area,
          roughness: shape.roughness,
          pointCount: points.length,
          size: baseCreature.size,
          seed: shape.seed,
        },
      }),
    });

    if (!response.ok) {
      return { creature: baseCreature, source: 'procedural' };
    }

    const suggestion = normalizeSuggestion(await response.json());

    if (!suggestion) {
      return { creature: baseCreature, source: 'procedural' };
    }

    return {
      source: 'ai',
      creature: {
        ...baseCreature,
        name: suggestion.name || baseCreature.name,
        mood: suggestion.mood || baseCreature.mood,
        traits: toTraits(suggestion, baseCreature.traits),
        features: {
          ...baseCreature.features,
          eyes: suggestion.eyes,
          mouth: suggestion.mouth,
          accessory: suggestion.accessory,
          extras: suggestion.extras,
          blush: suggestion.blush,
        },
      },
    };
  } catch {
    return { creature: baseCreature, source: 'procedural' };
  }
}
