/** Pulsar's haptics, which have no Jest mock of their own. A setup file, beside `setup.ts`. */
import { jest } from "@jest/globals";
import { mockDeepStub } from "../mock-stub";

jest.mock("react-native-pulsar", () => ({
	Presets: mockDeepStub(),
	Settings: mockDeepStub(),
	useRealtimeComposer: () => mockDeepStub(),
	usePatternComposer: () => mockDeepStub(),
	useAdaptiveHaptics: () => mockDeepStub(),
	HapticSupport: {},
	RealtimeComposerStrategy: {},
}));
