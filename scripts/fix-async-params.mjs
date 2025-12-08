import fs from 'fs';
import { glob } from 'glob';

// Find all route files with dynamic params
const files = await glob('src/app/**/route.ts');

let fixed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Update function signatures: { params }: { params: { ... } } -> { params }: { params: Promise<{ ... }> }
  content = content.replace(
    /\{\s*params\s*\}:\s*\{\s*params:\s*\{([^}]+)\}\s*\}/g,
    '{ params }: { params: Promise<{$1}> }'
  );

  // Update usage: await params before first use
  // Find if params.something is used
  if (content.includes('params.') && !content.includes('await params')) {
    // Find the function body start
    const funcMatch = content.match(/(export\s+async\s+function\s+\w+[^{]*\{)/);
    if (funcMatch) {
      const funcStart = content.indexOf(funcMatch[0]) + funcMatch[0].length;

      // Extract param names from type signature
      const paramTypeMatch = content.match(/params:\s*Promise<\{([^}]+)\}>/);
      if (paramTypeMatch) {
        const paramDecl = paramTypeMatch[1]
          .split(',')
          .map(p => p.split(':')[0].trim())
          .join(', ');

        // Insert await params destructuring at start of function
        const beforeFunc = content.substring(0, funcStart);
        const afterFunc = content.substring(funcStart);

        content = beforeFunc + `\n  const { ${paramDecl} } = await params\n` + afterFunc;

        // Replace all params.xxx with just xxx
        content = content.replace(/params\.(\w+)/g, '$1');
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
