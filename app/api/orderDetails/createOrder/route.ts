import { globalConfig } from "@/lib/globalConfig";
import { supabaseServer } from "@/lib/supabaseServer"
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {

    try {
        const { fk_id_user, orderDetails } = await req.json();

        if (!orderDetails || !orderDetails.length) {
            return NextResponse.json({
                message: "OrderDetails Not Found!",
            }, { status: 400 });
        }

        if (!fk_id_user) {
            return NextResponse.json({
                message: "User Id Not Found!",
            }, { status: 400 });
        }

        const supabase = await supabaseServer();
        const createdOrderDetails: any[] = [];

        for (const order of orderDetails) {
            const validationResponse = validateOrder(order);
            if (validationResponse) {
                return validationResponse;
            }

            const { data: OrderRow, error } = await supabase
                .from("orderDetails")
                .insert([{ amount: order.price, quantity: order.qty, is_active: 1, fk_id_product: order.id, fk_id_user: fk_id_user , order_status: globalConfig.orderStatus.pending}])
                .select()
                .single()

            if (error || !OrderRow) {
                return NextResponse.json({
                    success: false,
                    message: "Error while creating the orderDetails!",
                    error: error || "No data returned from insert operation"
                }, { status: 400 });
            }

            createdOrderDetails.push(OrderRow);
        }

        return NextResponse.json({
            success: true,
            message: "Orders Created Successfully",
            createdOrders: createdOrderDetails
        }, { status: 200 });
    }
    catch (error) {
        return NextResponse.json({
            success: false,
            message: "Something Went Wrong!",
            error: error
        }, { status: 500 });
    }
}

function validateOrder(order: any) {
    if (order.price === undefined || order.price <= 0) {
        return NextResponse.json({
            success: false,
            message: "Amount should be greater than 0.",
        }, { status: 400 });
    }
    if (order.qty === undefined || order.qty <= 0) {
        return NextResponse.json({
            success: false,
            message: "Quantity should be greater than 0.",
        }, { status: 400 });
    }

    if (!order.id || order.id === undefined) {
        return NextResponse.json({
            success: false,
            message: "No Product Id found!",
        }, { status: 400 });
    }

    return null;
}
