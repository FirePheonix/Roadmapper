export interface RoadmapBlock {
  isCompletedByUser: boolean;
  blockID: number;
  title: string;
  time: string;
  description: string;
  connectivity: number[];
}

export interface RoadmapData {
  blocks: RoadmapBlock[];
  query: string;
}
