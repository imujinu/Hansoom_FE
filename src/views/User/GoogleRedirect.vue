<!-- GoogleRedirect.vue -->
<template>
  <v-container class="oauth-redirect" fluid>
    <div class="center-wrap">
      <div class="status-text">{{ statusText }}</div>
    </div>

    <!-- 409(연동 필요) 모달 -->
    <v-dialog v-model="conflictDialog" persistent max-width="420">
      <v-card rounded="xl">
        <v-card-title class="text-h6">계정 연동이 필요해요</v-card-title>
        <v-card-text class="text-body-2">
          {{ dialogText }}
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" :disabled="dialogLoading" @click="onCancelConflict">취소</v-btn>
          <v-btn
            color="primary"
            :loading="dialogLoading"
            :disabled="dialogLoading"
            @click="onConfirmConflict"
          >
            연동 계속하기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 로딩 오버레이 (검증 중에만 표시) -->
    <v-overlay
      :model-value="loading"
      class="align-center justify-center"
      scrim="rgba(0,0,0,0.08)"
      persistent
    >
      <v-progress-circular indeterminate :size="56" :width="5" color="#000" />
    </v-overlay>
  </v-container>
</template>

<script>
import { getErrorMessage, getResultData } from "@/utils/commonDataHandler";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export default {
  name: "GoogleRedirect",
  data() {
    return {
      loading: true,
      statusText: "구글 로그인 중…",

      // 409 대응용 모달 상태
      conflictDialog: false,
      dialogText: "이미 가입된 정보가 있어요. 기존 계정과 연동하시겠어요?",
      dialogLoading: false,
      linkTicket: null,
    };
  },
  created() {
    this.googleLoginRequest();
  },
  methods: {
    async googleLoginRequest() {
      const code = new URL(window.location.href).searchParams.get("code");
      const remember = new URL(window.location.href).searchParams.get("remember") === "true";
      
      if (!code) {
        this.loading = false;
        this.statusText = "인가 코드를 찾을 수 없습니다.";
        return;
      }
      try {
        const res = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/user/google/login`,
          { 
            code,
            isRemember: remember 
          },
          { withCredentials: true }
        );
        const accessToken = getResultData(res);
        localStorage.setItem("accessToken", accessToken);
        const token = jwtDecode(accessToken);
        console.log(token);
        const email = token.sub;
        const userId = token.userId;
        const role = token.role;
        localStorage.setItem("role", role);
        localStorage.setItem("email", email);
        localStorage.setItem("userId", userId);
        localStorage.setItem("accessToken", accessToken);

        this.statusText = "로그인 성공! 이동 중…";
        setTimeout(() => (window.location.href = "/"), 300);
      } catch (e) {
        const status_code = e?.response?.status ?? e?.response?.data?.status_code;
        if (status_code === 409) {
          // ✅ 여기서 모달창 띄우고, 사용자가 ‘연동 계속하기’를 누르면 재요청
          this.loading = false; // 오버레이 내리고 모달 노출
          this.statusText = "계정 확인 중…";
          this.dialogText = "이미 존재하는 계정입니다. 기존 계정과 연동하시겠어요?";
          this.conflictDialog = true;
          this.linkTicket = e?.response?.data?.status_message
        } else {
          alert(getErrorMessage(e));
          window.location.href = "/";
        }
      }
    },

    // 모달 확인(연동 계속) → reLogin 호출
    async onConfirmConflict() {
      console.log("eunsung111");
      this.dialogLoading = true;
      try {
        if (!this.linkTicket) {
          this.statusText = "연동 정보가 유효하지 않습니다. 다시 시도해주세요.";
          return;
        }
        await this.googleReLoginRequest(); // 아래 메서드 재사용
      } catch(e) {
        console.log(e);
      } finally {
        this.dialogLoading = false;
        this.conflictDialog = false;
      }
    },
    // 모달 취소
    onCancelConflict() {
      this.conflictDialog = false;
      this.statusText = "연동이 취소되었습니다.";
      // 필요하면 특정 페이지로 이동
      // this.$router.push('/login');
    },

    async googleReLoginRequest() {
      const linkTicket = this.linkTicket;
      const remember = new URL(window.location.href).searchParams.get("remember") === "true";
      this.loading = true;
      try {
        const res = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL}/user/google/reLogin`,
          { 
            linkTicket,
            isRemember: remember 
          },
          { withCredentials: true }
        );

        const accessToken = getResultData(res);
        localStorage.setItem("accessToken", accessToken);
        const token = jwtDecode(accessToken);
        console.log(token);
        const email = token.sub;
        const userId = token.userId;
        const role = token.role;
        localStorage.setItem("role", role);
        localStorage.setItem("email", email);
        localStorage.setItem("userId", userId);
        localStorage.setItem("accessToken", accessToken);

        this.statusText = "로그인 성공! 이동 중…";
        setTimeout(() => (window.location.href = "/"), 300);
      } catch (e) {
        this.statusText =
          e?.response?.data?.status_message ||
          "연동에 실패했어요. 다시 시도해주세요.";
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.oauth-redirect {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #fafbfc;
}
.center-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.status-text {
  color: #333;
  font-size: 0.98rem;
}
</style>
