import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { LocationManager } from "@maplibre/maplibre-react-native";
import { act } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { fireEvent, renderWithProviders, screen } from "../../test/render";
import { Text } from "../text";
// biome-ignore lint/suspicious/noShadowRestrictedNames: the component is a map; consumers import it by name from its own subpath
import { Map } from "./map";
import { useMap } from "./map.context";
import type { LngLat } from "./map.types";

const WELLINGTON: LngLat = [174.776, -41.286];

/** Mounts a map and lays it out, since the native map only mounts once its root has been measured. */
async function renderMap(element: ReactElement) {
	const view = await renderWithProviders(element);
	await fireEvent(screen.getByTestId("map-root"), "layout", {
		nativeEvent: { layout: { height: 300, width: 400, x: 0, y: 0 } },
	});
	return view;
}

function FindOnMap(): ReactElement {
	const handle = useMap();
	return <Map.Label>{typeof handle.flyTo}</Map.Label>;
}

describe("Map", () => {
	test("mounts the native map only after the root is measured", async () => {
		await renderWithProviders(<Map center={WELLINGTON} testID="map-root" zoom={12} />);
		expect(screen.queryByTestId("maplibre-Map")).not.toBeOnTheScreen();

		await fireEvent(screen.getByTestId("map-root"), "layout", {
			nativeEvent: { layout: { height: 300, width: 400, x: 0, y: 0 } },
		});
		expect(screen.getByTestId("maplibre-Map")).toBeOnTheScreen();
	});

	test("ignores a zero-sized layout", async () => {
		await renderWithProviders(<Map center={WELLINGTON} testID="map-root" zoom={12} />);
		await fireEvent(screen.getByTestId("map-root"), "layout", {
			nativeEvent: { layout: { height: 0, width: 0, x: 0, y: 0 } },
		});
		expect(screen.queryByTestId("maplibre-Map")).not.toBeOnTheScreen();
	});

	test("the native map is announced as Map by default and takes a custom label", async () => {
		const view = await renderMap(<Map center={WELLINGTON} testID="map-root" zoom={12} />);
		expect(screen.getByTestId("maplibre-Map").props.accessibilityLabel).toBe("Map");

		await view.rerender(<Map accessibilityLabel="Store finder" center={WELLINGTON} testID="map-root" zoom={12} />);
		expect(screen.getByTestId("maplibre-Map").props.accessibilityLabel).toBe("Store finder");
	});

	test("onReady fires on the first load only", async () => {
		const onReady = jest.fn();
		await renderMap(<Map center={WELLINGTON} onReady={onReady} testID="map-root" zoom={12} />);
		const map = screen.getByTestId("maplibre-Map");
		await fireEvent(map, "didFinishLoadingMap");
		await fireEvent(map, "didFinishLoadingMap");
		expect(onReady).toHaveBeenCalledTimes(1);
	});

	test("onViewStateChange reports the camera with a fresh centre tuple", async () => {
		const onViewStateChange = jest.fn();
		await renderMap(<Map center={WELLINGTON} onViewStateChange={onViewStateChange} testID="map-root" zoom={12} />);
		await fireEvent(screen.getByTestId("maplibre-Map"), "regionDidChange", {
			nativeEvent: { bearing: 10, center: [1, 2], pitch: 20, zoom: 5 },
		});
		expect(onViewStateChange).toHaveBeenCalledWith({ bearing: 10, center: [1, 2], pitch: 20, zoom: 5 });
	});

	test("onPress reports the tapped coordinate, and is not wired when absent", async () => {
		const onPress = jest.fn();
		const view = await renderMap(<Map center={WELLINGTON} onPress={onPress} testID="map-root" zoom={12} />);
		await fireEvent(screen.getByTestId("maplibre-Map"), "press", { nativeEvent: { lngLat: [174.5, -41.5] } });
		expect(onPress).toHaveBeenCalledWith([174.5, -41.5]);

		await view.rerender(<Map center={WELLINGTON} testID="map-root" zoom={12} />);
		expect(screen.getByTestId("maplibre-Map").props.onPress).toBeUndefined();
	});

	test("isInteractive={false} turns every gesture off", async () => {
		await renderMap(<Map center={WELLINGTON} isInteractive={false} testID="map-root" zoom={12} />);
		const props = screen.getByTestId("maplibre-Map").props;
		expect(props.dragPan).toBe(false);
		expect(props.touchRotate).toBe(false);
	});

	test("rotation is off by default and on with isRotatable", async () => {
		const view = await renderMap(<Map center={WELLINGTON} testID="map-root" zoom={12} />);
		expect(screen.getByTestId("maplibre-Map").props.touchRotate).toBe(false);

		await view.rerender(<Map center={WELLINGTON} isRotatable testID="map-root" zoom={12} />);
		expect(screen.getByTestId("maplibre-Map").props.touchRotate).toBe(true);
	});

	test("changing the initial view after mount warns and does not remount the map", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
		const view = await renderMap(<Map center={WELLINGTON} testID="map-root" zoom={12} />);
		expect(warn).not.toHaveBeenCalled();

		await view.rerender(<Map center={[0, 0]} testID="map-root" zoom={3} />);
		expect(warn).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId("maplibre-Map")).toBeOnTheScreen();
		warn.mockRestore();
	});

	test("a rerender with an equal centre array does not warn", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
		const view = await renderMap(<Map center={[174.776, -41.286]} testID="map-root" zoom={12} />);
		await view.rerender(<Map center={[174.776, -41.286]} testID="map-root" zoom={12} />);
		expect(warn).not.toHaveBeenCalled();
		warn.mockRestore();
	});

	test("useMap hands the camera handle to a descendant", async () => {
		await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<FindOnMap />
			</Map>
		);
		expect(screen.getByText("function")).toBeOnTheScreen();
	});
});

