import { concatDemoGroups } from "../define-demo-group";
import { chartsAreaDemos } from "./area";
import { chartsAxesDemos } from "./axes";
import { chartsBarDemos } from "./bar";
import { chartsCandlestickDemos } from "./candlestick";
import { chartsCompositionDemos } from "./composition";
import { chartsCursorDemos } from "./cursor";
import { chartsLineDemos } from "./line";
import { chartsPieDemos } from "./pie";
import { chartsScatterDemos } from "./scatter";

/**
 * The engine, `delacour-react-native-charts`, rendered on its own.
 *
 * Keyed `charts` rather than `chart` on purpose: `chart/` is the themed
 * library's component and these demos import nothing from it. Facet order is
 * the order the documentation section reads in.
 */
export const chartsDemos = concatDemoGroups(
	chartsLineDemos,
	chartsAreaDemos,
	chartsBarDemos,
	chartsScatterDemos,
	chartsCandlestickDemos,
	chartsPieDemos,
	chartsCompositionDemos,
	chartsAxesDemos,
	chartsCursorDemos
);
