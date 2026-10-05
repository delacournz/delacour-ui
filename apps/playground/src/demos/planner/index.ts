import { defineDemoGroup } from "../define-demo-group";
import * as calendarFill from "./calendar-fill";
import * as controlledMonth from "./controlled-month";
import * as customDay from "./custom-day";
import * as detailsSheet from "./details-sheet";
import * as scroller from "./scroller";
import * as tiles from "./tiles";
import * as trainingPlan from "./training-plan";
import * as weekStartSunday from "./week-start-sunday";

/** Key order is the gallery's reading order — the plan, the two other variants, the sheet, the scroller, then the props. */
export const plannerDemos = defineDemoGroup("planner", {
	"training-plan": trainingPlan,
	tiles,
	"calendar-fill": calendarFill,
	"details-sheet": detailsSheet,
	scroller,
	"custom-day": customDay,
	"controlled-month": controlledMonth,
	"week-start-sunday": weekStartSunday,
});
