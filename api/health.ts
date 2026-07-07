import { isAuthConfigured, setCorsHeaders, type ApiRequest, type ApiResponse } from './_auth.js';

export default function handler(request: ApiRequest, response: ApiResponse) {
  setCorsHeaders(response);

  if (request.method === 'OPTIONS') {
    response.status(204).json({});
    return;
  }

  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  response.status(200).json({
    ok: true,
    authConfigured: isAuthConfigured(),
    openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL ?? 'gpt-5.5',
  });
}
