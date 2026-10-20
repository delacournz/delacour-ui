import type { ReactElement, ReactNode } from "react";
import { ScrollView, View, type ViewProps } from "react-native";
import { useSketchPart } from "./sketch.context";
import { sketchVariants } from "./sketch.variants";
import { SketchSize } from "./sketch-size";
import { SketchSwatches } from "./sketch-swatches";
import { SketchTool } from "./sketch-tool";
import { SketchUndo } from "./sketch-undo";

export type SketchToolbarProps = Omit<ViewProps, "children"> & {
	/** Your own tools, laid out in a wrapping row. Omitted, every tool is rendered. */
	children?: ReactNode;
};

/**
 * The tool tray, ruled off the canvas below it.
 *
 * With no children it is the whole set, sized for a thumb: pen, shape and
 * eraser, the width slider, and undo at the far end; the shapes, while the shape
 * tool is in hand; then the swatches on a row of their own, which six 36-point
 * targets fill. Pass children to
 * choose and order the tools yourself.
 *
 * Disabled fades the tray and never the canvas — the marks are content and stay
 * readable.
 */
export function SketchToolbar({ children, className, ...props }: SketchToolbarProps): ReactElement {
	const { tool, shapes, isDisabled } = useSketchPart("Sketch.Toolbar");
	const slots = sketchVariants({ isDisabled });

	if (children !== undefined) {
		return (
			<View className={slots.toolbar({ className })} {...props}>
				<View className={slots.toolbarRow({ className: "flex-wrap" })}>{children}</View>
			</View>
		);
	}

	// The shape row appears only while the shape tool is in hand, so the tray is
	// two rows for the pen and the eraser. It scrolls rather than wraps: eight
	// 44-point targets are a hair wider than a small phone.
	return (
		<View className={slots.toolbar({ className })} {...props}>
			<View className={slots.toolbarRow()}>
				<SketchTool testID="sketch-tool-pen" tool="pen" />
				<SketchTool testID="sketch-tool-shape" tool="shape" />
				<SketchTool testID="sketch-tool-eraser" tool="eraser" />
				<SketchSize className="mx-2 flex-1" />
				<SketchUndo testID="sketch-undo" />
			</View>
			{tool === "shape" && shapes.length > 1 ? (
				<ScrollView horizontal showsHorizontalScrollIndicator={false}>
					<View className={slots.toolbarRow()}>
						{shapes.map((shape) => (
							<SketchTool key={shape} shape={shape} testID={`sketch-shape-${shape}`} tool="shape" />
						))}
					</View>
				</ScrollView>
			) : null}
			<SketchSwatches testID="sketch-swatches" />
		</View>
	);
}
SketchToolbar.displayName = "DelacourUI.Sketch.Toolbar";
