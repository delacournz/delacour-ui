import type { ComponentType } from "react";

/**
 * How the capture script crops the screen.
 *
 * `stage` takes a centred band of the device screen and publishes it as a card
 * — right for almost everything, because a switch or a row of badges inside a
 * phone silhouette reads as a screenshot of an app rather than as a component.
 *
 * `device` keeps the whole screen, for a demo that *is* a screen: `Screen`'s own
 * galleries, and anything that mounts into a portal. `BottomSheet` has no
 * choice — it renders outside the stage entirely, so a stage crop would frame
 * an empty box.
 */
export type DemoFrame = "stage" | "device";

/**
 * How a demo is sized horizontally on the surface that shows it.
 *
 * `stretch` gives it the full content width — the width every demo is authored
 * against. A demo that is a container needs it: a shrink-wrapped `ListGroup`,
 * `Field.Group`, `Accordion` or `Tabs` collapses to its narrowest content and
 * drops the text out of its rows.
 *
 * `center` shrink-wraps it, which is what makes a row of switches or a colour
 * matrix sit as a composed object rather than hugging the left gutter.
 */
export type DemoAlign = "center" | "stretch";

/**
 * Present on a demo whose media is published. Absent on one that only appears
 * in the playground gallery.
 *
 * Opt-in rather than opt-out, and that is a size decision: the galleries carry
 * over two hundred sections, and capturing every one in both themes is tens of
 * megabytes of PNG for demos nobody would put in a doc. Galleries stay
 * exhaustive; captured demos are curated, four to six per component.
 */
export type DemoCapture = {
	/** Default `stage`. */
	frame?: DemoFrame;
	/**
	 * How the capture stage sizes the demo horizontally. Default `center`.
	 *
	 * The published card is a composition in a way the gallery page is not, so
	 * this defaults the other way round from {@link DemoMeta.align} — and it
	 * doubles as that field's fallback, so a captured demo already carrying the
	 * answer never restates it.
	 */
	align?: DemoAlign;
	/**
	 * Path under `.argent/flows/previews/`, without the `.yaml`.
	 *
	 * Its presence is what makes this demo animated: a demo with a flow is
	 * recorded and published as an MP4 plus a poster, one without is a single
	 * PNG.
	 */
	flow?: string;
	/** Still frames held before the flow runs, in ms. Default 400. */
	leadMs?: number;
	/**
	 * Still frames held after it, in ms. Default 800.
	 *
	 * Not padding for its own sake: the recording draws a touch pulse wherever
	 * the flow tapped, and a clip that ends before it fades shows a ghost finger
	 * at the loop seam.
	 */
	tailMs?: number;
	/**
	 * Fronts this component's card on the components index.
	 *
	 * Exactly one demo per component sets it, and `demos.test.ts` fails by name
	 * when none or several do.
	 */
	hero?: boolean;
};

/**
 * What a demo says about itself.
 *
 * The same object drives three surfaces — the gallery section, the captured
 * media, and the documentation page — which is the point. A caption written
 * here cannot drift from the demo it describes, because there is nowhere else
 * for it to be written.
 */
export type DemoMeta = {
	/** The `Section` heading in the gallery, and the media's caption in the docs. */
	title: string;
	/**
	 * Prose above the demo. Markdown — backticks come out as inline code in MDX.
	 *
	 * Most galleries explain before they show.
	 */
	caption?: string;
	/**
	 * Prose below it, for the galleries that trail their explanation instead.
	 *
	 * `tabs/swipe` does this for all four of its sections, and reversing them to
	 * fit one slot would lose the reading order its author chose.
	 */
	note?: string;
	/**
	 * How the gallery page sizes this demo. Default `stretch`.
	 *
	 * Falls back to {@link DemoCapture.align} before the default, so the curated
	 * demos that already declared a capture alignment inherit it here.
	 *
	 * Worth setting to `center` on a demo that is one small control: alone on a
	 * page of its own, a lone switch pinned to the left gutter reads as a
	 * mistake rather than as a specimen.
	 */
	align?: DemoAlign;
	/** Absent ⇒ the demo renders in the gallery and no media is captured. */
	capture?: DemoCapture;
	/**
	 * This demo holds a text field.
	 *
	 * The gallery ORs it across its demos and forwards the result to
	 * `Screen.ScrollArea`, so the demo that knows is the one that declares it.
	 */
	keyboardAware?: boolean;
};

/** Every `src/demos/**\/*.tsx` exports exactly these two bindings. */
export type DemoModule = {
	meta: DemoMeta;
	Demo: ComponentType;
};

/**
 * A demo module plus everything `defineDemoGroup` derives from where it sits.
 *
 * This is what the gallery renders and what the docs pipeline keys off. `meta`
 * is what an author writes; this is what the rest of the app reads, with every
 * optional field already resolved to its default so no consumer repeats the
 * `??` chain.
 */
export type DemoEntry = {
	/** `switch/colours`, or `tabs/swipe/rubber-band`. The deep link and the media path. */
	id: string;
	/** `switch`, or `tabs/swipe`. */
	group: string;
	slug: string;
	title: string;
	/** Resolved: `meta.align`, else `meta.capture.align`, else `stretch`. */
	align: DemoAlign;
	caption?: string;
	note?: string;
	capture?: DemoCapture;
	keyboardAware: boolean;
	Demo: ComponentType;
};
