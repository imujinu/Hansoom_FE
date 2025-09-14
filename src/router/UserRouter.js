import GoogleRedirect from "@/views/User/GoogleRedirect.vue";
import KakaoRedirect from "@/views/User/KakaoRedirect.vue";
import UserCreate from "@/views/User/UserCreate.vue";
import UserLogin from "@/views/User/UserLogin.vue";


export const userRouter = [
    {
        path: "/user/create",
        name: "UserCreate",
        component: UserCreate
    },
    {
        path: "/user/login",
        name: "UserLogin",
        component: UserLogin
    },
    {
        path: "/oauth/google/redirect",
        name: "GoogleRedirect",
        component: GoogleRedirect
    },
    {
        path: "/oauth/kakao/redirect",
        name: "KakaoRedirect",
        component: KakaoRedirect
    },
]