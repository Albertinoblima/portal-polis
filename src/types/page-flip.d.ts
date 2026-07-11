declare module "page-flip" {
  export type SizeType = "fixed" | "stretch";
  export type FlipCorner = "top" | "bottom";
  export type Orientation = "portrait" | "landscape";

  export interface FlipSetting {
    startPage: number;
    size: SizeType;
    width: number;
    height: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    drawShadow: boolean;
    flippingTime: number;
    usePortrait: boolean;
    startZIndex: number;
    autoSize: boolean;
    maxShadowOpacity: number;
    showCover: boolean;
    mobileScrollSupport: boolean;
    clickEventForward: boolean;
    useMouseEvents: boolean;
    swipeDistance: number;
    showPageCorners: boolean;
    disableFlipByClick: boolean;
  }

  export interface WidgetEvent {
    data: number | string | boolean | object;
    object: PageFlip;
  }

  export class PageFlip {
    constructor(element: HTMLElement, setting: Partial<FlipSetting>);
    destroy(): void;
    update(): void;
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    updateFromHtml(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    clear(): void;
    turnToPrevPage(): void;
    turnToNextPage(): void;
    turnToPage(page: number): void;
    flipNext(corner?: FlipCorner): void;
    flipPrev(corner?: FlipCorner): void;
    flip(page: number, corner?: FlipCorner): void;
    getPageCount(): number;
    getCurrentPageIndex(): number;
    getOrientation(): Orientation;
    getSettings(): FlipSetting;
    on(eventName: string, callback: (e: WidgetEvent) => void): PageFlip;
    off(eventName: string): void;
  }
}
