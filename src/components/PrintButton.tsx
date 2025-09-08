"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <div className="no-print mb-4 text-right">
      <Button 
        onClick={() => window.print()}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Printer className="w-4 h-4" />
        Print Report
      </Button>
    </div>
  );
}