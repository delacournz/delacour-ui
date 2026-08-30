import type { ReactElement } from "react";
import { DemoPager } from "@/components/demo-pager";
import type { DemoEntry } from "@/demos/types";

export type DemoGalleryProps = {
	title: string;
	/** Defaults to the demo count. Pass one only when a gallery has something better to say. */
	subtitle?: string;
	demos: readonly DemoEntry[];
};

/**
 * A gallery, rendered from a demo group.
 *
 * Every `(components)` route is a six-line shell around this, so the shape of
 * every gallery in the app is decided here and nowhere else. That is why it
 * kept its props exactly when the galleries were paged: thirty-four routes
 * changed surface without one of them being edited.
 *
 * `meta.caption` and `meta.note` are no longer drawn. They are still authored,
 * and still published — `scripts/previews/demo-source.ts` cuts them out of the
 * source for the documentation site — but a component alone on a page says more
 * about itself than a paragraph above it does, and the prose was outweighing
 * the components it described.
 *
 * `keyboardAware` is ORed across the group inside the pager rather than passed
 * per gallery. The demo holding the text field is the thing that knows, so a
 * gallery that gains one needs no edit here.
 */
export function DemoGallery({ title, subtitle, demos }: DemoGalleryProps): ReactElement {
	return <DemoPager demos={demos} subtitle={subtitle ?? `${demos.length} demos`} title={title} />;
}
