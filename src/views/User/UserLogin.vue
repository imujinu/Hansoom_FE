<template>
  <v-container class="login-bg" fluid>
    <v-row align="center" justify="center" style="min-height: 90vh">
      <v-col cols="12" md="5" lg="4" class="d-flex flex-column align-center">
        <!-- 로고 -->
        <div
          class="d-flex align-center justify-center"
          style="gap: 12px; margin-bottom: 40px"
        >
          <span class="thtBi">HANSOOM</span>
        </div>

        <!-- 제목 -->
        <div
          class="text-center mb-2"
          style="font-size: 1.7rem; font-weight: 700"
        >
          로그인
        </div>
        <div class="text-center mb-8" style="color: #555; font-size: 1rem">
          hansoom 계정으로 로그인하세요
        </div>

        <!-- 로그인 폼 -->
        <v-card
          width="100%"
          class="pa-6"
          elevation="0"
          style="background: none; box-shadow: none"
        >
          <v-form @submit.prevent="login">
            <div class="mb-4">
              <div class="mb-2" style="font-size: 0.9rem; color: #222">
                이메일 주소
              </div>
              <v-text-field
                v-model="email"
                placeholder="이메일을 입력하세요"
                hide-details
                density="comfortable"
                variant="outlined"
                class="input-field"
                required
              />
            </div>
            <div class="mb-1">
              <div class="mb-2" style="font-size: 0.9rem; color: #222">
                비밀번호
              </div>
              <v-text-field
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="비밀번호를 입력하세요"
                hide-details
                density="comfortable"
                variant="outlined"
                class="input-field"
                required
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner.stop="togglePassword"
              />
            </div>

            <!-- 체크박스 -->
            <div class="d-flex align-center justify-start mb-5 mt-10">
              <div class="checkbox-wrap">
                <label class="plain-checkbox">
                  <input type="checkbox" v-model="remember" />
                  <span>로그인 상태 유지</span>
                </label>
              </div>
            </div>

            <!-- 로그인 버튼 -->
            <v-btn
              block
              color="#111"
              size="large"
              type="submit"
              rounded="lg"
              class="login-btn mb-3"
              style="font-weight: 500; font-size: 1rem; height: 40px"
            >
              로그인
            </v-btn>
          </v-form>

          <!-- 회원가입 링크 -->
          <div class="text-center mb-5" style="color: #333">
            계정이 없으신가요?
            <router-link to="/user/create" class="signup-link"
              >회원가입</router-link
            >
          </div>

          <!-- 또는 구분선 -->
          <div class="divider-row mb-4">
            <v-divider class="flex-grow-1" />
            <span class="divider-text">또는</span>
            <v-divider class="flex-grow-1" />
          </div>

          <!-- 소셜 로그인 -->
          <div class="d-flex flex-row gap-3 justify-center">
            <v-btn
              class="social-btn"
              @click="googleLogin"
              :style="{ backgroundImage: `url(${googleImg})` }"
              variant="flat"
            ></v-btn>
            <v-btn
              class="social-btn"
              @click="kakaoLogin"
              :style="{ backgroundImage: `url(${kakaoImg})` }"
              variant="flat"
            ></v-btn>
          </div>

          <!-- 가입 성공 알림 스낵바 -->
          <v-snackbar
            v-model="snack.show"
            timeout="2500"
            color="success"
            location="top"
            variant="flat"
          >
            {{ snack.message }}
          </v-snackbar>

          <!-- 로그인 에러 스낵바 -->
          <v-snackbar
            v-model="errorSnack.show"
            timeout="4000"
            color="error"
            location="top"
            variant="flat"
          >
            {{ errorSnack.message }}
          </v-snackbar>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import googleImg from "@/assets/user/google_login.png";
