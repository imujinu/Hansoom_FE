import InfoView from "@/views/MyPage/InfoView.vue";
import MyPage from "@/views/MyPage/MyPage.vue";
import UserReviewList from "@/views/MyPage/UserReviewList.vue";
import UserWishlistList from "@/views/MyPage/UserWishlistList.vue";
import ReservationList from "@/views/Reservation/ReservationList.vue";


export const myPageRouter = [
    {
        path: "/user/myPage",
        name: "MyPage",
        component: MyPage
    },
    {
    path: "/mypage",
    component: MyPage,
    children: [
      { path: "", redirect: "/mypage/info" },              // 기본 탭
      { path: "info", component: InfoView },
      { path: "review", component: UserReviewList },
      { path: "wish", component: UserWishlistList },
      { path: "reservations", component: ReservationList },
    //   { path: "settings", component: SettingsView },
    ],
  },
]