import MyHostPage from "@/views/MyPage/MyHostPage.vue";
import InfoView from "@/views/MyPage/InfoView.vue";

export const myHostPageRouter = [
  {
    path: "/myhostpage",
    component: MyHostPage,
    children: [
      { path: "", redirect: "/myhostpage/info" },              // 기본 탭
      { path: "hotel", component: () => import("@/views/Hotel/HotelRegister.vue") },
      { path: "hoteldelay/:id", component: () => import("@/views/Hotel/AdminHotelView.vue") },
      { path: "room", component: () => import("@/views/Room/RoomRegister.vue") },
      { path: "myhotel", component: () => import("@/views/Hotel/HostMyHotel.vue") },
      { path: "reservation", component: () => import("@/views/Reservation/ReservationList.vue") },
      { path: "review", component: () => import("@/views/Review/HotelReviewList.vue") },
      { path: "chat", component: () => import("@/views/Chat/ChatHost.vue") }, // 임시로 InfoView 사용
      { path: "info", component: InfoView },
    ],
  },
]
