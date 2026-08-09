import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DraftSaveButton from "./DraftSaveButton";

const confirm = vi.fn();

vi.mock("@/admin/components/shell/AdminDialogProvider", () => ({ useAdminConfirm: () => confirm }));

describe("DraftSaveButton", () => {
  beforeEach(() => confirm.mockResolvedValue(true));

  it("saves routine changes immediately and exposes their status", () => {
    const onSave = vi.fn();
    render(<DraftSaveButton snapshot='{"title":"before"}' draft={{ title: "after" }} dirty saving={false} onSave={onSave} />);

    expect(screen.getByRole("status")).toHaveTextContent("1건 변경됨");
    fireEvent.click(screen.getByRole("button", { name: /변경사항 저장/ }));

    expect(confirm).not.toHaveBeenCalled();
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("keeps confirmation available for high-impact changes", async () => {
    const onSave = vi.fn();
    render(<DraftSaveButton snapshot="{}" draft={{ published: true }} dirty saving={false} requireConfirmation onSave={onSave} />);

    fireEvent.click(screen.getByRole("button", { name: /변경사항 저장/ }));

    expect(confirm).toHaveBeenCalledOnce();
    await vi.waitFor(() => expect(onSave).toHaveBeenCalledOnce());
  });
});
