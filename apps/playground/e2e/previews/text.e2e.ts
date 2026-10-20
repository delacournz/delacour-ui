// text previews: one capture() per captured demo. A body is that demo's flow and runs while the
// screen records; keep it under about three seconds and end where it began, because the clip loops.
import { capture } from "./capture";

capture("text/type-scale");

capture("text/colour");

capture("text/inline-presets");
