const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    const replacements = [
      // Remove "by VexNexa" / "by Vexnexa" from titles and metadata
      [/ by VexNexa/g, ''],
      [/ by Vexnexa/g, ''],

      // Remove the subtitle line in components
      [/\s*<span className="text-xs text-muted-foreground -mt-0\.5">by Vexnexa<\/span>\s*/g, ''],
      [/\s*<span className="text-sm text-muted-foreground">by Vexnexa<\/span>\s*/g, ''],

      // Remove from SVG
      [/\s*<text x="\d+" y="\d+" font-family="[^"]*" font-size="\d+" fill="[^"]*"[^>]*>by Vexnexa<\/text>\s*/g, ''],
    ];

    replacements.forEach(([pattern, replacement]) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        changed = true;
      }
    });

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  return false;
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!['node_modules', '.next', '.git', '.vercel'].includes(file)) {
        walkDir(filePath, callback);
      }
    } else {
      const ext = path.extname(file);
      if (['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.svg'].includes(ext) && file !== 'package-lock.json') {
        callback(filePath);
      }
    }
  });
}

let changedCount = 0;
const baseDir = 'E:/vexnexa';

console.log('Starting removal of "by VexNexa" references...');
walkDir(baseDir, (filePath) => {
  if (replaceInFile(filePath)) {
    changedCount++;
    const rel = path.relative(baseDir, filePath);
    console.log('Changed: ' + rel);
  }
});

console.log('Completed! Changed ' + changedCount + ' files.');
