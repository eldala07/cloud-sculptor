import { analyzeCloud, createCreatureFromPoints } from './generator';
import type { Creature, GenerationSource, Point } from './types';

export interface CreatureGenerationResult {
  creature: Creature;
  source: GenerationSource;
  note?: string;
}

interface AiImageResponse {
  imageDataUrl?: unknown;
  imagePrompt?: unknown;
  imageModel?: unknown;
}

function samplePoints(points: Point[]) {
  const step = Math.max(1, Math.floor(points.length / 28));

  return points
    .filter((_, index) => index % step === 0)
    .slice(0, 28)
    .map((point) => ({
      x: Number(point.x.toFixed(2)),
      y: Number(point.y.toFixed(2)),
      radius: Math.round(point.radius),
    }));
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
        pointSample: samplePoints(points),
      }),
    });

    if (!response.ok) {
      const errorText = await readError(response);
      return {
        creature: baseCreature,
        source: 'procedural',
        note: errorText || 'AI generation was unavailable, so local generation was used.',
      };
    }

    const imageResponse = (await response.json()) as AiImageResponse;

    if (typeof imageResponse.imageDataUrl !== 'string') {
      return {
        creature: baseCreature,
        source: 'procedural',
        note: 'AI did not return an image, so local generation was used.',
      };
    }

    return {
      source: 'ai-image',
      creature: {
        ...baseCreature,
        generatedImage: {
          dataUrl: imageResponse.imageDataUrl,
          prompt: typeof imageResponse.imagePrompt === 'string' ? imageResponse.imagePrompt : '',
          model: typeof imageResponse.imageModel === 'string' ? imageResponse.imageModel : 'gpt-image-1',
        },
      },
    };
  } catch {
    return {
      creature: baseCreature,
      source: 'procedural',
      note: 'The AI endpoint could not be reached, so local generation was used.',
    };
  }
}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown };

    if (typeof body.error === 'string') {
      return body.error;
    }
  } catch {
    return '';
  }

  return '';
}
