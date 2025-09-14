import { createRouter, createWebHistory } from "vue-router";

import MainRouter from "../components/MainRouter.vue";
import HansoomHome from "../views/Home/HansoomHome.vue";
import { userRouter } from "./UserRouter";
import { reservationRouter } from "./ReservationRouter";
import { paymentRouter } from "./PaymentRouter";
import { roomRouter } from "./RoomRouter";
import { reviewRouter } from "./ReviewRouter";
import { chatRouter } from "./ChatRouter";
import { adminRouter } from "./AdminRouter";
import { myPageRouter } from "./MyPageRouter.js";
import { myHostPageRouter } from "./MyHostPageRouter.js";
import { homeRouter } from "./HomeRouter.js";

const routes = [
  { path: "/", name: "HansoomHome", component: HansoomHome },
  { path: "/main", name: "MainRouter", component: MainRouter },
  ...userRouter,
  ...reservationRouter,
  ...paymentRouter,
  ...roomRouter,
  ...reviewRouter,
  ...chatRouter,
  ...adminRouter,
  ...myPageRouter,
  ...myHostPageRouter,
  ...homeRouter,
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 뒤로가기/앞으로가기 시 저장된 위치로 이동
    if (savedPosition) {
      return savedPosition;
    }
    // 그 외에는 항상 맨 위로
    return { left: 0, top: 0 };
  },
});

export default router;
