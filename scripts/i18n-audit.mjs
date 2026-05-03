import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const locales = ["en", "nl", "de", "fr", "es", "pt"];

function flatten(value, prefix = "", output = {}) {
  for (const [key, nestedValue] of Object.entries(value)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (
      nestedValue &&
      typeof nestedValue === "object" &&
      !Array.isArray(nestedValue)
    ) {
      flatten(nestedValue, nextKey, output);
    } else {
      output[nextKey] = nestedValue;
    }
  }

  return output;
}

function walkFiles(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      ["node_modules", ".next", ".git", "test-results", "playwright-report"].includes(
        entry.name,
      )
    ) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, output);
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      output.push(fullPath);
    }
  }

  return output;
}

function getLine(sourceFile, position) {
  return sourceFile.getLineAndCharacterOfPosition(position).line + 1;
}

function getScope(node, sourceFile) {
  let current = node.parent;
  while (current) {
    if (
      ts.isFunctionDeclaration(current) ||
      ts.isFunctionExpression(current) ||
      ts.isArrowFunction(current) ||
      ts.isMethodDeclaration(current) ||
      ts.isBlock(current) ||
      ts.isSourceFile(current)
    ) {
      return {
        start: current.getStart(sourceFile),
        end: current.getEnd(),
      };
    }
    current = current.parent;
  }

  return {
    start: sourceFile.getStart(sourceFile),
    end: sourceFile.getEnd(),
  };
}

function collectTranslationCalls() {
  const refs = [];

  for (const file of walkFiles(path.join(root, "src"))) {
    const source = fs.readFileSync(file, "utf8");
    const sourceFile = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      /\.(tsx|jsx)$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const translators = [];

    function scanDeclarations(node) {
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.initializer &&
        ts.isCallExpression(node.initializer)
      ) {
        const callee = node.initializer.expression.getText(sourceFile);
        const firstArg = node.initializer.arguments[0];
        if (
          (callee === "useTranslations" || callee === "getTranslations") &&
          firstArg &&
          ts.isStringLiteralLike(firstArg)
        ) {
          translators.push({
            name: node.name.text,
            namespace: firstArg.text,
            ...getScope(node, sourceFile),
          });
        }
      }

      ts.forEachChild(node, scanDeclarations);
    }

    function resolveTranslator(name, position) {
      return translators
        .filter(
          (translator) =>
            translator.name === name &&
            translator.start <= position &&
            position <= translator.end,
        )
        .sort((a, b) => b.start - a.start)[0];
    }

    function scanCalls(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression)
      ) {
        const translator = resolveTranslator(node.expression.text, node.getStart(sourceFile));
        const firstArg = node.arguments[0];
        if (translator && firstArg && ts.isStringLiteralLike(firstArg)) {
          refs.push({
            file: path.relative(root, file),
            line: getLine(sourceFile, node.pos),
            key: `${translator.namespace}.${firstArg.text}`,
          });
        }
      }

      ts.forEachChild(node, scanCalls);
    }

    scanDeclarations(sourceFile);
    scanCalls(sourceFile);
  }

  return [...new Map(refs.map((ref) => [ref.key, ref])).values()];
}

const messages = Object.fromEntries(
  locales.map((locale) => [
    locale,
    flatten(
      JSON.parse(
        fs.readFileSync(path.join(root, "messages", `${locale}.json`), "utf8"),
      ),
    ),
  ]),
);

const allKeys = [...new Set(locales.flatMap((locale) => Object.keys(messages[locale])))];
const enKeys = Object.keys(messages.en);
const referencedKeys = collectTranslationCalls();

const summary = {
  locales,
  keyCoverage: Object.fromEntries(
    locales.map((locale) => {
      const missingAny = allKeys.filter((key) => !(key in messages[locale]));
      const missingVsEnglish = enKeys.filter((key) => !(key in messages[locale]));
      const extraVsEnglish = Object.keys(messages[locale]).filter(
        (key) => !(key in messages.en),
      );

      return [
        locale,
        {
          keys: Object.keys(messages[locale]).length,
          missingAny: missingAny.length,
          missingVsEnglish: missingVsEnglish.length,
          extraVsEnglish: extraVsEnglish.length,
        },
      ];
    }),
  ),
  referencedKeys: referencedKeys.length,
  missingReferencedKeys: [],
};

for (const ref of referencedKeys) {
  const missingLocales = locales.filter((locale) => !(ref.key in messages[locale]));
  if (missingLocales.length > 0) {
    summary.missingReferencedKeys.push({
      ...ref,
      missingLocales,
    });
  }
}

console.log(JSON.stringify(summary, null, 2));

if (summary.missingReferencedKeys.length > 0) {
  process.exitCode = 1;
}
