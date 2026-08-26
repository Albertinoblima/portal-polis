import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WelcomeChime } from "./WelcomeChime";

const SESSION_KEY = "portal-polis:welcome-played";

beforeEach(() => {
  window.sessionStorage.clear();
  // jsdom não implementa play() de verdade — sem isso, play() retorna
  // undefined e o .catch() do componente estoura um TypeError real.
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("WelcomeChime", () => {
  it("não toca nada antes do primeiro clique", () => {
    render(<WelcomeChime />);
    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });

  it("toca no primeiro clique em qualquer lugar da página e marca a sessão", () => {
    render(<WelcomeChime />);

    fireEvent.click(document.body);

    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBe("1");
  });

  it("não toca de novo num segundo clique na mesma sessão", () => {
    render(<WelcomeChime />);

    fireEvent.click(document.body);
    fireEvent.click(document.body);

    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
  });

  it("não toca se a sessão já tinha a saudação marcada antes de montar", () => {
    window.sessionStorage.setItem(SESSION_KEY, "1");
    render(<WelcomeChime />);

    fireEvent.click(document.body);

    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
});
