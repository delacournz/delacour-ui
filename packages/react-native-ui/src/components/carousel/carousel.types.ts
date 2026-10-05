import type { ReactNode } from "react";
import type { ViewProps } from "react-native";
import type { ButtonProps } from "../button";

/** Props every plain-`View` part of a carousel takes: a `View`, plus a className merged last. */
export type CarouselSlotProps = ViewProps & {
	className?: string;
};

/** `Carousel.Previous` and `Carousel.Next`: an icon `Button` whose press is the carousel's. */
export type CarouselArrowProps = Omit<ButtonProps, "onPress" | "children"> & {
	/** Replaces the chevron. */
	children?: ReactNode;
};
