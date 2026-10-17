import type { ImageResizeMode, ImageSourcePropType, ViewProps } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import type { ScrollSource } from "../../hooks/use-scroll-source";

type ScrollCanvasBaseProps = Omit<ViewProps, "children"> & {
	/** Frame width over height. @default 16 / 10 */
	aspectRatio?: number;
	/**
	 * How far the effect goes, as a share of the frame: parallax travel (of the
	 * frame height, each way), or zoom overscale. Clamped 0–1. @default 0.2
	 */
	distance?: number;
	/**
	 * Where the frame's top sits in the viewport (0 = top edge, 1 = bottom edge)
	 * when the effect starts. @default 1 — as the frame enters at the bottom
	 */
	start?: number;
	/**
	 * Where it sits when the effect is complete. Negative means past the top edge.
	 * @default parallax: just as the frame leaves (`-frameHeight / viewport`); the others: 0.3
	 */
	end?: number;
	/** Drive the effect directly, 0–1, instead of from the scroll position. Skips frame measurement. */
	progress?: SharedValue<number>;
	/** The scroll source to follow; otherwise the nearest provider — a `Screen` counts. */
	scrollSource?: ScrollSource;
	/** `false` draws the resting state with no motion. @default true */
	enabled?: boolean;
	/** Describes the picture. Omitted, the canvas is decorative and hidden from assistive tech. */
	accessibilityLabel?: string;
	/** @default "cover" */
	resizeMode?: ImageResizeMode;
	className?: string;
	imageClassName?: string;
};

/**
 * `ScrollCanvas`'s props. The effect decides the picture's shape: the three
 * single-image effects take one `source`, a `sequence` takes `sources` — and
 * the union forbids the other, so a sequence cannot be handed a lone image and
 * silently show it still.
 */
export type ScrollCanvasProps = ScrollCanvasBaseProps &
	(
		| {
				/** @default "parallax" */
				effect?: "parallax" | "zoom" | "reveal";
				source: ImageSourcePropType;
				sources?: never;
				/** `reveal` only: classes for the retreating cover. @default "bg-background" */
				coverClassName?: string;
		  }
		| {
				effect: "sequence";
				/** The frames, in scroll order. Frame 0 is the poster shown at rest. */
				sources: readonly ImageSourcePropType[];
				source?: never;
				coverClassName?: never;
		  }
	);
