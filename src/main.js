import { createApp } from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import 'vuetify/styles';
import "@mdi/font/css/materialdesignicons.css";
import router from "@/router/index.js";
import axios from "axios";
import '@mdi/font/css/materialdesignicons.css'

import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import 'primeicons/primeicons.css'; // PrimeIcons 스타일
import { createPinia } from "pinia";
import * as dateUtils from "./utils/dateUtils";

const app = createApp(App);
const exceptRoute = ["/user/login", "/user/create"];
const pinia = createPinia();
// 전역 이벤트 버스 (간단한 모달 제어용)
app.config.globalProperties.$modalBus = {
  showConfirm(options) {
    // 커스텀 이벤트로 모달 표시 요청
    window.dispatchEvent(new CustomEvent('show-confirm-modal', { 
      detail: options 
    }));
  }
};

// 전역 Date 유틸리티 등록
app.config.globalProperties.$dateUtils = dateUtils;

/* 모든 axios 요청을 intercept 해서 token을 함께 전송하는 코드입니다.
 => 모든 요청에서 따로 token 넣어줄 필요 없음 
 
 예외 적으로 exceptRoute를 설정하여 로그인, 회원가입과 같은 요청에는 
 token 을 첨부하지 않도록 해두었습니다.
 
 */

axios.defaults.withCredentials = true;

axios.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    const isInclude = exceptRoute.some((requestUrl) =>
      config.url.includes(requestUrl)
    );
    if (accessToken && !isInclude) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 모든 axios요청에서 401을 받을경우에 interceptor를 통해 rt를 통한 at 재발급
// rt마저 만료되었을때는 login창으로 이동
axios.interceptors.response.use(
    response => response,
    async error => {
        if(error.response && error.response.status === 401 ){
            try{
                const response = await axios.post(
                  `${process.env.VUE_APP_API_BASE_URL}/user/auth/refresh`,
                  null,
                  { withCredentials: true }
                );
                const accessToken = response.data.result.accessToken;
                localStorage.setItem("accessToken", accessToken);
                console.log("accessToken 갱신성공")
                window.location.reload();
            }catch(e){
                console.log("accessToken 갱신 실패", e);
                localStorage.clear();
                window.location.href = "/user/login";
            }
        }
        return Promise.reject(error);
    }
)

app.use(router);
app.use(vuetify);
app.use(pinia);
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});
app.mount("#app");
