"use client";

import { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useFilters } from "@/components/FiltersContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function NavbarFilters() {
  const { filters, setFilters } = useFilters();
  const [localCategory, setLocalCategory] = useState<string>(filters.category ? filters.category : "all");
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(filters.priceRange);
  const [localSort, setLocalSort] = useState<string>(filters.sort ? filters.sort : "none");
  const [open, setOpen] = useState(false);

  // Sync local state with context when filters change externally
  useEffect(() => {
    setLocalCategory(filters.category ? filters.category : "all");
    setLocalPriceRange(filters.priceRange);
    setLocalSort(filters.sort ? filters.sort : "none");
  }, [filters]);

  const hasActiveFilters = filters.category !== "" || filters.priceRange[0] > 0 || filters.priceRange[1] < 3000 || filters.sort !== "";

  // Apply filters immediately when values change
  const applyFiltersImmediately = () => {
    setFilters({
      category: localCategory === "all" ? "" : localCategory,
      priceRange: localPriceRange,
      sort: localSort === "none" ? "" : localSort,
    });
  };

  // Apply filters when category or sort changes
  const handleCategoryChange = (value: string) => {
    setLocalCategory(value);
    setFilters({
      category: value === "all" ? "" : value,
      priceRange: localPriceRange,
      sort: localSort === "none" ? "" : localSort,
    });
  };

  const handleSortChange = (value: string) => {
    setLocalSort(value);
    setFilters({
      category: localCategory === "all" ? "" : localCategory,
      priceRange: localPriceRange,
      sort: value === "none" ? "" : value,
    });
  };

  const handlePriceRangeChange = (value: number[]) => {
    const newRange = value as [number, number];
    setLocalPriceRange(newRange);
    setFilters({
      category: localCategory === "all" ? "" : localCategory,
      priceRange: newRange,
      sort: localSort === "none" ? "" : localSort,
    });
  };

  const clearFilters = () => {
    setLocalCategory("all");
    setLocalPriceRange([0, 3000]);
    setLocalSort("none");
    setFilters({
      category: "",
      priceRange: [0, 3000],
      sort: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-600 rounded-full" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Filters</span>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs text-amber-700 hover:text-amber-800"
              >
                <X className="w-3 h-3 mr-1" />
                Clear All
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Category Filter */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Category</label>
            <Select value={localCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Bags">Bags</SelectItem>
                <SelectItem value="BedSheet">BedSheet</SelectItem>
                <SelectItem value="PillowCover">PillowCover</SelectItem>
                <SelectItem value="Blankets">Blankets</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Price Range</label>
            <Slider
              value={localPriceRange}
              max={3000}
              step={100}
              onValueChange={handlePriceRangeChange}
            />
            <p className="text-xs mt-2 text-slate-600">₹{localPriceRange[0]} - ₹{localPriceRange[1]}</p>
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Sort by Price</label>
            <Select value={localSort} onValueChange={handleSortChange}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="No sorting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="low">Low → High</SelectItem>
                <SelectItem value="high">High → Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Close Button */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

