import { concatDemoGroups } from "../define-demo-group";
import { chartAreaDemos } from "./area";
import { chartBarDemos } from "./bar";
import { chartCandlestickDemos } from "./candlestick";
import { chartLineDemos } from "./line";
import { chartPartsDemos } from "./parts";
import { chartPieDemos } from "./pie";
import { chartScatterDemos } from "./scatter";

/** Facet order — the order the Chart index lists its seven pages. */
export const chartDemos = concatDemoGroups(
	chartLineDemos,
	chartAreaDemos,
	chartBarDemos,
	chartScatterDemos,
	chartCandlestickDemos,
	chartPieDemos,
	chartPartsDemos
);
