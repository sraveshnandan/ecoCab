import Razorpay from "razorpay"

import crypto from "crypto"


const razorpay = new Razorpay({
    key_id: process.env.EXPO_PUBLIC_RAZORPAY_KEY!,
    key_secret: process.env.EXPO_PUBLIC_RAZORPAY_SECRET
})
export async function POST(request: Request) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json()
        if (!razorpay_order_id ?? !razorpay_signature ?? !razorpay_payment_id) {
            return new Response("Invalid argument.", { status: 409 })
        }


        const generated_signature = crypto.createHmac(razorpay_order_id + "|" + razorpay_payment_id + "aaaaa", "sha256").digest('hex')

        if (generated_signature == razorpay_signature) {
            console.log("payment verified")
        }


    } catch (error) {
        return new Response("Internal Server error.", { status: 500 })
    }

}