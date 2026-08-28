import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { File, Files, Folder } from "fumadocs-ui/components/files";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import type { ComponentProps } from "react";
import { ComponentInstall, InstallTabs } from "@/components/install";
import { Preview } from "@/components/preview";
import { PreviewGrid } from "@/components/preview-grid";
import { isFileHref } from "@/lib/shared";

/**
 * Fumadocs' `a` routes every internal href through the client router. That is
 * right for a docs page and wrong for `/llms.txt`, `/llms-full.txt` and the
 * `.md` twins: those are route handlers with no component, so the router
 * matches the path and renders the 404 page. A plain anchor navigates the
 * document instead, in the same tab, and the handler answers — see
 * {@link isFileHref}.
 */
function Anchor({ href, ...props }: ComponentProps<"a">) {
	if (href !== undefined && isFileHref(href)) return <a href={href} {...props} />;
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
		ComponentInstall,
		File,
		Files,
		Folder,
		InstallTabs,
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
