import { createFileRoute } from "@tanstack/react-router";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactElement } from "react";
import { ComponentIndex } from "@/components/landing/component-index";
import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { GetStarted } from "@/components/landing/get-started";
import { Hero } from "@/components/landing/hero";
import { Showcase } from "@/components/landing/showcase";
import { ThemeTeaser } from "@/components/landing/theme-teaser";
import { Tokens } from "@/components/landing/tokens";
import { homeOptions } from "@/lib/layout.shared";
import { appDescription, appName } from "@/lib/shared";

export const Route = createFileRoute("/")({
	component: Home,
	head: () => ({
		meta: [{ title: `${appName} — React Native components` }, { name: "description", content: appDescription }],
	}),
});

/**
 * The landing page: one reading column, top to bottom, in the studio's world.
 *
 * Each section is its own file under `components/landing/`, and every word
 * on the page is in `components/landing/copy.ts`, held verbatim by its test.
 * Sections separate with the rhythm token rather than with rules or tinted
 * bands — the dot field under the page is the only material, and the
 * showcase grid and the component index are the two places the page leaves
 * the column.
 */
function Home(): ReactElement {
	return (
		<HomeLayout {...homeOptions()}>
			<Hero />
			<Showcase />
			<Tokens />
			<Features />
			<ThemeTeaser />
			<GetStarted />
			<ComponentIndex />
			<Footer />
		</HomeLayout>
	);
}
