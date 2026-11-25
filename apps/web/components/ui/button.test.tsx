import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders an accessible button with its label", () => {
    render(<Button>Send</Button>);
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

  it("renders a link when asChild is set", () => {
    render(
      <Button asChild>
        <a href="/doctor">Open Crop Doctor</a>
      </Button>
    );

    const link = screen.getByRole("link", { name: "Open Crop Doctor" });
    expect(link).toHaveAttribute("href", "/doctor");
    expect(link).toHaveClass("bg-primary");
  });
});
