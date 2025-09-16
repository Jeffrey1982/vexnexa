import { prisma } from "./prisma";

export interface PageNode {
  id: string;
  url: string;
  title: string;
  level: number;
  issues: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  score: number;
  children: PageNode[];
}

interface SiteWithScans {
  id: string;
  url: string;
  pages: Array<{
    id: string;
    url: string;
    title: string | null;
    scans: Array<{
      id: string;
      score: number | null;
      issues: number | null;
      impactCritical: number;
      impactSerious: number;
      impactModerate: number;
      impactMinor: number;
      createdAt: Date;
    }>;
  }>;
}

export async function getSiteStructureData(siteId: string): Promise<PageNode | null> {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      pages: {
        include: {
          scans: {
            where: { status: 'done' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              score: true,
              issues: true,
              impactCritical: true,
              impactSerious: true,
              impactModerate: true,
              impactMinor: true,
              createdAt: true
            }
          }
        }
      }
    }
  });

  if (!site || site.pages.length === 0) return null;

  return buildPageStructure(site as any);
}

function buildPageStructure(site: SiteWithScans): PageNode {
  const pagesWithScans = site.pages.filter(page => page.scans.length > 0);

  if (pagesWithScans.length === 0) {
    // Return minimal structure for sites without scans
    return {
      id: site.id,
      url: site.url,
      title: new URL(site.url).hostname,
      level: 0,
      issues: { critical: 0, serious: 0, moderate: 0, minor: 0 },
      score: 0,
      children: []
    };
  }

  // Create hierarchy based on URL paths
  const pageMap = new Map<string, PageNode>();
  const rootNode: PageNode = {
    id: `root-${site.id}`,
    url: site.url,
    title: new URL(site.url).hostname,
    level: 0,
    issues: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    score: 0,
    children: []
  };

  // First, create all page nodes
  pagesWithScans.forEach(page => {
    const latestScan = page.scans[0];
    const urlObj = new URL(page.url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    const pageNode: PageNode = {
      id: page.id,
      url: page.url,
      title: page.title || (pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'Home'),
      level: pathParts.length,
      issues: {
        critical: latestScan.impactCritical,
        serious: latestScan.impactSerious,
        moderate: latestScan.impactModerate,
        minor: latestScan.impactMinor
      },
      score: latestScan.score || 0,
      children: []
    };

    pageMap.set(page.url, pageNode);
  });

  // Build hierarchy by grouping pages by path depth
  const pagesByLevel = new Map<number, PageNode[]>();
  pageMap.forEach(pageNode => {
    if (!pagesByLevel.has(pageNode.level)) {
      pagesByLevel.set(pageNode.level, []);
    }
    pagesByLevel.get(pageNode.level)!.push(pageNode);
  });

  // Connect pages in a tree structure
  const levels = Array.from(pagesByLevel.keys()).sort((a, b) => a - b);

  // Level 0 pages (root pages) become children of root
  if (pagesByLevel.has(0)) {
    rootNode.children = pagesByLevel.get(0)!;
  }

  // For deeper levels, try to connect them to their parent paths
  for (let i = 1; i < levels.length; i++) {
    const currentLevel = levels[i];
    const currentPages = pagesByLevel.get(currentLevel) || [];

    currentPages.forEach(page => {
      // Try to find parent by removing last path segment
      const pageUrl = new URL(page.url);
      const pathParts = pageUrl.pathname.split('/').filter(Boolean);

      if (pathParts.length > 0) {
        // Try different parent path combinations
        for (let j = pathParts.length - 1; j >= 0; j--) {
          const parentPath = '/' + pathParts.slice(0, j).join('/');
          const parentUrl = `${pageUrl.origin}${parentPath || '/'}`;
          const parentNode = pageMap.get(parentUrl);

          if (parentNode && parentNode !== page) {
            parentNode.children.push(page);
            break;
          }
        }
      }
    });
  }

  // For pages that don't have parents, add them to appropriate level parents or root
  pageMap.forEach(page => {
    if (page.level > 0 && !hasParent(page, pageMap)) {
      // Find a suitable parent from previous levels
      const suitableParent = findSuitableParent(page, pagesByLevel, page.level - 1);
      if (suitableParent) {
        suitableParent.children.push(page);
      } else {
        rootNode.children.push(page);
      }
    }
  });

  // Calculate aggregate statistics for parent nodes
  updateAggregateStats(rootNode);

  // If no children were added to root, create a flat structure
  if (rootNode.children.length === 0 && pageMap.size > 0) {
    rootNode.children = Array.from(pageMap.values()).slice(0, 10); // Limit to prevent overcrowding
  }

  return rootNode;
}

function hasParent(page: PageNode, pageMap: Map<string, PageNode>): boolean {
  const parentCandidates = Array.from(pageMap.values());
  for (const parentCandidate of parentCandidates) {
    if (parentCandidate.children.includes(page)) {
      return true;
    }
  }
  return false;
}

function findSuitableParent(
  page: PageNode,
  pagesByLevel: Map<number, PageNode[]>,
  targetLevel: number
): PageNode | null {
  if (targetLevel < 0) return null;

  const candidateParents = pagesByLevel.get(targetLevel) || [];

  // Find parent with most similar URL path
  const pageUrl = new URL(page.url);
  let bestParent: PageNode | null = null;
  let bestScore = 0;

  candidateParents.forEach(candidate => {
    const candidateUrl = new URL(candidate.url);
    const similarity = calculatePathSimilarity(pageUrl.pathname, candidateUrl.pathname);

    if (similarity > bestScore) {
      bestScore = similarity;
      bestParent = candidate;
    }
  });

  return bestParent || (candidateParents.length > 0 ? candidateParents[0] : null);
}

function calculatePathSimilarity(path1: string, path2: string): number {
  const parts1 = path1.split('/').filter(Boolean);
  const parts2 = path2.split('/').filter(Boolean);

  let commonParts = 0;
  const minLength = Math.min(parts1.length, parts2.length);

  for (let i = 0; i < minLength; i++) {
    if (parts1[i] === parts2[i]) {
      commonParts++;
    } else {
      break;
    }
  }

  return commonParts / Math.max(parts1.length, parts2.length, 1);
}

function updateAggregateStats(node: PageNode): void {
  if (node.children.length === 0) return;

  // Recursively update children first
  node.children.forEach(child => updateAggregateStats(child));

  // Calculate aggregates
  let totalScore = node.score;
  let totalPages = 1;
  let totalIssues = { ...node.issues };

  node.children.forEach(child => {
    totalScore += child.score;
    totalPages += getTotalPages(child);
    totalIssues.critical += child.issues.critical;
    totalIssues.serious += child.issues.serious;
    totalIssues.moderate += child.issues.moderate;
    totalIssues.minor += child.issues.minor;
  });

  // Update node with averages and totals
  node.score = Math.round(totalScore / totalPages);
  node.issues = totalIssues;
}

function getTotalPages(node: PageNode): number {
  let count = 1;
  node.children.forEach(child => {
    count += getTotalPages(child);
  });
  return count;
}

// Get structure for multiple sites (portfolio view)
export async function getPortfolioStructureData(userId: string): Promise<PageNode[]> {
  const sites = await prisma.site.findMany({
    where: { userId },
    include: {
      pages: {
        include: {
          scans: {
            where: { status: 'done' },
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              score: true,
              issues: true,
              impactCritical: true,
              impactSerious: true,
              impactModerate: true,
              impactMinor: true,
              createdAt: true
            }
          }
        }
      }
    },
    take: 20 // Limit to prevent overcrowding
  });

  const structures = await Promise.all(
    sites
      .filter(site => site.pages.some(page => page.scans.length > 0))
      .map(site => buildPageStructure(site as any))
  );

  return structures;
}

