import { type ReactElement, useLayoutEffect, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { type SharedValue, useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated";
import { Canvas, Group, Path, Picture, Skia, type SkPicture } from "react-native-skia";
import { scheduleOnRN } from "react-native-worklets";
import { recordSignaturePicture } from "./signature.skia";
import { traceStroke } from "./signature.stroke";
import type { SignaturePoint, SignatureStroke } from "./signature.types";

/** A cleared signature's ink fades rather than vanishing, so the clear reads as an action. */
const CLEAR_FADE_MS = 150;

export type SignatureInkProps = {
	/** The finished strokes. */
	strokes: readonly SignatureStroke[];
	/** The stroke under the finger, written by the pad's gesture on the UI thread. */
	live: SharedValue<SignaturePoint[]>;
	/** The ink, already resolved against the theme — a canvas cannot read one. */
	color: string | undefined;
	strokeWidth: number;
	/** Bumped by every clear; a change fades out the ink it replaced. */
	clearCount: number;
	/** Under calm motion a clear is instant. */
	isCalm: boolean;
};

/**
 * Every stroke, finished and live, on one Skia canvas.
 *
 * Internal. **The finished strokes are one recorded picture**, re-recorded once
 * per commit and never while a finger moves. **The live stroke is a path built on
 * the UI thread** by tracing the shared points straight into a path builder — no
 * string is written or parsed per frame — and it is traced by the same
 * `traceStroke` the picture's paths are, so a stroke does not shift by a hair
 * when it is committed.
 *
 * **A clear fades the ink it replaced.** The picture from before the clear is
 * kept as a ghost inside a layer whose paint's alpha runs to zero, then dropped.
 * A layer rather than a group opacity: a picture replays with its own paints, so
 * only the layer it is composited through can fade it, and fading the layer as a
 * whole is what the old fading view did. Under calm motion there is no ghost.
 */
export function SignatureInk({
	strokes,
	live,
	color,
	strokeWidth,
	clearCount,
	isCalm,
}: SignatureInkProps): ReactElement {
	const picture = useMemo(() => recordSignaturePicture(strokes, { color, strokeWidth }), [color, strokes, strokeWidth]);

	const livePath = useDerivedValue(() => {
		const builder = Skia.PathBuilder.Make();
		traceStroke(live.value, builder);
		return builder.detach();
	});

	// The picture and clear count the last render drew. A clear swaps the strokes
	// and bumps the count in one render, so the ghost is decided here, during
	// that render, and lands in the same commit as the empty picture — set from
	// an effect instead, the ink blinks out for a frame and then pops back.
	const [drawn, setDrawn] = useState({ clearCount, picture });
	const [ghost, setGhost] = useState<SkPicture | null>(null);
	if (drawn.clearCount !== clearCount || drawn.picture !== picture) {
		setDrawn({ clearCount, picture });
		if (drawn.clearCount !== clearCount) setGhost(isCalm ? null : drawn.picture);
	}

	// Rests at 1 while there is no ghost, so a ghost is drawn opaque on its first
	// frame, before the fade below has started.
	const ghostAlpha = useSharedValue(1);
	const ghostLayer = useDerivedValue(() => {
		const paint = Skia.Paint();
		paint.setAlphaf(ghostAlpha.value);
		return paint;
	});

	useLayoutEffect(() => {
		if (ghost === null) {
			ghostAlpha.value = 1;
			return;
		}
		ghostAlpha.value = withTiming(0, { duration: CLEAR_FADE_MS }, (isFinished) => {
			"worklet";
			if (isFinished) scheduleOnRN(setGhost, null);
		});
	}, [ghost, ghostAlpha]);

	return (
		<Canvas pointerEvents="none" style={StyleSheet.absoluteFill}>
			{ghost === null ? null : (
				<Group layer={ghostLayer}>
					<Picture picture={ghost} />
				</Group>
			)}
			<Picture picture={picture} />
			<Path
				color={color ?? "transparent"}
				path={livePath}
				strokeCap="round"
				strokeJoin="round"
				strokeWidth={strokeWidth}
				style="stroke"
			/>
		</Canvas>
	);
}
SignatureInk.displayName = "DelacourUI.Signature.Ink";
