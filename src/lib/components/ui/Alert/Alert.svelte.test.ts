import { describe, expect, it } from "vitest";
import Alert from "./Alert.svelte";
import { render } from '@testing-library/svelte';

describe("Alert", () => {
  it("should render", () => {
    const { container, getByText } = render(Alert, {
      message: "Hello world"
    });
    expect(getByText("Hello world"))
  });

  it("should render with errors", () => {
    const { getAllByText, getByText } = render(Alert, {
      message: "Hello world",
      errors: {
        name: ["is required"],
        email: ["is required"]
      }
    });
    expect(getByText("Hello world"))
    expect(getByText("name"))
    expect(getByText("email"))
    expect(getAllByText((content) => content.includes("is required")).length).toBe(2);
  });
});