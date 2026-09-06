import { beforeEach, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const m = vi.hoisted(() => ({ auth: vi.fn(), purchase: vi.fn() }))
vi.mock("@/lib/auth", () => ({ requireAuth: m.auth }))
vi.mock("@/lib/billing/addon-flows", () => ({ purchaseAddOn: m.purchase, getUserAddOns: vi.fn() }))
import { POST } from "./route"

beforeEach(() => {
  vi.resetAllMocks()
  m.auth.mockResolvedValue({ id: "owner", email: "owner@example.test" })
  vi.spyOn(console, "error").mockImplementation(() => {})
})

it.each(["EXISTING_SEAT_BUNDLE", "ADDON_RECONCILIATION_REQUIRED"])("returns a conflict without reporting checkout success for %s", async code => {
  m.purchase.mockRejectedValue(Object.assign(new Error("Purchase requires quantity management or reconciliation"), { code }))
  const response = await POST(new NextRequest("https://app.example/api/billing/addons", { method: "POST", body: JSON.stringify({ type: "EXTRA_SEAT", quantity: 1 }) }))
  expect(response.status).toBe(409)
  expect(await response.json()).toMatchObject({ code })
  expect(m.purchase).toHaveBeenCalledWith({ userId: "owner", type: "EXTRA_SEAT", quantity: 1 })
})
