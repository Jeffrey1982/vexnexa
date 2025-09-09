"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export function CopyButton({ 
  text, 
  variant = "outline", 
  size = "sm", 
  className,
  children 
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn("flex items-center gap-1", className)}
      aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
      {children && <span>{children}</span>}
      {!children && (copied ? "Copied!" : "Copy")}
    </Button>
  );
}