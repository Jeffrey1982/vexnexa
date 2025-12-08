import fs from 'fs';
import { glob } from 'glob';

const files = await glob('src/app/**/route.ts');
let fixed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Only process files that have params in the signature
  if (!content.match(/\{\s*params\s*\}:\s*\{\s*params:/)) {
    continue;
  }

  // Step 1: Update type signature to use Promise
  content = content.replace(
    /\{\s*params\s*\}:\s*\{\s*params:\s*\{([^}]+)\}\s*\}/g,
    '{ params }: { params: Promise<{$1}> }'
  );

  // Step 2: For each function, add await params at the start
  // Find all export async functions
  const funcRegex = /export\s+async\s+function\s+(\w+)\s*\([^)]*\)\s*\{/g;
  let match;
  const functions = [];

  while ((match = funcRegex.exec(content)) !== null) {
    functions.push({
      name: match[1],
      startIndex: match.index,
      openBraceIndex: match.index + match[0].length
    });
  }

  // Extract param names from the type
  const paramTypeMatch = content.match(/params:\s*Promise<\{([^}]+)\}>/);
  if (paramTypeMatch) {
    const paramNames = paramTypeMatch[1]
      .split(',')
      .map(p => p.split(':')[0].trim())
      .filter(Boolean);

    // Process functions in reverse order to preserve indices
    for (let i = functions.length - 1; i >= 0; i--) {
      const func = functions[i];
      const awaitStatement = `\n  const { ${paramNames.join(', ')} } = await params\n`;

      // Check if this function already has the await statement
      const afterBrace = content.substring(func.openBraceIndex, func.openBraceIndex + 100);
      if (!afterBrace.includes('await params')) {
        // Insert after the opening brace
        content =
          content.substring(0, func.openBraceIndex) +
          awaitStatement +
          content.substring(func.openBraceIndex);
      }
    }

    // Step 3: Replace params.xxx with xxx
    paramNames.forEach(name => {
      content = content.replace(new RegExp(`params\\.${name}\\b`, 'g'), name);
    });
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed: ${file}`);
    fixed++;
  }
}

console.log(`\n✅ Fixed ${fixed} files`);
