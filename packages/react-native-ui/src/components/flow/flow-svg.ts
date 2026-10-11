import type { ComponentClass } from "react";
import Animated from "react-native-reanimated";
import { G, type GProps } from "react-native-svg";

/**
 * A `G`'s props plus the native `matrix` it is drawn with.
 *
 * `react-native-svg` folds `transform` into `matrix` on the JS side and sends only `matrix` to the
 * native view, so an animated prop has to write `matrix` itself — a `transform` written from a
 * worklet never passes through that fold. The public `GProps` does not declare it, hence the type.
 */
export type FlowMatrixGProps = GProps & { matrix?: number[] };

/** An animated `G` whose `matrix` a worklet can drive — the canvas's pan and zoom, in one prop. */
export const AnimatedMatrixG = Animated.createAnimatedComponent(G as ComponentClass<FlowMatrixGProps>);
