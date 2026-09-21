import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { File, Files, Folder } from "fumadocs-ui/components/files";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";
import { AgentPrompt } from "@/components/agent-prompt";
import { ComponentInstall, InstallTabs, LibraryInstall } from "@/components/install";
import { Preview } from "@/components/preview";
import { PreviewGrid } from "@/components/preview-grid";
import { isFileHref } from "@/lib/shared";

/**
 * Fumadocs' `a` routes every internal href through the client router. Two kinds
 * of href must not go that way.
 *
 * `/llms.txt`, `/llms-full.txt`, `/skills/**` and the `.md` twins are route
 * handlers with no component, so the router matches the path and renders the
 * 404 page — see {@link isFileHref}.
 *
 * A bare `#fragment` is not a navigation at all. TanStack's `Link` resolves it
 * against the current route, and server and client disagree about the result:
 * the server renders `/docs/…/#anchor`, the client renders `/docs/…` with
 * `data-status="active"`, and React reports a hydration mismatch it will not
 * patch up. A plain anchor is also what a fragment link *is*.
 */
function Anchor({ href, ...props }: ComponentProps<"a">) {
	if (href !== undefined && (href.startsWith("#") || isFileHref(href))) return <a href={href} {...props} />;
	return <defaultMdxComponents.a href={href} {...props} />;
}

/**
 * `defaultMdxComponents` already carries `Callout`, `Card` and `Cards`. The rest
 * are opt-in — an MDX file naming one that is not registered here fails the
 * render with "Expected component X to be defined" rather than degrading.
 */
export function getMDXComponents(components?: MDXComponents) {
	return {
		...defaultMdxComponents,
		a: Anchor,
		Accordion,
		Accordions,
		AgentPrompt,
		ComponentInstall,
		File,
		Files,
		Folder,
		InstallTabs,
		LibraryInstall,
		Preview,
		PreviewGrid,
		Step,
		Steps,
		Tab,
		Tabs,
		TypeTable,
		...components,
	} satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
	type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
