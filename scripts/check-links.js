const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all valid routes from page.tsx and route.ts files
const routeFiles = execSync('find src/app -type f \\( -name "page.tsx" -o -name "route.ts" \\)', {
  cwd: 'D:/Vexnexa',
  encoding: 'utf8'
}).trim().split('\n');

// Convert file paths to routes
const validRoutes = new Set();
routeFiles.forEach(file => {
  // Remove src/app/ prefix and file extension
  let route = file
    .replace(/^src\/app\//, '/')
    .replace(/\/page\.tsx$/, '')
    .replace(/\/route\.ts$/, '')
    .replace(/\\/g, '/');

  // Handle marketing group routes
  route = route.replace(/\/\(marketing\)/, '');

  // Handle root route
  if (route === '/') validRoutes.add('/');
  else validRoutes.add(route === '' ? '/' : route);
});

// Get all href links from the codebase
const hrefPattern = /href=["'](\\/[^"'#?]*)["']/g;
const routerPushPattern = /router\.push\(["'](\\/[^"']*)["']\)/g;
const redirectPattern = /redirect\(["'](\\/[^"']*)["']\)/g;

const allLinks = new Set();
const linkLocations = new Map();

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      scanDirectory(filePath);
    } else if (file.match(/\.(tsx?|jsx?)$/)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = filePath.replace(/\\/g, '/').replace('D:/Vexnexa/', '');

      // Find all hrefs
      let match;
      while ((match = hrefPattern.exec(content)) !== null) {
        const link = match[1];
        allLinks.add(link);
        if (!linkLocations.has(link)) linkLocations.set(link, []);
        linkLocations.get(link).push(relativePath);
      }

      // Find all router.push
      while ((match = routerPushPattern.exec(content)) !== null) {
        const link = match[1];
        allLinks.add(link);
        if (!linkLocations.has(link)) linkLocations.set(link, []);
        linkLocations.get(link).push(relativePath);
      }

      // Find all redirect
      while ((match = redirectPattern.exec(content)) !== null) {
        const link = match[1];
        allLinks.add(link);
        if (!linkLocations.has(link)) linkLocations.set(link, []);
        linkLocations.get(link).push(relativePath);
      }
    }
  });
}

scanDirectory('D:/Vexnexa/src');

// Validate links
const brokenLinks = [];
const validLinks = [];
const dynamicLinks = [];

allLinks.forEach(link => {
  // Skip external links, anchors, api routes
  if (link.startsWith('http') || link.includes('#') || link.startsWith('/api/')) {
    return;
  }

  // Check if it's a dynamic route
  const isDynamic = link.includes('[') || link.match(/\/[a-f0-9]{8,}/);

  if (isDynamic) {
    dynamicLinks.push({
      link,
      found_in: linkLocations.get(link),
      status: 'DYNAMIC',
      notes: 'Contains dynamic segment - needs manual verification'
    });
  } else {
    const routeExists = validRoutes.has(link);

    if (routeExists) {
      validLinks.push({
        link,
        found_in: linkLocations.get(link),
        status: 'VALID'
      });
    } else {
      brokenLinks.push({
        link,
        found_in: linkLocations.get(link),
        status: 'BROKEN',
        issue: 'Route does not exist',
        severity: 'CRITICAL'
      });
    }
  }
});

// Generate report
const report = {
  urgent_issues: brokenLinks,
  all_links: [...brokenLinks, ...validLinks, ...dynamicLinks],
  summary: {
    total_links_found: allLinks.size,
    valid_links: validLinks.length,
    broken_links: brokenLinks.length,
    dynamic_links_need_check: dynamicLinks.length
  }
};

// Write to file
fs.writeFileSync(
  'D:/Vexnexa/cleanup-report/broken-links-analysis.json',
  JSON.stringify(report, null, 2),
  'utf8'
);

console.log('Link analysis complete!');
console.log(`Total links: ${allLinks.size}`);
console.log(`Valid links: ${validLinks.length}`);
console.log(`Broken links: ${brokenLinks.length}`);
console.log(`Dynamic links: ${dynamicLinks.length}`);
