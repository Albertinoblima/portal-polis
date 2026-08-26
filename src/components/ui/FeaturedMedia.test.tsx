import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FeaturedMedia } from "./FeaturedMedia";

// Simula o IntersectionObserver (jsdom não implementa) guardando a instância
// mais recente para o teste disparar `trigger()` manualmente, como o
// navegador faria ao vídeo entrar/sair de viewport.
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

  trigger(isIntersecting: boolean) {
    this.callback([{ isIntersecting } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  // jsdom não implementa play()/load() de <video> — sem isso, video.play()
  // retorna undefined e o .catch() do componente estoura um TypeError real.
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.load = vi.fn();
  HTMLMediaElement.prototype.pause = vi.fn();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("FeaturedMedia (vídeo)", () => {
  it("não inclui <source> nem chama play() antes de entrar em viewport", () => {
    const { container } = render(<FeaturedMedia imageUrl="/poster.jpg" videoUrl="/video.mp4" alt="Vídeo de teste" />);

    expect(container.querySelector("source")).toBeNull();
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it("materializa o <source> e toca só quando o IntersectionObserver reporta visibilidade", () => {
    const { container } = render(<FeaturedMedia imageUrl="/poster.jpg" videoUrl="/video.mp4" alt="Vídeo de teste" />);
    const observer = FakeIntersectionObserver.instances.at(-1);

    act(() => observer?.trigger(true));

    const source = container.querySelector("source");
    expect(source).toHaveAttribute("src", "/video.mp4");
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalledTimes(1);
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
  });

  it("pausa ao sair de viewport sem remover o <source> já carregado", () => {
    const { container } = render(<FeaturedMedia imageUrl="/poster.jpg" videoUrl="/video.mp4" alt="Vídeo de teste" />);
    const observer = FakeIntersectionObserver.instances.at(-1);

    act(() => observer?.trigger(true));
    act(() => observer?.trigger(false));

    expect(container.querySelector("source")).toHaveAttribute("src", "/video.mp4");
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalledTimes(1);
    // Nunca recarrega: a "trava" (shouldLoad) só liga uma vez.
    expect(HTMLMediaElement.prototype.load).toHaveBeenCalledTimes(1);
  });
});
