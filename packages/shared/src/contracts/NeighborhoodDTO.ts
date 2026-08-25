export type NeighborhoodSummaryDTO = {
  name: string;
  count: number;
};

export type NeighborhoodsResultDTO = {
  items: NeighborhoodSummaryDTO[];
};
