import Razorpay from "razorpay"


const razorpay = new Razorpay({
    key_id: process.env.EXPO_PUBLIC_RAZORPAY_KEY!,
    key_secret: process.env.EXPO_PUBLIC_RAZORPAY_SECRET
})
export async function POST(request: Request) {
    try {
        const { amount } = await request.json()
        if (!amount) {
            return new Response("Invalid argument.", { status: 409 })
        }
        const options = {
            amount: amount * 100,
            currency: "INR"
        }
        const order = await razorpay.orders.create(options);
        return new Response(JSON.stringify({ order }), { status: 201 })
    } catch (error) {
        return new Response("Internal Server error.", { status: 500 })
    }

}