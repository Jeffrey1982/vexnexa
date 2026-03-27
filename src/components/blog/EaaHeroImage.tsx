'use client';

export function EaaHeroImage() {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted via-background to-primary/5">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
          </pattern>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 h-full flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-4xl">
          {/* EU stars icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-500">
                <svg className="w-16 h-16 text-yellow-300" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="6" r="1" />
                  <circle cx="16" cy="8" r="1" />
                  <circle cx="18" cy="12" r="1" />
                  <circle cx="16" cy="16" r="1" />
                  <circle cx="12" cy="18" r="1" />
                  <circle cx="8" cy="16" r="1" />
                  <circle cx="6" cy="12" r="1" />
                  <circle cx="8" cy="8" r="1" />
                  <circle cx="12" cy="12" r="1.5" />
                </svg>
              </div>
              {/* Accessibility icon overlay */}
              <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border-4 border-background bg-primary">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="3" />
                  <path d="M3 21h18M12 21v-9m0 0l-3 3m3-3l3 3" />
                </svg>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
              EAA Guide for Agencies
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              European Accessibility Act • WCAG Compliance • Agency Solutions
            </p>
          </div>

          {/* Decorative elements */}
          <div className="flex justify-center gap-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              2025 Enforcement
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              WCAG 2.1 AA
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Agency Focused
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
