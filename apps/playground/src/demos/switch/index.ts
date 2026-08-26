import { defineDemoGroup } from "../define-demo-group";
import * as aGlyphInTheKnob from "./a-glyph-in-the-knob";
import * as colours from "./colours";
import * as controlledAndRejected from "./controlled-and-rejected";
import * as disabledAndInvalid from "./disabled-and-invalid";
import * as inASettingsList from "./in-a-settings-list";
import * as insideAField from "./inside-a-field";
import * as sizes from "./sizes";
import * as startAndEndContent from "./start-and-end-content";
import * as tapOrDrag from "./tap-or-drag";
import * as textAtTheEnds from "./text-at-the-ends";
import * as withoutALabel from "./without-a-label";

/** Key order is the gallery's reading order — the gesture first, the edge cases last. */
export const switchDemos = defineDemoGroup("switch", {
	"tap-or-drag": tapOrDrag,
	colours,
	sizes,
	"start-and-end-content": startAndEndContent,
	"text-at-the-ends": textAtTheEnds,
	"a-glyph-in-the-knob": aGlyphInTheKnob,
	"controlled-and-rejected": controlledAndRejected,
	"disabled-and-invalid": disabledAndInvalid,
	"inside-a-field": insideAField,
	"in-a-settings-list": inASettingsList,
	"without-a-label": withoutALabel,
});