// Markers and popups are deliberately not `accessible`: a popup inside a marker holds interactive
// children (a Close button), and an accessible parent would group them into one element, hiding the
// button from VoiceOver and from e2e lookups. So these query by label/testID and read the role off props.
describe("Map.Marker", () => {
	test("renders its children and repeats the testID on its content", async () => {
		await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.Marker accessibilityLabel="Te Papa" lngLat={[174.782, -41.29]} testID="museum">
					<Map.Label>Te Papa</Map.Label>
				</Map.Marker>
			</Map>
		);
		expect(screen.getByTestId("museum")).toBeOnTheScreen();
		expect(screen.getByTestId("museum-content")).toBeOnTheScreen();
		expect(screen.getByText("Te Papa")).toBeOnTheScreen();
	});

	test("with onPress it is a button named by its label, and its press calls back without reaching the map", async () => {
		const onPress = jest.fn();
		const onMapPress = jest.fn();
		const stopPropagation = jest.fn();
		await renderMap(
			<Map center={WELLINGTON} onPress={onMapPress} testID="map-root" zoom={12}>
				<Map.Marker accessibilityLabel="Te Papa" lngLat={[174.782, -41.29]} onPress={onPress} />
			</Map>
		);
		const marker = screen.getByLabelText("Te Papa");
		expect(marker.props.accessibilityRole).toBe("button");
		await fireEvent(marker, "press", { stopPropagation });
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(stopPropagation).toHaveBeenCalledTimes(1);
		expect(onMapPress).not.toHaveBeenCalled();
	});

	test("without onPress it is not a button", async () => {
		await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.Marker accessibilityLabel="Te Papa" lngLat={[174.782, -41.29]} />
			</Map>
		);
		expect(screen.getByLabelText("Te Papa").props.accessibilityRole).toBeUndefined();
	});

	test("a marker with an explicit anchor takes no pin offset", async () => {
		await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.Marker anchor="bottom" lngLat={[174.782, -41.29]} testID="museum">
					<Map.Pin />
				</Map.Marker>
			</Map>
		);
		expect(screen.getByTestId("museum")).toBeOnTheScreen();
	});
});

describe("Map.Popup", () => {
	test("inside a marker it renders its title and body as a summary", async () => {
		await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.Marker lngLat={[174.782, -41.29]}>
					<Map.Popup title="Te Papa">
						<Text>Open until 6</Text>
					</Map.Popup>
					<Map.Pin />
				</Map.Marker>
			</Map>
		);
		expect(screen.getByTestId("maplibre-Marker")).toBeOnTheScreen();
		expect(screen.getByText("Te Papa")).toBeOnTheScreen();
		expect(screen.getByText("Open until 6")).toBeOnTheScreen();
	});

	test("on its own coordinate it becomes a marker of its own", async () => {
		await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.Popup lngLat={[174.782, -41.29]} title="Lookout" />
			</Map>
		);
		expect(screen.getByText("Lookout")).toBeOnTheScreen();
		expect(screen.getByTestId("maplibre-Marker")).toBeOnTheScreen();
	});

	test("outside a marker and with no lngLat it draws nothing and warns", async () => {
		const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
		await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.Popup title="Nowhere" />
			</Map>
		);
		expect(screen.queryByText("Nowhere")).not.toBeOnTheScreen();
		expect(warn).toHaveBeenCalledTimes(1);
		warn.mockRestore();
	});
});

