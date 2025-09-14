import PaymentFail from "@/views/Payment/PaymentFail.vue";
import PaymentSuccess from "@/views/Payment/PaymentSuccess.vue";

export const paymentRouter = [
    {
        path: "/success",
        name: "PaymentSuccess",
        component: PaymentSuccess
    },
    {
        path: "/fail",
        name: "PaymentFail",
        component: PaymentFail
    },
]