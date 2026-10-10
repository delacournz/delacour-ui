export const REVENUE = [
	{ month: "Apr", revenue: 31, target: 34 },
	{ month: "May", revenue: 36, target: 36 },
	{ month: "Jun", revenue: 34, target: 38 },
	{ month: "Jul", revenue: 41, target: 40 },
	{ month: "Aug", revenue: 44, target: 42 },
	{ month: "Sep", revenue: 48, target: 44 },
] as const;

export const REVENUE_CONFIG = {
	revenue: { label: "Revenue" },
	target: { label: "Target" },
} as const;

export const SIGNUPS: readonly number[] = [14, 16, 15, 19, 18, 22, 21, 25, 24, 28];
