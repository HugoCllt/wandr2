export type UserCategoryBreakdownItem = {
  name: string;
  iconKey: string;
  percent: number;
  cool?: boolean;
};

export type UserCategoryBreakdown = UserCategoryBreakdownItem[];
