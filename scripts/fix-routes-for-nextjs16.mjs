import fs from 'fs';
import { glob } from 'glob';

const files = await glob('src/app/**/route.ts');
let fixed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Step 1: Update type signature from { params: {...} } to { params: Promise<{...}> }
  // Match the pattern more carefully - params could be on same line or different line
  content = content.replace(
    /\{\s*params\s*\}:\s*\{\s*params:\s*\{([^}]+)\}\s*\}/g,
    '{ params }: { params: Promise<{$1}> }'
  );

  // Step 2: Add await params destructuring at the start of function body
  // Only process files that have Promise params and actually use params
  if (content.includes('params: Promise<{') && content.includes('params.')) {
    // Extract param names from the Promise type
    const paramMatches = content.matchAll(/params:\s*Promise<\{([^}]+)\}>/g);

    for (const paramMatch of paramMatches) {
      const paramNames = paramMatch[1]
        .split(',')
        .map(p => p.split(':')[0].trim())
        .filter(Boolean);

      if (paramNames.length > 0) {
        // Find the export async function that comes before this params match
        const beforeMatch = content.substring(0, paramMatch.index);
        const funcMatches = [...beforeMatch.matchAll(/export\s+async\s+function\s+(\w+)/g)];

        if (funcMatches.length > 0) {
          const lastFunc = funcMatches[funcMatches.length - 1];
          const funcName = lastFunc[1];

          // Find the opening brace of this function
          // Look for pattern: export async function NAME(...) {
          const funcPattern = new RegExp(
            `export\\s+async\\s+function\\s+${funcName}[^{]*\\{`,
            's'
          );
          const funcMatch = content.match(funcPattern);

          if (funcMatch && !content.includes(`const { ${paramNames.join(', ')} } = await params`)) {
            const insertPoint = content.indexOf(funcMatch[0]) + funcMatch[0].length;
            const before = content.substring(0, insertPoint);
            const after = content.substring(insertPoint);

            // Insert the await params line right after the opening brace
            const awaitLine = `\n  const { ${paramNames.join(', ')} } = await params\n`;
            content = before + awaitLine + after;

            // Now replace params.xxx with xxx throughout this function
            // Find the end of this function (next export or end of file)
            const nextExportIndex = content.indexOf('export', insertPoint + awaitLine.length);
            const functionEnd = nextExportIndex > 0 ? nextExportIndex : content.length;

            const beforeFunc = content.substring(0, insertPoint + awaitLine.length);
            const funcBody = content.substring(insertPoint + awaitLine.length, functionEnd);
            const afterFunc = content.substring(functionEnd);

            let updatedFuncBody = funcBody;
            paramNames.forEach(name => {
              updatedFuncBody = updatedFuncBody.replace(new RegExp(`params\\.${name}\\b`, 'g'), name);
            });

            content = beforeFunc + updatedFuncBody + afterFunc;
          }
        }
      }
    }
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed: ${file}`);
    fixed++;
  }
}

console.log(`\n✅ Fixed ${fixed} files`);
