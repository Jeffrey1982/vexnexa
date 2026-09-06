import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

const mocks = vi.hoisted(() => ({
  findPosts: vi.fn(),
  createPost: vi.fn(),
  updatePost: vi.fn(),
  findAuthor: vi.fn(),
  notify: vi.fn(),
  generate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    blogPost: { findMany: mocks.findPosts, create: mocks.createPost, update: mocks.updatePost },
    user: { findFirst: mocks.findAuthor },
  },
}));
vi.mock("@/lib/email", () => ({ sendBlogDraftNotification: mocks.notify }));
vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() { return { generateContent: mocks.generate }; }
  },
}));

const draft = {
  title: "Accessibility checks for agencies",
  metaTitle: "Agency accessibility checks",
  metaDescription: "Automated findings and white-label reports, with human review still needed.",
  excerpt: "Compare automated findings between scans.",
  html: '<p>Automated checks do not find everything. Explore the <a href="https://vexnexa.com/for-agencies">paid Agency plan</a>.</p>',
};
const modelResponse = (payload = draft) => ({ response: { text: () => JSON.stringify(payload) } });
const request = (method = "GET", authorized = true) => new NextRequest("http://localhost/api/cron/blog-draft", {
  method,
  headers: authorized ? { authorization: "Bearer isolated-blog-cron-secret" } : undefined,
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRON_SECRET", "isolated-blog-cron-secret");
  vi.stubEnv("GOOGLE_GEMINI_API_KEY", "test-placeholder");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example");
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected network request"); }));
  mocks.findPosts.mockResolvedValue([]);
  mocks.findAuthor.mockResolvedValue({ id: "admin-test-id" });
  mocks.createPost.mockResolvedValue({ id: "draft-test-id" });
  mocks.notify.mockResolvedValue(undefined);
  mocks.generate.mockResolvedValue(modelResponse());
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("new blog draft campaign copy", () => {
  it("instructs both languages to use the paid Agency offering without retired promotions or guarantees", async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, mode: "drafted" });
    expect(mocks.generate).toHaveBeenCalledTimes(2);
    const prompts = mocks.generate.mock.calls.map(([prompt]) => prompt as string);
    expect(prompts[0]).toContain("Write a blog post in English");
    expect(prompts[1]).toContain("Dutch (informal 'je')");
    for (const prompt of prompts) {
      expect(prompt).toContain("https://vexnexa.com/for-agencies");
      expect(prompt).toContain("https://vexnexa.com/pricing");
      expect(prompt).toContain("paid Agency plan");
      expect(prompt).toContain("white-label reporting");
      expect(prompt).toContain("human review and remediation remain necessary");
      expect(prompt).toContain("NEVER claim tools guarantee full accessibility or legal compliance");
      expect(prompt).not.toMatch(/founding-agencies|pilot-partner-program|first 10 agencies|12 months|30%/i);
    }
    expect(mocks.createPost).toHaveBeenCalledTimes(2);
    for (const [args] of mocks.createPost.mock.calls) {
      expect(args.data).toMatchObject({ status: "draft", authorId: "admin-test-id", content: draft.html });
    }
    expect(mocks.updatePost).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ["title", "Join the Founding Agency Program"],
    ["metaTitle", "Founding agency offer"],
    ["metaDescription", "Bekijk het pilotprogramma"],
    ["excerpt", "Join our pilot program"],
    ["html", '<p><a href="https://vexnexa.com/founding-agencies">Join us</a></p>'],
    ["html", '<p><a href="https://vexnexa.com/pilot-partner-program">Join us</a></p>'],
  ] as const)("refuses retired campaign output in %s before creating either draft", async (field, value) => {
    mocks.generate.mockResolvedValueOnce(modelResponse({ ...draft, [field]: value }));
    const response = await POST(request("POST"));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ ok: false, error: "Model response includes a retired founding/pilot promotion" });
    expect(mocks.createPost).not.toHaveBeenCalled();
    expect(mocks.updatePost).not.toHaveBeenCalled();
    expect(mocks.notify).toHaveBeenCalledWith(expect.objectContaining({ mode: "error" }));
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not store the English draft if the Dutch draft contains the retired offer", async () => {
    mocks.generate
      .mockResolvedValueOnce(modelResponse())
      .mockResolvedValueOnce(modelResponse({ ...draft, html: "<p>Bekijk het pilotprogramma.</p>" }));
    expect((await GET(request())).status).toBe(500);
    expect(mocks.generate).toHaveBeenCalledTimes(2);
    expect(mocks.createPost).not.toHaveBeenCalled();
    expect(mocks.updatePost).not.toHaveBeenCalled();
  });

  it("skips stored draft topics without rewriting old content", async () => {
    mocks.findPosts.mockResolvedValue([{ slug: "eaa-enforcement-2026-what-regulators-fine" }]);
    expect((await GET(request())).status).toBe(200);
    expect(mocks.createPost).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ slug: "reselling-accessibility-monitoring-agency-guide", status: "draft" }),
    }));
    expect(mocks.updatePost).not.toHaveBeenCalled();
  });

  it.each([GET, POST])("preserves cron authentication and performs no work without authorization", async (handler) => {
    expect((await handler(request("POST", false))).status).toBe(401);
    expect(mocks.findPosts).not.toHaveBeenCalled();
    expect(mocks.generate).not.toHaveBeenCalled();
    expect(mocks.createPost).not.toHaveBeenCalled();
    expect(mocks.notify).not.toHaveBeenCalled();
  });
});
