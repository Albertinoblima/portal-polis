export const SIDEBAR_DIMENSIONS = { width: 1200, height: 960 };
const SIDEBAR_ASPECT_RATIO = SIDEBAR_DIMENSIONS.width / SIDEBAR_DIMENSIONS.height;
const SIDEBAR_RATIO_TOLERANCE = 0.01;

export function isValidBannerDimensions(width: number, height: number): boolean {
    if (width <= 0 || height <= 0) {
        return false;
    }

    const ratio = width / height;
    return Math.abs(ratio - SIDEBAR_ASPECT_RATIO) <= SIDEBAR_RATIO_TOLERANCE;
}
