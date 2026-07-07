import type {
  Accessory,
  BodyExtra,
  CloudShape,
  Creature,
  CreatureTrait,
  EyeStyle,
  MouthStyle,
  Point,
} from './types';

const names = [
  'Pufflo',
  'Nimbus Bean',
  'Sir Fluffington',
  'Cloudbert',
  'Misty Moo',
  'Wobblepuff',
  'Dewdrop Pip',
  'Captain Cumulus',
  'Marshmallow Gale',
  'Bumblemist',
  'Pompom Drizzle',
  'Lady Whisp',
];

const moods = ['Dreamy', 'Curious', 'Sleepy', 'Giggly', 'Brave', 'Bashful', 'Floaty'];
const eyeStyles: EyeStyle[] = ['sleepy', 'happy', 'surprised', 'tiny', 'big'];
const mouthStyles: MouthStyle[] = ['smile', 'o', 'sleepy', 'grin'];
const accessories: Accessory[] = ['antennae', 'bow', 'crown', 'halo', 'horns', 'none'];

function hashCloud(points: Point[]) {
  let hash = 2166136261;

  for (const point of points) {
    const chunk = `${Math.round(point.x)}:${Math.round(point.y)}:${Math.round(point.radius)};`;

    for (let index = 0; index < chunk.length; index += 1) {
      hash ^= chunk.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
  }

  return hash >>> 0;
}

function createRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: T[], random: () => number) {
  return items[Math.floor(random() * items.length)] ?? items[0];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function analyzeCloud(points: Point[]): CloudShape {
  const bounds = points.reduce(
    (next, point) => ({
      minX: Math.min(next.minX, point.x - point.radius),
      minY: Math.min(next.minY, point.y - point.radius),
      maxX: Math.max(next.maxX, point.x + point.radius),
      maxY: Math.max(next.maxY, point.y + point.radius),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );

  const width = Math.max(1, bounds.maxX - bounds.minX);
  const height = Math.max(1, bounds.maxY - bounds.minY);
  const centerX = bounds.minX + width / 2;
  const centerY = bounds.minY + height / 2;
  const area = points.reduce((sum, point) => sum + Math.PI * point.radius * point.radius * 0.48, 0);
  const averageDistance =
    points.reduce((sum, point) => {
      const xDistance = Math.abs(point.x - centerX) / width;
      const yDistance = Math.abs(point.y - centerY) / height;
      return sum + Math.hypot(xDistance, yDistance);
    }, 0) / Math.max(points.length, 1);
  const roughness = clamp(averageDistance + points.length / 420, 0, 1);

  return {
    points,
    bounds,
    width,
    height,
    area,
    roughness,
    seed: hashCloud(points),
  };
}

function getSize(shape: CloudShape) {
  const footprint = shape.width * shape.height;

  if (footprint < 16000) {
    return 'Pocket puff';
  }

  if (footprint > 76000 || shape.area > 120000) {
    return 'Gentle giant';
  }

  if (shape.width > shape.height * 1.45) {
    return 'Wide drifter';
  }

  if (shape.height > shape.width * 1.18) {
    return 'Tall floof';
  }

  return 'Cozy cloudling';
}

function addTrait(traits: CreatureTrait[], type: CreatureTrait['type'], label: string) {
  traits.push({ type, label });
}

export function createCreatureFromPoints(points: Point[]): Creature {
  const shape = analyzeCloud(points);
  const random = createRandom(shape.seed);
  const ratio = shape.width / Math.max(shape.height, 1);
  const traits: CreatureTrait[] = [];
  const extras: BodyExtra[] = [];
  let accessory = pick(accessories, random);

  if (ratio > 1.45) {
    extras.push(random() > 0.42 ? 'wings' : 'many-legs');
    addTrait(traits, 'body', ratio > 1.9 ? 'extra-wide sky glider' : 'wide little wanderer');
  } else if (shape.height > shape.width * 1.18) {
    accessory = random() > 0.35 ? 'antennae' : 'halo';
    addTrait(traits, 'body', 'tall wispy silhouette');
  }

  if (shape.area > 110000) {
    addTrait(traits, 'personality', 'sleepy giant energy');
  } else if (shape.area < 22000) {
    addTrait(traits, 'personality', 'tiny brave puff');
  } else {
    addTrait(traits, 'personality', 'calm drifting spirit');
  }

  if (shape.roughness > 0.55) {
    extras.push(random() > 0.5 ? 'sparkles' : 'tail');
    addTrait(traits, 'movement', 'wobbly asymmetric float');
  } else {
    addTrait(traits, 'movement', 'smooth sleepy bob');
  }

  if (random() > 0.7) {
    extras.push('raindrops');
    addTrait(traits, 'weather', 'keeps tiny rain charms');
  }

  if (extras.length === 0) {
    extras.push(random() > 0.55 ? 'legs' : 'sparkles');
  }

  const eyes = shape.area > 110000 ? 'sleepy' : pick(eyeStyles, random);
  const mouth = eyes === 'surprised' ? 'o' : shape.area > 110000 ? 'sleepy' : pick(mouthStyles, random);

  addTrait(traits, 'face', `${eyes} eyes`);

  if (accessory !== 'none') {
    addTrait(traits, 'accessory', accessory);
  }

  return {
    id: `cloud-${shape.seed.toString(36)}-${Date.now().toString(36)}`,
    name: pick(names, random),
    mood: pick(moods, random),
    traits,
    size: getSize(shape),
    shape,
    features: {
      eyes,
      mouth,
      accessory,
      extras: Array.from(new Set(extras)).slice(0, 3),
      blush: random() > 0.35,
      asymmetry: shape.roughness > 0.5 ? random() * 10 - 5 : random() * 4 - 2,
    },
  };
}
