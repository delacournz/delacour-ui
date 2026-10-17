import { type ReactElement, type ReactNode, useMemo } from "react";
import { View, type ViewProps } from "react-native";
import { type SurfaceContextValue, SurfaceProvider, useSurfaceContext } from "../surface/surface.context";
import { resolveSurfacePlane } from "../surface/surface.variants";
import { type FrameContextValue, FrameProvider } from "./frame.context";
import { type FrameSize, type FrameVariant, frameVariants, resolveFrameRootVariant } from "./frame.variants";
import { FrameAction } from "./frame-action";
import { FrameDescription } from "./frame-description";
import { FrameFooter } from "./frame-footer";
import { FrameHeader } from "./frame-header";
import { FrameSection } from "./frame-section";
import { FrameTitle } from "./frame-title";
import { FrameTray } from "./frame-tray";

export type FrameProps = ViewProps & {
	/**
	 * `default`: a tinted shell with a 4pt lip; the title sits on it above the tray.
	 * `plain`: no shell, for a frame already inside a bordered container.
	 * `inset`: the tray recessed into an 8pt band on every side; the footer sits in the band.
	 */
	variant?: FrameVariant;
	/** Row metrics for the tray, and the title's step on the type scale. Default `md`. */
	size?: FrameSize;
	className?: string;
	children?: ReactNode;
};

function FrameRoot({ variant = "default", size = "md", className, children, ...props }: FrameProps): ReactElement {
	const parentPlane = useSurfaceContext()?.plane ?? null;
	const fill = resolveFrameRootVariant(variant, parentPlane);
	const plane = resolveSurfacePlane({ parentPlane, variant: fill });

	const frame = useMemo<FrameContextValue>(() => ({ plane, size, variant }), [plane, size, variant]);
	const surface = useMemo<SurfaceContextValue>(() => ({ material: "flat", plane, variant: fill }), [plane, fill]);

	return (
		<FrameProvider value={frame}>
			<SurfaceProvider value={surface}>
				<View className={frameVariants({ fill, variant }).root({ className })} {...props}>
					{children}
				</View>
			</SurfaceProvider>
		</FrameProvider>
	);
}

/**
 * A titled shell around a card of rows — the settings-screen shape.
 *
 * A small header with an optional action, a tray of divided rows (optionally in
 * labelled sections), and a footer. The rows are not Frame's: they are `Item`
 * or `ListGroup.Item`, which become grouped rows inside `Frame.Tray` because the
 * tray publishes the ListGroup context. Frame owns the spacing between the
 * title, the card and the footer, and nothing else.
 *
 * The shell's fill steps on the surface ladder, so a frame inside a `Card` is
 * secondary and a frame inside a secondary panel is tertiary — never the colour
 * of what it sits in. It publishes that fill as a surface, so anything nested
 * keeps stepping.
 *
 * @example
 * <Frame>
 *   <Frame.Header>
 *     <Frame.Title>Notifications</Frame.Title>
 *     <Frame.Action onPress={openManage}>Manage</Frame.Action>
 *   </Frame.Header>
 *   <Frame.Tray>
 *     <Item>
 *       <Item.Content><Item.Title>Push</Item.Title></Item.Content>
 *       <Item.Actions><Switch isSelected={push} onSelectedChange={setPush} /></Item.Actions>
 *     </Item>
 *     <Frame.Section title="Email">
 *       <ListGroup.Item onPress={openDigest}>Weekly digest</ListGroup.Item>
 *     </Frame.Section>
 *   </Frame.Tray>
 * </Frame>
 *
 * @example
 * <Frame variant="inset">
 *   <Frame.Header>Delete workspace</Frame.Header>
 *   <Frame.Tray>…</Frame.Tray>
 *   <Frame.Footer align="stretch">
 *     <Button variant="secondary" onPress={cancel}>Cancel</Button>
 *     <Button variant="destructive" onPress={confirm}>Delete</Button>
 *   </Frame.Footer>
 * </Frame>
 */
export const Frame = Object.assign(FrameRoot, {
	/** The strip above the tray. Stacks a title and description, and puts any `Frame.Action` at the end. */
	Header: FrameHeader,
	/** The frame's heading, on its plane's foreground token. Announced as a header. */
	Title: FrameTitle,
	/** The muted supporting line under the title. */
	Description: FrameDescription,
	/** A text link at the end of the header, with a 44pt hit target. */
	Action: FrameAction,
	/** The card of rows. `Item` and `ListGroup.Item` inside it become grouped rows. */
	Tray: FrameTray,
	/** A labelled cluster of rows inside the tray, ruled off full-bleed. */
	Section: FrameSection,
	/** The line under the tray — a caption, or decision buttons laid out by `align`. */
	Footer: FrameFooter,
	displayName: "DelacourUI.Frame",
});