// Generate mock data for demo purposes
export function generateMockSiteStructure(siteUrl: string): PageNode {
  const hostname = new URL(siteUrl).hostname;

  const pages = [
    { path: '/', title: 'Home', score: 85, issues: { critical: 0, serious: 1, moderate: 2, minor: 3 } },
    { path: '/about', title: 'About Us', score: 78, issues: { critical: 1, serious: 0, moderate: 1, minor: 2 } },
    { path: '/services', title: 'Services', score: 72, issues: { critical: 0, serious: 2, moderate: 3, minor: 1 } },
    { path: '/services/web-design', title: 'Web Design', score: 69, issues: { critical: 1, serious: 1, moderate: 2, minor: 4 } },
    { path: '/services/seo', title: 'SEO Services', score: 81, issues: { critical: 0, serious: 0, moderate: 2, minor: 1 } },
    { path: '/contact', title: 'Contact', score: 65, issues: { critical: 2, serious: 1, moderate: 1, minor: 2 } },
    { path: '/blog', title: 'Blog', score: 88, issues: { critical: 0, serious: 0, moderate: 1, minor: 1 } },
    { path: '/blog/accessibility-tips', title: 'Accessibility Tips', score: 92, issues: { critical: 0, serious: 0, moderate: 0, minor: 1 } },
    { path: '/products', title: 'Products', score: 74, issues: { critical: 0, serious: 1, moderate: 3, minor: 2 } },
    { path: '/products/category/software', title: 'Software Products', score: 71, issues: { critical: 1, serious: 0, moderate: 2, minor: 3 } },
  ];

  const pageMap = new Map<string, PageNode>();
  const rootNode: PageNode = {
    id: 'root',
    url: siteUrl,
    title: hostname,
    level: 0,
    issues: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    score: 0,
    children: []
  };

  // Create page nodes
  pages.forEach((pageData, index) => {
    const fullUrl = siteUrl + pageData.path;
    const pathParts = pageData.path.split('/').filter(Boolean);

    const pageNode: PageNode = {
      id: `page-${index}`,
      url: fullUrl,
      title: pageData.title,
      level: pathParts.length,
      issues: pageData.issues,
      score: pageData.score,
      children: []
    };

    pageMap.set(fullUrl, pageNode);
  });

  // Build hierarchy
  pageMap.forEach(page => {
    if (page.level === 0) {
      rootNode.children.push(page);
    } else {
      // Find parent based on URL structure
      const pageUrl = new URL(page.url);
      const pathParts = pageUrl.pathname.split('/').filter(Boolean);

      for (let i = pathParts.length - 1; i >= 0; i--) {
        const parentPath = '/' + pathParts.slice(0, i).join('/');
        const parentUrl = `${pageUrl.origin}${parentPath || '/'}`;
        const parentNode = pageMap.get(parentUrl);

        if (parentNode && parentNode !== page) {
          parentNode.children.push(page);
          break;
        }
      }

      // If no parent found, add to root
      if (!hasParent(page, pageMap)) {
        rootNode.children.push(page);
      }
    }
  });

  updateAggregateStats(rootNode);
  return rootNode;
}