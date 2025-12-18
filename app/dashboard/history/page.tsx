"use client";

import { Suspense } from "react";
import { HistoryContent } from "./history-content";

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12 text-slate-500">
          Cargando historial...
        </div>
      </div>
    }>
      <HistoryContent />
    </Suspense>
  );
}
