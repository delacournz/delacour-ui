import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { DelacourIcon } from "@/components/delacour-icon";
import { InstallButtons } from "@/components/playground/install-buttons";
import { COMPONENTS, hasPlaygroundScreen } from "@/lib/components";
import { NATIVE_APP } from "@/lib/native-app";

/**
 * The web half of a playground link.
 *
 * On a phone with the app installed this page is never seen — iOS and Android
 * intercept the URL before the browser loads anything. It is what everyone else
 * gets: a desktop that scanned the QR, a phone without the app, a link pasted
 * into a chat.
 *
 * An optional splat, so the bare `/playground/components` renders too. Apple's
 * `*` glob matches it, and a URL the association file claims must not 404.
 *
 * `noindex` because the URL exists to carry a universal link. There is nothing
 * here a search engine should rank above the component's actual documentation.
 */
export const Route = createFileRoute("/playground/components/{$}")({
	component: PlaygroundFallback,
	head: () => ({
		meta: [
			{ title: `Open in ${NATIVE_APP.NAME}` },
			{
				name: "description",
				content: `Preview this component live in the ${NATIVE_APP.NAME} app.`,
			},
			{ name: "robots", content: "noindex, nofollow" },
		],
	}),
});

/** The component a splat names, or `null` for the bare prefix and anything unknown. */
function componentFor(splat: string | undefined) {
	const slug = splat?.split("/")[0] ?? "";
	if (!hasPlaygroundScreen(slug)) return null;
	return COMPONENTS.find((component) => component.slug === slug) ?? null;
}

function PlaygroundFallback(): ReactElement {
	const { _splat } = Route.useParams();
	const component = componentFor(_splat);

	return (
		<main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
			<DelacourIcon size={56} />
			<div className="flex max-w-md flex-col items-center gap-3 text-center">
				<h1 className="font-bold text-3xl tracking-tight">Open in {NATIVE_APP.NAME}</h1>
				<p className="text-fd-muted-foreground text-sm leading-relaxed">
					{component
						? `${component.name} is available inside the ${NATIVE_APP.NAME} app. Install it to preview the component live on your device.`
						: `This content is available inside the ${NATIVE_APP.NAME} app. Install it to preview components live on your device.`}
				</p>
			</div>
			<InstallButtons className="max-w-xs" />
			<Link
				className="text-fd-muted-foreground text-sm transition-colors hover:text-fd-foreground"
				params={{ _splat: component ? `native/components/${component.slug}` : "native/components" }}
				to="/docs/$"
			>
				{component ? `Read the ${component.name} docs` : "Browse the components"} →
			</Link>
		</main>
	);
}
