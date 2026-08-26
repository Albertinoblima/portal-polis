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

  it("não toca se o primeiro clique for num controle de áudio (evita sobrepor com o áudio da matéria), mas ainda marca a sessão", () => {
    render(<WelcomeChime />);
    document.body.innerHTML = '<button data-audio-control>Ouvir matéria</button>';
    const audioButton = document.querySelector("[data-audio-control]") as HTMLButtonElement;

    fireEvent.click(audioButton);

    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBe("1");
  });

  it("também não toca se o clique cair num elemento filho do controle de áudio (ex.: ícone/label)", () => {
    render(<WelcomeChime />);
    document.body.innerHTML = '<button data-audio-control><span>Ouvir matéria</span></button>';
    const label = document.querySelector("span") as HTMLSpanElement;

    fireEvent.click(label);

    expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
});
