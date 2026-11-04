/** MapLibre's hosts as `View`s with a stub ref. A setup file, beside `setup.ts`. */
import { jest } from "@jest/globals";
import { mockDeepStub } from "../mock-stub";

jest.mock("@maplibre/maplibre-react-native", () => {
	const { createElement, forwardRef, useImperativeHandle } = require("react");
	const { View } = require("react-native");
	const mockHost = (name: string) => {
		const Host = forwardRef((props: Record<string, unknown>, ref: unknown) => {
			useImperativeHandle(ref, () => mockDeepStub());
			return createElement(View, { ...props, testID: props.testID ?? `maplibre-${name}` });
		});
		Host.displayName = `MapLibre.${name}`;
		return Host;
	};
	return {
		Map: mockHost("Map"),
		Camera: mockHost("Camera"),
		Marker: mockHost("Marker"),
		GeoJSONSource: mockHost("GeoJSONSource"),
		Layer: mockHost("Layer"),
		LocationManager: {
			requestPermissions: async () => true,
			addListener: () => undefined,
			removeListener: () => undefined,
			getCurrentPosition: async () => null,
		},
	};
});
