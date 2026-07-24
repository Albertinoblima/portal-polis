export const GAME_INTERACTION_EVENT = "polis:game-interaction-lock";

interface GameInteractionDetail {
    locked: boolean;
    source: string;
}

export function emitGameInteractionLock(locked: boolean, source: string): void {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
        new CustomEvent<GameInteractionDetail>(GAME_INTERACTION_EVENT, {
            detail: { locked, source },
        })
    );
}