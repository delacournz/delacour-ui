import type { ReactNode } from "react";
import type { ViewProps } from "react-native";
import type { IconComponent } from "../icon";
import type { PlannerColorIndex } from "./planner.variants";

/**
 * One thing on one day — a session, a post, a habit ticked.
 *
 * `date` is a `Date` or a `YYYY-MM-DD` string, and either way it is the
 * **local calendar day** that counts: a string is never parsed as UTC, and a
 * `Date` is never compared by timestamp.
 */
export type PlannerEntry = {
	id: string;
	date: Date | string;
	label: string;
	/** A `PlannerCategory` id — the colour, the legend row and the spoken group. */
	category?: string;
	/** A Central Icon from `@delacour/react-native-ui/icons/central`. */
	icon?: IconComponent;
	/** A literal colour or a theme token. Beats the category's. */
	color?: string;
};

/**
 * A kind of entry. Coloured by a slot of the theme's series ramp
 * (`colorIndex`, `--chart-1` … `--chart-5`) or a literal `color`, never both.
 */
export type PlannerCategory = { id: string; label: string } & (
	| { colorIndex?: PlannerColorIndex; color?: undefined }
	| { color: string; colorIndex?: undefined }
);

/** Everything a day knows about itself — what a `renderDay` is handed. */
export type PlannerDayInfo = {
	date: Date;
	/** The day's `YYYY-MM-DD` key. */
	key: string;
	entries: readonly PlannerEntry[];
	isToday: boolean;
	/** False for the neighbouring months' days at either end of the grid. */
	isInMonth: boolean;
	isSelected: boolean;
};

/** Draws a day's content in place of the variant's own. The day's button, label and state stay the planner's. */
export type PlannerDayRenderer = (info: PlannerDayInfo) => ReactNode;

/** The shape of the planner's layout parts — `Header`, `Footer`, `Legend`. */
export type PlannerSlotProps = ViewProps & { className?: string; children?: ReactNode };
