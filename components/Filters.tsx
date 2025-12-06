"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export default function Filters({ onFilterChange }: { onFilterChange: (filters: any) => void }) {
  const [category, setCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState([0, 3000]);
  const [sort, setSort] = useState<string>("none");

  function updateFilters() {
    onFilterChange({
      category: category === "all" ? "" : category,
      priceRange,
      sort: sort === "none" ? "" : sort,
    });
  }

  return (
    <Card className="p-6 mb-8 space-y-6 border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50/30">
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">Filters</h2>

      {/* Category Filter */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">Category</label>
        <Select value={category} onValueChange={(v) => { setCategory(v); updateFilters(); }}>
          <SelectTrigger className="w-full">
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
          value={priceRange}
          max={3000}
          step={100}
          onValueChange={(v) => {
            setPriceRange(v);
            updateFilters();
          }}
        />
        <p className="text-sm mt-3 text-slate-600 font-medium">₹{priceRange[0]} - ₹{priceRange[1]}</p>
      </div>

      {/* Sort */}
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">Sort by Price</label>
        <Select value={sort} onValueChange={(v) => { setSort(v); updateFilters(); }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="No sorting" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="low">Low → High</SelectItem>
            <SelectItem value="high">High → Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
