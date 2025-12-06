"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProductGallery({ images }: { images: string[] }) {
  // Ensure images is always an array
  const imageArray = Array.isArray(images) ? images : images ? [images] : [];
  const [active, setActive] = useState(imageArray[0] || "");

  if (!imageArray.length) {
    return <div className="text-gray-500">No images available</div>;
  }

  return (
    <div>
      {/* Main Image */}
      <Image
        src={active}
        alt="Product image"
        width={600}
        height={600}
        className="rounded-xl border shadow mb-4 object-cover"
      />

      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-3">
        {imageArray.map((img) => (
          <button key={img} onClick={() => setActive(img)}>
            <Image
              src={img}
              width={120}
              height={120}
              alt="Thumbnail"
              className={`rounded-lg border object-cover ${
                active === img ? "border-black" : "border-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
