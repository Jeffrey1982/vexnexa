import fs from 'fs';
import { glob } from 'glob';

const files = await glob('src/app/**/route.ts');
let fixed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Remove lines like: const { xxx } = params
  // But only if there's already a line like: const { xxx } = await params

  // Find all param names from await params lines
  const awaitParamsRegex = /const\s*\{\s*([^}]+)\}\s*=\s*await\s+params/g;
  const matches = [...content.matchAll(awaitParamsRegex)];

  for (const match of matches) {
    const paramNames = match[1].split(',').map(p => p.trim());

    // For each param name, remove duplicate lines
    for (const paramName of paramNames) {
      // Remove lines like: const { paramName } = params
      const duplicateRegex = new RegExp(`\\s*const\\s*\\{\\s*${paramName}\\s*\\}\\s*=\\s*params\\s*;?\\s*\\n`, 'g');
      content = content.replace(duplicateRegex, '\n');
    }
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed: ${file}`);
    fixed++;
  }
}

console.log(`\n✅ Fixed ${fixed} files`);
