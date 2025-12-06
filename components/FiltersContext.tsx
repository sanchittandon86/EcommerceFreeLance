"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface FilterState {
  category: string;
  priceRange: [number, number];
  sort: string;
}

interface FiltersContextType {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
}

const FiltersContext = createContext<FiltersContextType | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>({
    category: "",
    priceRange: [0, 3000],
    sort: "",
  });

  return (
    <FiltersContext.Provider value={{ filters, setFilters }}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used inside FiltersProvider");
  return ctx;
}

