import { globalConfig } from "@/lib/globalConfig";
import { supabaseServer } from "@/lib/supabaseServer";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { orderIds, isSuccess } = await request.json();

  if (!orderIds || orderIds.length === 0) {
    return NextResponse.json({ success: false, error: "Order IDs are required" }, { status: 400 });
  }

  const supabase = await supabaseServer();

  for (const orderId of orderIds) {
    const { error } = await supabase
      .from("orderDetails")
      .update({ order_status: isSuccess ? globalConfig.orderStatus.completed : globalConfig.orderStatus.failed })
      .eq("id", orderId);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, message: "Order updated successfully" }, { status: 200 });
}