import kakaoImg from "@/assets/user/kakao_login.png";
import { getErrorMessage, getResultData } from "@/utils/commonDataHandler";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export default {
  name: "LoginView",
  data() {
    return {
      googleImg,
      kakaoImg,
      email: "",
      password: "",
      remember: false,
      showPassword: false,
      googleUrl: "https://accounts.google.com/o/oauth2/auth",
      googleClientId:
        "184039275121-3v895hcqj0imbjne3pfs9ceg6h8gld30.apps.googleusercontent.com",
      googleRedirectUrl: "https://www.hansoom.shop/oauth/google/redirect",
      googleScope: "openid email profile",

      kakaoUrl: "https://kauth.kakao.com/oauth/authorize",
      kakaoClientId: "f04e0b2f9773e2e421e24a448dc478a0",
      kakaoRedirectUrl: "https://www.hansoom.shop/oauth/kakao/redirect",
      snack: {
        show: false,
        message: "",
      },
      errorSnack: {
        show: false,
        message: "",
      },
    };
  },
  created() {
    // 회원가입에서 ?signup=success 로 넘어온 경우 표시
    if (this.$route.query.signup === "success") {
      this.snack.message = "회원가입에 성공했습니다.";
      this.snack.show = true;

      // URL 정리(새로고침 시 재노출 방지)
      const q = { ...this.$route.query };
      delete q.signup;
      this.$router.replace({ path: this.$route.path, query: q });
    }
  },
  methods: {
    togglePassword() {
      this.showPassword = !this.showPassword;
    },
    async login() {
      try {
        const loginData = { 
          email: this.email, 
          password: this.password,
          isRemember: this.remember 
        };
        console.log("로그인중");
        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/user/login`,
          loginData
        );
        console.log("로그인중1");
        console.log(response);
        const accessToken = getResultData(response);
        const token = jwtDecode(accessToken);
        console.log(token);
        const email = token.sub;
        const userId = token.userId;
        const role = token.role;
        localStorage.setItem("role", role);
        localStorage.setItem("email", email);
        localStorage.setItem("userId", userId);
        localStorage.setItem("accessToken", accessToken);
        window.location.href = "/";
      } catch (e) {
        console.error(e);
        // alert 대신 에러 스낵바 사용
        this.errorSnack.message = getErrorMessage(e) || "로그인에 실패했습니다.";
        this.errorSnack.show = true;
      }
    },
    googleLogin() {
      const auth_uri = `${this.googleUrl}?client_id=${this.googleClientId}&redirect_uri=${this.googleRedirectUrl}&response_type=code&scope=${this.googleScope}&remember=${this.remember}`;
      console.log(auth_uri);
      window.location.href = auth_uri;
    },
    kakaoLogin() {
      const auth_uri = `${this.kakaoUrl}?client_id=${this.kakaoClientId}&redirect_uri=${this.kakaoRedirectUrl}&response_type=code&remember=${this.remember}`;
      window.location.href = auth_uri;
    },
  },
};
</script>

<style scoped>
.login-bg {
  background: #fafbfc;
  min-height: 100vh;
}

.input-field :deep(input) {
  font-size: 1.1rem;
  background: #fff !important;
  border-radius: 11px !important;
}

.login-btn {
  box-shadow: none !important;
}

.find-link {
  color: #2176ff !important;
  font-size: 0.97rem;
  text-decoration: none;
  font-weight: 500;
}

.signup-link {
  color: #2176ff !important;
  margin-left: 0.3em;
  text-decoration: none;
  font-weight: 500;
}

.gap-3 {
  gap: 1rem;
}

.remember-checkbox {
  font-size: 0.97rem;
  color: #444;
  margin: 0;
  padding: 0;
}

/* "또는" 구분선 */
.divider-row {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.divider-text {
  margin: 0 12px;
  color: #b0b4ba;
  font-size: 0.98rem;
  white-space: nowrap;
}

/* 소셜 로그인 이미지 버튼 */
.social-image-btn {
  width: 100%;
  max-width: 190px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgba(60, 60, 60, 0.07);
  cursor: pointer;
  background: #fff;
  border: 1.7px solid #ececec;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: filter 0.13s;
}

.social-image-btn img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.social-image-btn:hover {
  filter: brightness(1.06);
  border-color: #2176ff55;
}

.checkbox-wrap {
  display: flex;
  align-items: center; /* 세로 중앙 정렬 */
  height: 100%; /* 부모 높이에 맞춰 정렬 */
}

.plain-checkbox {
  display: flex;
  align-items: center; /* 체크박스와 텍스트 수평 중앙 정렬 */
  gap: 6px;
  margin: 0;
}

.plain-checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: #000;
}

.social-btn {
  width: 190px;
  height: 48px;
  border-radius: 12px;
  padding: 0;
  min-width: unset;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  background-color: transparent !important;
  box-shadow: none !important;
  border: none !important;
  transition: filter 0.13s;
}

/* Vuetify 버튼 오버레이 제거 */
.social-btn::before {
  background-color: transparent !important;
}

/* HANSOOM 로고 스타일 (헤더와 동일) */
.thtBi {
  color: #111;
  font-weight: 700;
  font-style: italic;
  font-family: "Georgia", serif;
  font-size: 1.5rem;
  letter-spacing: 0.05em;
}

/* hover/focus 상태에서 overlay/프레임 제거 */
.social-btn:hover,
.social-btn:focus,
.social-btn:focus-visible {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.social-btn:hover {
  filter: brightness(1.06);
}

/* 아이콘 영역 배경은 흰색 유지 */
.input-field :deep(.v-field__append-inner) {
  background-color: #fff !important;
  padding-right: 8px;
  position: relative; /* ← 캡 포지셔닝용 */
}

/* 오른쪽 끝 미세 공간을 흰색으로 덮어쓰기 */
.input-field :deep(.v-field__append-inner)::after {
  content: "";
  position: absolute;
  right: -12px; /* 필요하면 -6 ~ -10px 사이로 미세조정 */
  top: 0;
  bottom: 0;
  width: 15px; /* 필요하면 8~12px 정도로 조정 */
  background: #fff;
  pointer-events: none;
  border-top-right-radius: 3px;
  border-bottom-right-radius: 3px;
}
</style>
