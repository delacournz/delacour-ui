import type { Href } from "expo-router";

/**
 * The key screens the home screen links to, each a route under `app/(blocks)/`.
 *
 * Kept apart from `components-index.ts` on purpose: a block is a composition of
 * the library, not a component, so it has no docs page, no demo and no entry in
 * the web index those are held to. `block-index.test.ts` holds each slug to its
 * route file.
 */
export type BlockEntry = {
	readonly slug: string;
	readonly href: Href;
	readonly title: string;
	readonly description: string;
};

const ROWS = [
	{ slug: "shell", title: "App shell", description: "Header, content and a tab bar" },
	{ slug: "settings", title: "Settings", description: "Kickers over grouped trays" },
	{ slug: "sign-in", title: "Sign in", description: "Email, password and an etched button" },
	{ slug: "otp", title: "Verify code", description: "Six boxes, paste and autofill" },
	{ slug: "dashboard", title: "Dashboard", description: "KPI tiles and a chart" },
	{ slug: "members", title: "Members", description: "A searchable, filterable list" },
	{ slug: "invoices", title: "Invoices", description: "Status badges and a running total" },
	{ slug: "empty-states", title: "Empty states", description: "Nothing yet, in four contexts" },
] as const satisfies readonly Omit<BlockEntry, "href">[];

export type BlockSlug = (typeof ROWS)[number]["slug"];

export const BLOCKS: readonly (BlockEntry & { readonly slug: BlockSlug })[] = ROWS.map((row) => ({
	...row,
	href: `/${row.slug}` as const,
}));
