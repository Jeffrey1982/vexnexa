import { mkdir, writeFile } from "node:fs/promises";
import { Packer } from "docx";
import { buildDocx } from "../src/app/api/reports/[scanId]/docx/route";
import { resolveReportLabels } from "../src/lib/report/labels";
import { transformScanToReport } from "../src/lib/report/transform";

const locales = ["en", "nl", "de", "fr", "es", "pt"] as const;
const outputDir = "artifacts/docx-i18n";

async function main() {
  await mkdir(outputDir, { recursive: true });

  for (const locale of locales) {
    const labels = resolveReportLabels(null, locale);
    const report = transformScanToReport(
      {
        id: `docx-smoke-${locale}`,
        score: 78,
        issues: 3,
        impactCritical: 0,
        impactSerious: 1,
        impactModerate: 1,
        impactMinor: 1,
        createdAt: new Date("2026-06-14T12:00:00Z"),
        site: { url: "https://example.com" },
        page: { url: "https://example.com", title: "Example" },
        raw: {
          violations: [
            {
              id: "color-contrast",
              impact: "serious",
              help: "Elements must meet minimum color contrast",
              description: "Text has insufficient contrast.",
              tags: ["wcag143", "wcag2aa"],
              nodes: [
                {
                  target: [".hero-title"],
                  html: "<h1 class=\"hero-title\">Example</h1>",
                },
              ],
            },
          ],
        },
      },
      undefined,
      undefined,
      undefined,
      "corporate",
      labels,
    );
    const buffer = await Packer.toBuffer(buildDocx(report));
    await writeFile(`${outputDir}/report-${locale}.docx`, buffer);
  }

  console.log(`Generated ${locales.length} localized DOCX files in ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
