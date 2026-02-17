import { ShortlistResult } from '../types';

export const generateShortlist = async (
  need: string,
  requirements: string[],
  budget: string,
  region: string
): Promise<Partial<ShortlistResult>> => {
  const res = await fetch('/api/generateShortlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ need, requirements, budget, region })
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Server error: ${res.status}`);
  }

  const data = await res.json();
  return {
    vendors: data.vendors,
    summary: data.summary,
    sources: data.sources
  };
};
