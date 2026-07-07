import { isAuthConfigured, isAuthenticated, setCorsHeaders, type ApiRequest, type ApiResponse } from './_auth.js';

interface CloudMetrics {
  width: number;
  height: number;
  area: number;
  roughness: number;
  pointCount: number;
  size: string;
  seed: number;
}

interface CloudPointSample {
  x: number;
  y: number;
  radius: number;
}

const defaultImageModel = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1';
const defaultImageQuality = process.env.OPENAI_IMAGE_QUALITY ?? 'low';
const defaultImageSize = process.env.OPENAI_IMAGE_SIZE ?? '1024x1024';
const defaultOutputFormat = process.env.OPENAI_IMAGE_FORMAT ?? 'png';

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

function readPointSample(body: unknown): CloudPointSample[] {
  if (!body || typeof body !== 'object' || !('pointSample' in body)) {
    return [];
  }

  const pointSample = (body as { pointSample?: unknown }).pointSample;

  if (!Array.isArray(pointSample)) {
    return [];
  }

  return pointSample
    .filter((point): point is CloudPointSample => {
      if (!point || typeof point !== 'object') {
        return false;
      }

      const candidate = point as Record<string, unknown>;
      return isMetric(candidate.x) && isMetric(candidate.y) && isMetric(candidate.radius);
    })
    .map((point) => ({
      x: Number(point.x.toFixed(2)),
      y: Number(point.y.toFixed(2)),
      radius: Math.round(point.radius),
    }))
    .slice(0, 28);
}

function readCloudImage(body: unknown) {
  if (!body || typeof body !== 'object' || !('cloudImageDataUrl' in body)) {
    return null;
  }

  const dataUrl = (body as { cloudImageDataUrl?: unknown }).cloudImageDataUrl;

  if (typeof dataUrl !== 'string') {
    return null;
  }

  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([a-zA-Z0-9+/=]+)$/);

  if (!match) {
    return null;
  }

  return {
    mediaType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

async function readJsonResponse(response: Response) {
  const bodyText = await response.text();

  if (!bodyText) {
    return null;
  }

  try {
    return JSON.parse(bodyText) as unknown;
  } catch {
    return null;
  }
}

function readOpenAiError(responseBody: unknown) {
  if (!responseBody || typeof responseBody !== 'object' || !('error' in responseBody)) {
    return 'OpenAI image request failed';
  }

  const error = (responseBody as { error?: unknown }).error;

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : 'OpenAI image request failed';
  }

  return typeof error === 'string' ? error : 'OpenAI image request failed';
}

function extractGeneratedImage(responseBody: unknown) {
  if (!responseBody || typeof responseBody !== 'object' || !('data' in responseBody)) {
    return '';
  }

  const data = (responseBody as { data?: unknown }).data;

  if (!Array.isArray(data)) {
    return '';
  }

  const firstImage = data.find((item) => item && typeof item === 'object' && 'b64_json' in item) as
    | { b64_json?: unknown }
    | undefined;

  return typeof firstImage?.b64_json === 'string' ? firstImage.b64_json : '';
}

function buildImagePrompt(metrics: CloudMetrics, pointSample: CloudPointSample[]) {
  const aspect = metrics.width > metrics.height * 1.35 ? 'wide horizontal' : metrics.height > metrics.width * 1.2 ? 'tall vertical' : 'rounded';
  const texture = metrics.roughness > 0.55 ? 'lumpy and asymmetrical' : 'smooth and soft';

  return [
    'Edit the provided input image into a single adorable floating cloud creature.',
    'Style: kawaii pastel sticker illustration, chibi proportions, fluffy white cloud body, big cute expressive eyes, tiny mouth, soft blush, rounded simplified shapes, polished and magical.',
    'Do not make it photorealistic, cinematic, realistic, scary, detailed fantasy concept art, or 3D rendered. Keep it flat-to-soft illustrated and toy-like.',
    'Use the input cloud drawing as the source silhouette. Preserve its overall outline, proportions, lumpy blob placement, and orientation.',
    'Add eyes, mouth, and a few small creature details inside or just around that silhouette. Do not replace it with an unrelated creature.',
    'Keep a transparent background. Do not add text, labels, signatures, UI, frames, or a landscape.',
    `Shape: ${aspect}, ${texture}, ${metrics.size}, width ${metrics.width}px, height ${metrics.height}px, area ${metrics.area}, roughness ${metrics.roughness}, ${metrics.pointCount} drawn blobs.`,
    `Add creature details that match the shape: ${metrics.width > metrics.height * 1.35 ? 'wings, tiny legs, or whale-like tail' : metrics.height > metrics.width * 1.2 ? 'antennae, little crown, or long floating posture' : 'small face, soft cheeks, sparkles, or raindrop charms'}.`,
    `Point sample for silhouette guidance: ${JSON.stringify(pointSample)}.`,
    `Deterministic seed hint: ${metrics.seed}.`,
  ].join(' ');
}

export default async function handler(request: ApiRequest, response: ApiResponse) {
  try {
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
    const cloudImage = readCloudImage(request.body);

    if (!metrics) {
      response.status(400).json({ error: 'Invalid cloud metrics' });
      return;
    }

    if (!cloudImage) {
      response.status(400).json({ error: 'Cloud reference image is required' });
      return;
    }

    const prompt = buildImagePrompt(metrics, readPointSample(request.body));
    const formData = new FormData();
    formData.append('model', defaultImageModel);
    formData.append('prompt', prompt);
    formData.append('n', '1');
    formData.append('size', defaultImageSize);
    formData.append('quality', defaultImageQuality);
    formData.append('background', 'transparent');
    formData.append('output_format', defaultOutputFormat);
    formData.append('image', new Blob([cloudImage.buffer], { type: cloudImage.mediaType }), 'cloud-reference.png');

    const openAiResponse = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const responseBody = await readJsonResponse(openAiResponse);

    if (!openAiResponse.ok) {
      response.status(openAiResponse.status).json({ error: readOpenAiError(responseBody) });
      return;
    }

    const imageBase64 = extractGeneratedImage(responseBody);

    if (!imageBase64) {
      response.status(502).json({ error: 'OpenAI did not return generated image data' });
      return;
    }

    response.status(200).json({
      imageDataUrl: `data:image/${defaultOutputFormat};base64,${imageBase64}`,
      imagePrompt: prompt,
      imageModel: defaultImageModel,
    });
  } catch {
    response.status(500).json({ error: 'Creature image generation route failed' });
  }
}
