/** `expo-blur` as a plain `View`. A setup file, beside `setup.ts`. */
import { jest } from "@jest/globals";

jest.mock("expo-blur", () => ({ BlurView: require("react-native").View }));
