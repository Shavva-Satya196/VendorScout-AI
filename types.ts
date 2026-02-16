export interface Requirement {
  id: string;
  text: string;
}

export interface Vendor {
  name: string;
  priceRange: string;
  matchedFeatures: string[];
  risksLimits: string[];
  website?: string;
  verdict: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ShortlistResult {
  id: string;
  timestamp: number;
  need: string;
  region: string;
  budget: string;
  requirements: string[];
  vendors: Vendor[];
  summary: string;
  sources: GroundingChunk[];
}

export interface SearchState {
  isSearching: boolean;
  step: 'idle' | 'analyzing' | 'searching' | 'comparing' | 'finalizing';
}
