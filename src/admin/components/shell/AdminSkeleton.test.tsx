// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { expect, it } from "vitest";
import AdminSkeleton from "./AdminSkeleton";

it("renders the requested number of skeleton rows", () => {
  const { container } = render(<AdminSkeleton rows={3} />);
  expect(container.querySelectorAll(".admin-skeleton-line")).toHaveLength(3);
});

it("renders a structured, accessible variant", () => {
  const { getByRole, container } = render(
    <AdminSkeleton variant="workbench" rows={3} />,
  );
  expect(getByRole("status")).toHaveAttribute("aria-busy", "true");
  expect(
    container.querySelector('[data-skeleton-variant="workbench"]'),
  ).toBeTruthy();
  expect(container.querySelectorAll(".admin-skeleton-form > div")).toHaveLength(
    3,
  );
});
