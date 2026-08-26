import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * `/docs` is a namespace, not a page — every library gets a segment under it.
 * Native is the only one today, so land on its introduction.
 */
export const Route = createFileRoute("/docs/")({
	beforeLoad: () => {
		throw redirect({ to: "/docs/$", params: { _splat: "native/getting-started" } });
	},
});
