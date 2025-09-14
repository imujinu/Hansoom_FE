import HotelReviewList from "@/views/Review/HotelReviewList.vue";
import HotelSimpleReviewListCard from "@/views/Review/HotelSimpleReviewListCard.vue";



export const reviewRouter = [
    {
        path: "/review/hotel/list/:hotelId",
        name: "HotelReviewList",
        component: HotelReviewList
    },
    {
        path: "/review/hotel/reviewCards",
        name: "HotelSimpleReviewListCard",
        component: HotelSimpleReviewListCard
    },
]