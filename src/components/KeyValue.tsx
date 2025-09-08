import { cn } from "@/lib/utils";

interface KeyValueProps {
  items: Array<{
    key: string;
    value: React.ReactNode;
    className?: string;
  }>;
  className?: string;
}

export function KeyValue({ items, className }: KeyValueProps) {
  return (
    <dl className={cn("space-y-2", className)}>
      {items.map((item, index) => (
        <div key={index} className="flex justify-between items-start">
          <dt className="text-sm font-medium text-muted-foreground min-w-0 flex-1 pr-4">
            {item.key}
          </dt>
          <dd className={cn("text-sm font-semibold text-right", item.className)}>
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}