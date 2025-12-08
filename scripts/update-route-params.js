const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all route.ts files
const files = glob.sync('src/app/**/route.ts');

let updated = 0;
let skipped = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Pattern 1: { params }: { params: { ... } }
  const pattern1 = /\{\s*params\s*\}\s*:\s*\{\s*params:\s*\{([^}]+)\}\s*\}/g;
  if (pattern1.test(content)) {
    content = content.replace(
      /\{\s*params\s*\}\s*:\s*\{\s*params:\s*\{([^}]+)\}\s*\}/g,
      '{ params }: { params: Promise<{$1}> }'
    );
    modified = true;
  }

  // Pattern 2: { params, ... }: { params: { ... }, ... }
  const pattern2 = /\{\s*params\s*,([^}]+)\}\s*:\s*\{\s*params:\s*\{([^}]+)\}\s*,/g;
  if (pattern2.test(content)) {
    content = content.replace(
      /\{\s*params\s*,([^}]+)\}\s*:\s*\{\s*params:\s*\{([^}]+)\}\s*,/g,
      '{ params,$1 }: { params: Promise<{$2}>, '
    );
    modified = true;
  }

  // Now add await params where params is used
  if (modified) {
    // Check if params is already awaited
    if (!content.includes('await params')) {
      // Find where params is first used (not in the function signature)
      const lines = content.split('\n');
      let inFunction = false;
      let insertIndex = -1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip the function signature line
        if (line.includes('export async function') || line.includes('export function')) {
          inFunction = true;
          continue;
        }

        // Look for params usage after the function signature
        if (inFunction && line.includes('params.') && !line.includes('await params') && !line.includes('{ params }')) {
          // Insert await params before this line
          const indent = line.match(/^\s*/)[0];

          // Extract param names from the original pattern
          const paramMatch = content.match(/params:\s*Promise<\{([^}]+)\}>/);
          if (paramMatch) {
            const paramDecl = paramMatch[1].trim();
            lines.splice(i, 0, `${indent}const { ${paramDecl.replace(/:\s*\w+/g, '')} } = await params`);
            insertIndex = i;
            break;
          }
        }
      }

      if (insertIndex !== -1) {
        content = lines.join('\n');
        // Now replace params.xxx with just xxx
        content = content.replace(/params\.(\w+)/g, '$1');
      }
    }

    fs.writeFileSync(file, content);
    console.log(`✅ Updated: ${file}`);
    updated++;
  } else {
    skipped++;
  }
});

console.log(`\n✅ Updated ${updated} files`);
console.log(`⏭️  Skipped ${skipped} files (no params found)`);
