'use client';

import {
  ShoppingCart,
  Building2,
  Plane,
  Tv,
  Smartphone,
  Book,
  AlertTriangle,
} from 'lucide-react';

export function EaaScopeGrid() {
  const cardClass =
    'rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md';
  const iconWrap = 'rounded-lg bg-primary/10 p-2';
  const iconClass = 'h-6 w-6 text-primary';

  const items = [
    { icon: ShoppingCart, title: 'E-commerce', desc: 'Websites & mobile apps' },
    { icon: Building2, title: 'Banking', desc: 'Online banking & payments' },
    { icon: Plane, title: 'Transport', desc: 'Ticketing & booking sites' },
    { icon: Tv, title: 'Media', desc: 'Streaming & audiovisual' },
    { icon: Smartphone, title: 'Telecom', desc: 'Messaging & call services' },
    { icon: Book, title: 'Publishing', desc: 'E-books & e-readers' },
  ] as const;

  return (
    <div className="my-8 rounded-xl border border-border bg-muted/40 p-6">
      <h3 className="mb-6 text-center text-xl font-semibold text-foreground">
        Who Falls Under the EAA?
      </h3>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className={cardClass}>
            <div className="flex items-start gap-3">
              <div className={iconWrap}>
                <Icon className={iconClass} />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">{title}</h4>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-primary" />
          <p className="text-sm font-medium text-foreground">
            <strong>Exempt:</strong> Micro-enterprises with &lt;10 employees AND &lt;€2M annual
            turnover
          </p>
        </div>
      </div>
    </div>
  );
}
