import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

const KEY = "test:key";

beforeEach(() => {
  window.localStorage.clear();
});

/** Deixa o `setTimeout(0)` interno do hook resolver. */
async function flushLoad() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 5));
  });
}

describe("useLocalStorageState", () => {
  it("returns the default value on the very first render (SSR-safe)", () => {
    window.localStorage.setItem(KEY, JSON.stringify(42));
    const { result } = renderHook(() => useLocalStorageState(KEY, 0));
    expect(result.current[0]).toBe(0);
  });

  it("swaps to the stored value shortly after mounting", async () => {
    window.localStorage.setItem(KEY, JSON.stringify(42));
    const { result } = renderHook(() => useLocalStorageState(KEY, 0));
    await waitFor(() => expect(result.current[0]).toBe(42));
  });

  it("keeps the default value when nothing is stored", async () => {
    const { result } = renderHook(() => useLocalStorageState(KEY, 7));
    await flushLoad();
    expect(result.current[0]).toBe(7);
  });

  it("falls back to the default value on malformed JSON", async () => {
    window.localStorage.setItem(KEY, "{not-json");
    const { result } = renderHook(() => useLocalStorageState(KEY, 5));
    await waitFor(() => expect(result.current[0]).toBe(5));
  });

  it("falls back to the default value when localStorage throws", async () => {
    const getItemSpy = vi
      .spyOn(Object.getPrototypeOf(window.localStorage) as Storage, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });

    const { result } = renderHook(() => useLocalStorageState(KEY, 3));
    await flushLoad();
    expect(result.current[0]).toBe(3);

    getItemSpy.mockRestore();
  });

  it("persists updates to localStorage after loading", async () => {
    const { result } = renderHook(() => useLocalStorageState(KEY, 0));
    await flushLoad();

    act(() => result.current[1](99));

    await waitFor(() => expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify(99)));
  });

  it("reloads when the key changes", async () => {
    window.localStorage.setItem("a", JSON.stringify(1));
    window.localStorage.setItem("b", JSON.stringify(2));

    const { result, rerender } = renderHook(({ key }) => useLocalStorageState(key, 0), {
      initialProps: { key: "a" },
    });
    await waitFor(() => expect(result.current[0]).toBe(1));

    rerender({ key: "b" });
    await waitFor(() => expect(result.current[0]).toBe(2));
  });

  it("supports custom serialize/deserialize for non-JSON-native types like Set", async () => {
    const { result } = renderHook(() =>
      useLocalStorageState<Set<string>>(KEY, new Set(), {
        serialize: (value) => JSON.stringify([...value]),
        deserialize: (raw) => new Set(JSON.parse(raw) as string[]),
      })
    );
    await flushLoad();

    act(() => result.current[1](new Set(["a", "b"])));

    await waitFor(() => expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify(["a", "b"])));
  });
});
