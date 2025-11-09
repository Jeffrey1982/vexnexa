const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    const replacements = [
      [/vexnexa/g, 'vexnexa'],
      [/VexNexa/g, 'VexNexa'],
      [/VexNexa/g, 'VexNexa'],
      [/VEXNEXA/g, 'VEXNEXA'],
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
      if (['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.html'].includes(ext) && file !== 'package-lock.json') {
        callback(filePath);
      }
    }
  });
}

let changedCount = 0;
const baseDir = 'E:/vexnexa';

console.log('Starting replacement...');
walkDir(baseDir, (filePath) => {
  if (replaceInFile(filePath)) {
    changedCount++;
    const rel = path.relative(baseDir, filePath);
    console.log('Changed: ' + rel);
  }
});

console.log('Completed! Changed ' + changedCount + ' files.');
