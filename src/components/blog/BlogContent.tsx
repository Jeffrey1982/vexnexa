'use client';

import ReactMarkdown from 'react-markdown';
import { Card, CardContent } from '@/components/ui/card';

interface BlogContentProps {
  content: string;
}

export function BlogContent({ content }: BlogContentProps) {
  return (
    <ReactMarkdown
      components={{
        h2: ({ children }) => (
          <h2 className="font-display text-3xl font-bold mt-20 mb-8 first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => {
          const text = children?.toString() || '';
          // Check if first character is an emoji (simple check for common emoji ranges)
          const hasEmoji = text && /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(text);

          if (hasEmoji) {
            return (
              <Card className="my-12 overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <h3 className="font-display text-2xl font-bold m-0">
                    {children}
                  </h3>
                </CardContent>
              </Card>
            );
          }

          return (
            <h3 className="font-display text-xl font-semibold mt-12 mb-4 text-primary">
              {children}
            </h3>
          );
        },
        p: ({ children }) => {
          const text = children?.toString() || '';

          // Check if it's the stats section markers
          if (text.includes('Data-Driven') || text.includes('User-Centric') || text.includes('Continuous Improvement')) {
            return (
              <div className="bg-muted/50 rounded-lg p-6 my-6 border-l-4 border-primary">
                <p className="text-lg font-medium m-0 leading-relaxed">
                  {children}
                </p>
              </div>
            );
          }

          // Check if starts with checkmark
          if (text.startsWith('✓')) {
            return (
              <div className="flex items-start gap-3 my-4">
                <span className="text-green-500 text-xl flex-shrink-0">✓</span>
                <p className="text-lg leading-relaxed m-0 flex-1">
                  {children?.toString().replace('✓', '').trim()}
                </p>
              </div>
            );
          }

          return (
            <p className="text-lg leading-[1.8] mb-8 text-foreground">
              {children}
            </p>
          );
        },
        blockquote: ({ children }) => (
          <Card className="my-10 border-l-4 border-l-primary bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="p-8">
              <div className="text-2xl font-bold text-foreground space-y-4">
                {children}
              </div>
            </CardContent>
          </Card>
        ),
        ul: ({ children }) => (
          <ul className="my-8 space-y-4">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="my-8 space-y-4">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="text-lg leading-relaxed ml-6">
            {children}
          </li>
        ),
        hr: () => (
          <div className="my-16 flex items-center justify-center">
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full" />
          </div>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">
            {children}
          </strong>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-primary hover:underline font-medium"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {children}
          </a>
        ),
        em: ({ children }) => (
          <em className="text-muted-foreground italic">
            {children}
          </em>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
