export type TrajectoryActionName = 'think' | 'search' | 'browse' | 'extract';

export interface SearchResult {
  title: string;
  snippet: string;
  url?: string;
}

export interface TrajectoryActionArguments {
  query?: string;
  result?: SearchResult[];
  url?: string;
  signal?: 'positive' | 'negative' | 'neutral' | string;
  answer?: string;
  explanation?: string;
}

export interface TrajectoryStep {
  step: number;
  action: {
    name: TrajectoryActionName;
    arguments: TrajectoryActionArguments;
  };
}

export interface DatasetEntry {
  id: string;
  question: string;
  ground_truth: string;
  trajectory: TrajectoryStep[];
}
