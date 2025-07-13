import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import Avatar from "./Avatar.svelte";

describe("Avatar", () => {
  it("should render", () => {
    const { container } = render(Avatar, {
      src: "https://picsum.photos/200",
      alt: "Picsum"
    });

    expect(container.querySelector("img")?.src).toBe("https://picsum.photos/200");
  });

  it("should render with fallback", () => {
    const { container } = render(Avatar, {
      alt: "Picsum",
      fallback: "N"
    });

    expect(container.querySelector("span")?.textContent).toBe("N");
  });

  it("should render online", () => {
    const { container } = render(Avatar, {
      online: true
    });

    expect(container.querySelector(".ring-2")).toBeTruthy();
  });
});