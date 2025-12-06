import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

export default function ProductCard({ id, name, price, image_url }: ProductCardProps) {
  return (
    <Link href={`/product/${id}`}>
      <Card className="hover:shadow-lg transition cursor-pointer">
        <CardHeader className="p-0">
          <img
            src={image_url}
            alt={name}
            className="w-full h-56 object-cover rounded-t-lg"
          />
        </CardHeader>

        <CardContent className="p-4">
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-gray-600 mt-1">₹{price}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
