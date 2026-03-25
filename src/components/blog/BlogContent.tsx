'use client';

import { useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { EaaHeroImage } from './EaaHeroImage';
import { EaaScopeGrid } from './EaaScopeGrid';
import { EaaTimeline } from './EaaTimeline';
import { PainPointCards } from './PainPointCards';
import { ActionSteps } from './ActionSteps';
import { CtaBanner } from './CtaBanner';

interface BlogContentProps {
  content: string;
}

export function BlogContent({ content }: BlogContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    // Apply syntax highlighting to all code blocks
    const codeBlocks = contentRef.current.querySelectorAll('pre code');
    codeBlocks.forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });

    // Add copy buttons to code blocks
    const preBlocks = contentRef.current.querySelectorAll('pre');
    preBlocks.forEach((pre, index) => {
      // Check if copy button already exists
      if (pre.querySelector('.copy-button')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'relative group';

      const copyButton = document.createElement('button');
      copyButton.className = 'copy-button absolute top-3 right-3 p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white opacity-0 group-hover:opacity-100 transition-opacity';
      copyButton.setAttribute('data-index', index.toString());
      copyButton.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>`;

      copyButton.addEventListener('click', () => {
        const code = pre.querySelector('code');
        if (code) {
          navigator.clipboard.writeText(code.textContent || '');
          setCopiedIndex(index);
          setTimeout(() => setCopiedIndex(null), 2000);
        }
      });

      // Wrap pre in the new div
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);
      wrapper.appendChild(copyButton);
    });
  }, [content]);

  // Process content to split into sections and replace custom divs
  const processContent = (html: string) => {
    const sections = html.split(/(<div class="[^"]*"[^>]*><\/div>)/);
    
    return sections.map((section, index) => {
      if (section.includes('eaa-hero-image')) {
        return <EaaHeroImage key={`hero-${index}`} />;
      } else if (section.includes('eaa-scope-grid')) {
        return <EaaScopeGrid key={`scope-${index}`} />;
      } else if (section.includes('eaa-timeline')) {
        return <EaaTimeline key={`timeline-${index}`} />;
      } else if (section.includes('pain-point-cards')) {
        return <PainPointCards key={`pain-${index}`} />;
      } else if (section.includes('action-steps')) {
        return <ActionSteps key={`action-${index}`} />;
      } else if (section.includes('cta-banner')) {
        return <CtaBanner key={`cta-${index}`} />;
      } else if (section.trim()) {
        // Sanitize regular HTML content
        const sanitizedContent = typeof window !== 'undefined' ? DOMPurify.sanitize(section, {
          ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'strong', 'em', 'u', 'strike',
            'ul', 'ol', 'li',
            'a', 'img',
            'blockquote',
            'pre', 'code',
            'table', 'thead', 'tbody', 'tr', 'td', 'th',
            'hr', 'div', 'span'
          ],
          ALLOWED_ATTR: [
            'href', 'src', 'alt', 'title', 'class',
            'data-language', 'style', 'target', 'rel'
          ],
        }) : section;
        
        return (
          <div
            key={`content-${index}`}
            className="blog-content prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            style={{
              '--tw-prose-body': 'hsl(var(--foreground))',
              '--tw-prose-headings': 'hsl(var(--foreground))',
              '--tw-prose-links': 'hsl(var(--primary))',
              '--tw-prose-bold': 'hsl(var(--foreground))',
              '--tw-prose-code': 'hsl(var(--foreground))',
              '--tw-prose-pre-bg': 'hsl(var(--muted))',
            } as React.CSSProperties}
          />
        );
      }
      return null;
    });
  };

  return (
    <div ref={contentRef}>
      {processContent(content)}
    </div>
  );
}
