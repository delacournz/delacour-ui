/** `expo-linear-gradient` as a plain `View`. A setup file, beside `setup.ts`. */
import { jest } from "@jest/globals";

jest.mock("expo-linear-gradient", () => ({ LinearGradient: require("react-native").View }));
