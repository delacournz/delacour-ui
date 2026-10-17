import type { ComponentType, ReactNode } from "react";
import type { StyleProp, ViewProps, ViewStyle } from "react-native";
import type { ScrollSource } from "../../hooks/use-scroll-source";
import { SCROLL_EDGES, type ScrollEdges } from "../../lib/scroll-edges";

/**
 * The materials a blur engine can draw, named for what they look like rather
 * than for any one engine's enum. An engine maps each onto its own.
 */
export const BLUR_MATERIALS = ["default", "light", "dark", "chrome", "thick"] as const;
export type BlurMaterial = (typeof BLUR_MATERIALS)[number];

/** What an engine renders: one native blur view filling `style`. */
export type BlurLayerProps = {
	/** 0-100, engine-agnostic. */
	intensity: number;
	material: BlurMaterial;
	style: StyleProp<ViewStyle>;
};

/**
 * A blur engine. `ScrollBlur` never imports one; the app hands it one —
 * `ExpoBlurLayer` from `@delacour/react-native-ui/expo/blur-layer`, or its own.
 */
export type BlurLayerComponent = ComponentType<BlurLayerProps>;

/** Which edges of the scrollable blur. */
export const SCROLL_BLUR_EDGES = SCROLL_EDGES;
export type ScrollBlurEdges = ScrollEdges;

export type ScrollBlurProps = Omit<ViewProps, "pointerEvents"> & {
	/** The scrollable the blur overlays. */
	children: ReactNode;
	/** Band depth in points. @default 80 */
	size?: number;
	/** @default "both" */
	edges?: ScrollBlurEdges;
	/** Stacked blur strips; more is smoother and costs a native view each. Clamped 1-16. @default 8 */
	layers?: number;
	/** Blur at the edge, 0-100; falls linearly to 0 across `size`. @default 56 */
	intensity?: number;
	/** @default "default" */
	material?: BlurMaterial;
	/** Wash colour hiding seams; match the surface. Defaults to the `background` token. */
	color?: string;
	/** Wash opacity at the edge, 0-1. @default 0.9 */
	tint?: number;
	/** Scroll travel from clear to full, in points. @default 24 */
	fadeInDistance?: number;
	/** Points to hold the start band in from its edge — under a floating header, say. @default 0 */
	insetStart?: number;
	/** Points to hold the end band in from its edge. @default 0 */
	insetEnd?: number;
	/** Engine for this band; overrides the provider. */
	layer?: BlurLayerComponent;
	/** The scrollable to follow. Defaults to the nearest `ScrollSourceProvider` or `Screen`. */
	scrollSource?: ScrollSource;
	/** @default true */
	enabled?: boolean;
	className?: string;
};