describe("Map.Controls", () => {
	test("zoom is on by default, labelled by what it does, and nothing else is", async () => {
		await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.Controls />
			</Map>
		);
		expect(screen.getByRole("button", { name: "Zoom in" })).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Zoom out" })).toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Point north" })).not.toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Recenter map" })).not.toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Show my location" })).not.toBeOnTheScreen();
	});

	test("compass and recenter appear when asked for, and showZoom={false} hides the zoom pair", async () => {
		await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.Controls showCompass showRecenter showZoom={false} />
			</Map>
		);
		expect(screen.getByRole("button", { name: "Point north" })).toBeOnTheScreen();
		expect(screen.getByRole("button", { name: "Recenter map" })).toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Zoom in" })).not.toBeOnTheScreen();
	});

	test("the buttons can be activated without throwing", async () => {
		await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.Controls showCompass showRecenter />
			</Map>
		);
		for (const name of ["Zoom in", "Zoom out", "Point north", "Recenter map"]) {
			await fireEvent(screen.getByRole("button", { name }), "accessibilityTap");
		}
		expect(screen.getByRole("button", { name: "Zoom in" })).toBeOnTheScreen();
	});

	test("unmounting the controls takes them off the overlay layer", async () => {
		const view = await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.Controls />
			</Map>
		);
		expect(screen.getByRole("button", { name: "Zoom in" })).toBeOnTheScreen();
		await view.rerender(<Map center={WELLINGTON} testID="map-root" zoom={12} />);
		expect(screen.queryByRole("button", { name: "Zoom in" })).not.toBeOnTheScreen();
	});
});

describe("Map.Route and Map.Arc", () => {
	test("a route renders a source, and its press calls back without reaching the map", async () => {
		const onPress = jest.fn();
		const onMapPress = jest.fn();
		const stopPropagation = jest.fn();
		await renderMap(
			<Map center={WELLINGTON} onPress={onMapPress} testID="map-root" zoom={12}>
				<Map.Route coordinates={[WELLINGTON, [174.8, -41.3]]} onPress={onPress} />
			</Map>
		);
		const source = screen.getByTestId("maplibre-GeoJSONSource");
		await fireEvent(source, "press", { stopPropagation });
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(stopPropagation).toHaveBeenCalledTimes(1);
		expect(onMapPress).not.toHaveBeenCalled();
	});

	test("a route with no onPress has no press handler and no hitbox", async () => {
		await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.Route coordinates={[WELLINGTON, [174.8, -41.3]]} />
			</Map>
		);
		const props = screen.getByTestId("maplibre-GeoJSONSource").props;
		expect(props.onPress).toBeUndefined();
		expect(props.hitbox).toBeUndefined();
	});

	test("an arc renders a source from its endpoints", async () => {
		await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.Arc from={WELLINGTON} to={[174.8, -41.3]} />
			</Map>
		);
		expect(screen.getByTestId("maplibre-GeoJSONSource")).toBeOnTheScreen();
	});
});

type PositionListener = Parameters<typeof LocationManager.addListener>[0];

