import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useInlineVideoAutoplay } from "@/hooks/useInlineVideoAutoplay";

// Mesmo raciocínio de FeaturedMedia.test.tsx: jsdom não implementa
// IntersectionObserver, então simulamos guardando a instância mais recente
// para o teste disparar `trigger()` manualmente.
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  trigger(target: Element, isIntersecting: boolean) {
    this.callback(
      [{ target, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    );
  }
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.load = vi.fn();
  HTMLMediaElement.prototype.pause = vi.fn();

  // Mesma marcação que buildVideoSnippet (transcode-gif-media.mjs) gera:
  // data-video-src, sem <source> nenhum de início.
  document.body.innerHTML = `
    <div data-tts-body="materia-x">
      <video data-inline-video data-video-src="/gif-convertido.mp4"></video>
    </div>
  `;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

describe("useInlineVideoAutoplay", () => {
  it("não materializa <source> antes do vídeo entrar em viewport", () => {
    renderHook(() => useInlineVideoAutoplay(0));

    const video = document.querySelector("video");
    expect(video?.querySelector("source")).toBeNull();
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it("materializa o <source> a partir de data-video-src e toca ao entrar em viewport", () => {
    renderHook(() => useInlineVideoAutoplay(0));
    const video = document.querySelector("video") as HTMLVideoElement;
    const observer = FakeIntersectionObserver.instances.at(-1);

    act(() => observer?.trigger(video, true));

    const source = video.querySelector("source");
    expect(source).toHaveAttribute("src", "/gif-convertido.mp4");
    expect(video.dataset.videoSrc).toBeUndefined();
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalledTimes(1);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
  });

  it("pausa ao sair de viewport sem duplicar o <source> ao voltar a entrar", () => {
    renderHook(() => useInlineVideoAutoplay(0));
    const video = document.querySelector("video") as HTMLVideoElement;
    const observer = FakeIntersectionObserver.instances.at(-1);

    act(() => observer?.trigger(video, true));
    act(() => observer?.trigger(video, false));
    act(() => observer?.trigger(video, true));

    expect(video.querySelectorAll("source")).toHaveLength(1);
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalledTimes(1);
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);
  });
});
