import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      IS_PROD_CHECK: process.env.NODE_ENV === "production",
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      ALLOW_MOCK_A11Y: process.env.ALLOW_MOCK_A11Y,
    },
    dependencies: {
      hasPlaywrightCore: false,
      hasSparticuzChromium: false,
      hasAxeCore: false,
    },
    test: {
      chromiumLaunch: null as any,
      error: null as any,
    },
  };

  // Test if dependencies are available
  try {
    await import("playwright-core");
    diagnostics.dependencies.hasPlaywrightCore = true;
  } catch (e: any) {
    diagnostics.dependencies.playwrightError = e.message;
  }

  try {
    await import("@sparticuz/chromium");
    diagnostics.dependencies.hasSparticuzChromium = true;
  } catch (e: any) {
    diagnostics.dependencies.chromiumError = e.message;
  }

  try {
    await import("@axe-core/playwright");
    diagnostics.dependencies.hasAxeCore = true;
  } catch (e: any) {
    diagnostics.dependencies.axeError = e.message;
  }

  // Try to launch chromium
  if (diagnostics.dependencies.hasPlaywrightCore && diagnostics.dependencies.hasSparticuzChromium) {
    try {
      const pwCore = await import("playwright-core");
      const spartChromium = await import("@sparticuz/chromium");

      const chromium = pwCore.chromium;
      const chromiumExecutable = spartChromium.default ?? spartChromium;

      const execPath = await chromiumExecutable.executablePath();
      diagnostics.test.executablePath = execPath;
      diagnostics.test.hasArgs = !!chromiumExecutable.args;
      diagnostics.test.argsCount = chromiumExecutable.args?.length;

      const browser = await chromium.launch({
        args: chromiumExecutable.args,
        executablePath: execPath,
        headless: true,
        timeout: 30000,
      });

      diagnostics.test.chromiumLaunch = "SUCCESS";

      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto("https://example.com", { timeout: 15000 });
      const title = await page.title();

      diagnostics.test.pageTitle = title;
      diagnostics.test.fullSuccess = true;

      await browser.close();
    } catch (error: any) {
      diagnostics.test.chromiumLaunch = "FAILED";
      diagnostics.test.error = {
        message: error.message,
        code: error.code,
        stack: error.stack,
      };
    }
  }

  return NextResponse.json(diagnostics, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
