import { isAuthConfigured, isAuthenticated, setCorsHeaders, type ApiRequest, type ApiResponse } from './_auth';

interface CloudMetrics {
  width: number;
  height: number;
  area: number;
  roughness: number;
  pointCount: number;
  size: string;
  seed: number;
}

const defaultModel = process.env.OPENAI_MODEL ?? 'gpt-5.5';

const creatureSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'mood', 'traits', 'eyes', 'mouth', 'accessory', 'extras', 'blush'],
  properties: {
    name: {
      type: 'string',
    },
    mood: {
      type: 'string',
    },
    traits: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
    eyes: {
      type: 'string',
      enum: ['sleepy', 'happy', 'surprised', 'tiny', 'big'],
    },
    mouth: {
      type: 'string',
      enum: ['smile', 'o', 'sleepy', 'grin'],
    },
    accessory: {
      type: 'string',
      enum: ['antennae', 'bow', 'crown', 'halo', 'horns', 'none'],
    },
    extras: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['wings', 'legs', 'many-legs', 'tail', 'raindrops', 'sparkles'],
      },
    },
    blush: {
      type: 'boolean',
    },
  },
};

function isMetric(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function readMetrics(body: unknown): CloudMetrics | null {
  if (!body || typeof body !== 'object' || !('metrics' in body)) {
    return null;
  }

  const metrics = (body as { metrics: Record<string, unknown> }).metrics;

  if (
    !isMetric(metrics.width) ||
    !isMetric(metrics.height) ||
    !isMetric(metrics.area) ||
    !isMetric(metrics.roughness) ||
    !isMetric(metrics.pointCount) ||
    !isMetric(metrics.seed) ||
    typeof metrics.size !== 'string'
  ) {
    return null;
  }

  return {
    width: Math.round(metrics.width),
    height: Math.round(metrics.height),
    area: Math.round(metrics.area),
    roughness: Number(metrics.roughness.toFixed(3)),
    pointCount: Math.round(metrics.pointCount),
    size: metrics.size.slice(0, 40),
    seed: Math.round(metrics.seed),
  };
}

function extractOutputText(responseBody: unknown) {
  if (!responseBody || typeof responseBody !== 'object') {
    return '';
  }

  if ('output_text' in responseBody && typeof responseBody.output_text === 'string') {
    return responseBody.output_text;
  }

  const output = (responseBody as { output?: unknown }).output;

  if (!Array.isArray(output)) {
    return '';
  }

  for (const item of output) {
    if (!item || typeof item !== 'object' || !('content' in item)) {
      continue;
    }

    const content = (item as { content?: unknown }).content;

    if (!Array.isArray(content)) {
      continue;
    }

    for (const contentItem of content) {
      if (contentItem && typeof contentItem === 'object' && 'text' in contentItem) {
        const text = (contentItem as { text?: unknown }).text;

        if (typeof text === 'string') {
          return text;
        }
      }
    }
  }

  return '';
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  setCorsHeaders(response);

  if (request.method === 'OPTIONS') {
    response.status(204).json({});
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isAuthConfigured()) {
    response.status(503).json({ error: 'App passcode is not configured' });
    return;
  }

  if (!isAuthenticated(request)) {
    response.status(401).json({ error: 'Authentication required' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    response.status(503).json({ error: 'OpenAI API key is not configured' });
    return;
  }

  const metrics = readMetrics(request.body);

  if (!metrics) {
    response.status(400).json({ error: 'Invalid cloud metrics' });
    return;
  }

  const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: defaultModel,
      input: [
        {
          role: 'system',
          content:
            'You name cute cloud creatures for a cozy drawing toy. Return playful, child-friendly, concise JSON only.',
        },
        {
          role: 'user',
          content: `Create one whimsical creature concept from these deterministic cloud metrics: ${JSON.stringify(metrics)}. Make the result feel matched to the shape.`,
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'cloud_creature',
          strict: true,
          schema: creatureSchema,
        },
      },
    }),
  });

  const responseBody = await openAiResponse.json();

  if (!openAiResponse.ok) {
    response.status(openAiResponse.status).json({ error: 'OpenAI request failed' });
    return;
  }

  const outputText = extractOutputText(responseBody);

  if (!outputText) {
    response.status(502).json({ error: 'OpenAI response did not include text output' });
    return;
  }

  response.status(200).json(JSON.parse(outputText));
}
