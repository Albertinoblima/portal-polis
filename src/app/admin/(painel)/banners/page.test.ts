import { describe, expect, it } from "vitest";
import { isValidBannerDimensions } from "./page";

describe("isValidBannerDimensions", () => {
    it("accepts proportional 5:4 variants such as 1200x960 and 960x768", () => {
        expect(isValidBannerDimensions(1200, 960)).toBe(true);
        expect(isValidBannerDimensions(960, 768)).toBe(true);
    });

    it("rejects non-proportional sizes", () => {
        expect(isValidBannerDimensions(1200, 900)).toBe(false);
        expect(isValidBannerDimensions(1000, 700)).toBe(false);
    });
});
