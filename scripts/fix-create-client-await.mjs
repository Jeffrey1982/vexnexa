import fs from 'fs';
import { glob } from 'glob';

const files = await glob('src/**/*.{ts,tsx}');
let fixed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Replace patterns like: const xxx = createClient()
  // with: const xxx = await createClient()
  // But only if not already awaited
  content = content.replace(
    /(\s+const\s+\w+\s*=\s*)createClient\(\)/g,
    '$1await createClient()'
  );

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`✅ Fixed: ${file}`);
    fixed++;
  }
}

console.log(`\n✅ Fixed ${fixed} files`);