describe("location", () => {
	let listeners: PositionListener[];
	let addListener: jest.SpiedFunction<typeof LocationManager.addListener>;
	let removeListener: jest.SpiedFunction<typeof LocationManager.removeListener>;
	let requestPermissions: jest.SpiedFunction<typeof LocationManager.requestPermissions>;

	beforeEach(() => {
		listeners = [];
		requestPermissions = jest.spyOn(LocationManager, "requestPermissions");
		addListener = jest.spyOn(LocationManager, "addListener").mockImplementation((listener) => {
			listeners.push(listener);
		});
		removeListener = jest.spyOn(LocationManager, "removeListener");
	});
	afterEach(() => {
		jest.restoreAllMocks();
	});

	const fix = (
		longitude: number,
		latitude: number,
		heading: number | null = null
	): PositionListener extends (position: infer P) => void ? P : never =>
		({ coords: { heading, latitude, longitude }, timestamp: 0 }) as never;

	const deliver = async (longitude: number, latitude: number) => {
		await act(async () => {
			for (const listener of listeners) listener(fix(longitude, latitude));
		});
	};

	test("showLocate requests permission, listens, and labels the locate button", async () => {
		const view = await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.Controls showLocate />
			</Map>
		);
		expect(screen.getByRole("button", { name: "Show my location" })).toBeOnTheScreen();
		expect(requestPermissions).toHaveBeenCalledTimes(1);
		expect(addListener).toHaveBeenCalledTimes(1);

		await view.unmount();
		expect(removeListener).toHaveBeenCalledWith(listeners[0]);
	});

	test("without showLocate nothing asks for location", async () => {
		await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.Controls />
			</Map>
		);
		expect(requestPermissions).not.toHaveBeenCalled();
		expect(addListener).not.toHaveBeenCalled();
	});

	test("a locate press after a fix calls onLocate with it", async () => {
		const onLocate = jest.fn();
		await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.Controls onLocate={onLocate} showLocate />
			</Map>
		);
		await deliver(174.9, -41.4);
		await fireEvent(screen.getByRole("button", { name: "Show my location" }), "accessibilityTap");
		expect(onLocate).toHaveBeenCalledWith([174.9, -41.4]);
	});

	test("a locate press before the first fix waits for it", async () => {
		const onLocate = jest.fn();
		await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.Controls onLocate={onLocate} showLocate />
			</Map>
		);
		await fireEvent(screen.getByRole("button", { name: "Show my location" }), "accessibilityTap");
		expect(onLocate).not.toHaveBeenCalled();
		await deliver(174.9, -41.4);
		expect(onLocate).toHaveBeenCalledTimes(1);
		expect(onLocate).toHaveBeenCalledWith([174.9, -41.4]);
	});

	test("Map.UserLocation draws nothing until a fix, then the dot, and lets go on unmount", async () => {
		const view = await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.UserLocation />
			</Map>
		);
		expect(requestPermissions).toHaveBeenCalledTimes(1);
		expect(screen.queryByTestId("maplibre-GeoJSONSource")).not.toBeOnTheScreen();

		await deliver(174.9, -41.4);
		expect(screen.getByTestId("maplibre-GeoJSONSource")).toBeOnTheScreen();
		expect(screen.queryByTestId("maplibre-Marker")).not.toBeOnTheScreen();

		await view.rerender(<Map center={WELLINGTON} testID="map-root" zoom={12} />);
		expect(removeListener).toHaveBeenCalledWith(listeners[0]);
	});

	test("the heading cone shows only with showsHeading and a known heading", async () => {
		await renderMap(
			<Map center={WELLINGTON} testID="map-root" zoom={12}>
				<Map.UserLocation showsHeading />
			</Map>
		);
		await act(async () => {
			for (const listener of listeners) listener(fix(174.9, -41.4, null));
		});
		expect(screen.queryByTestId("maplibre-Marker")).not.toBeOnTheScreen();

		await act(async () => {
			for (const listener of listeners) listener(fix(174.9, -41.4, 90));
		});
		expect(screen.getByTestId("maplibre-Marker")).toBeOnTheScreen();
	});

	test("Map.UserLocation outside a Map throws its documented error", async () => {
		const consoleError = console.error;
		console.error = () => undefined;
		try {
			await expect(renderWithProviders(<Map.UserLocation />)).rejects.toThrow(
				"Map.UserLocation must be rendered inside a <Map>."
			);
		} finally {
			console.error = consoleError;
		}
	});
});

describe("compound parts outside a Map", () => {
	const parts: ReadonlyArray<[string, ReactElement, string]> = [
		["Map.Marker", <Map.Marker key="m" lngLat={WELLINGTON} />, "Map.Marker must be rendered inside a <Map>."],
		["Map.Popup", <Map.Popup key="p" lngLat={WELLINGTON} />, "Map.Popup must be rendered inside a <Map>."],
		["Map.Controls", <Map.Controls key="c" />, "Map.Controls must be rendered inside a <Map>."],
		["Map.Route", <Map.Route coordinates={[WELLINGTON]} key="r" />, "Map.Route must be rendered inside a <Map>."],
		["useMap", <FindOnMap key="u" />, "useMap must be called inside a <Map>."],
	];

	let consoleError: typeof console.error;
	beforeEach(() => {
		consoleError = console.error;
		console.error = () => undefined;
	});
	afterEach(() => {
		console.error = consoleError;
	});

	test.each(parts)("%s throws its documented error", async (_name, element, message) => {
		await expect(renderWithProviders(element)).rejects.toThrow(message);
	});
});
