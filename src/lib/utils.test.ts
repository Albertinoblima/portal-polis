import { describe, expect, it } from "vitest";
import { cn, formatDate, slugify, withPlaceholderParam } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class names with a space", () => {
    expect(cn("a", "b", null, undefined, false, "c")).toBe("a b c");
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Reforma Tributária: Entenda o que muda")).toBe(
      "reforma-tributaria-entenda-o-que-muda"
    );
  });

  it("strips accents", () => {
    expect(slugify("Câmaras Municipais")).toBe("camaras-municipais");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  -Política-  ")).toBe("politica");
  });
});

describe("formatDate", () => {
  it("formats an ISO date in pt-BR long form", () => {
    expect(formatDate("2026-03-05T12:00:00.000Z")).toMatch(/2026/);
  });
});

describe("withPlaceholderParam", () => {
  it("returns the original params when non-empty", () => {
    const params = [{ slug: "a" }, { slug: "b" }];
    expect(withPlaceholderParam(params, { slug: "_placeholder" })).toBe(params);
  });

  it("returns a single placeholder when params is empty", () => {
    expect(withPlaceholderParam([], { slug: "_placeholder" })).toEqual([{ slug: "_placeholder" }]);
  });
});
