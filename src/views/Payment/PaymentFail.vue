<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="6" class="text-center">
        <h2>결제 실패</h2>
        <v-btn block color="primary" @click="$router.push('/')"
          >홈으로 돌아가기</v-btn
        >
        <p v-if="countdown > 0">잠시 뒤 홈으로 이동합니다. {{ countdown }}초</p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const countdown = ref(3);
onMounted(() => {
  history.replaceState(null, "", window.location.href);

  window.addEventListener("popstate", () => {
    history.go(1);
  });

  const timer = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(timer);
      router.push("/");
    }
  }, 1000);
});
</script>

<style scoped>
/* 전체 컨테이너 배경 */
.v-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
}

/* 메인 컬럼 스타일 */
.v-col {
  background: #ffffff;
  border: 1px solid #000000;
  padding: 40px 30px;
}

/* 제목 스타일 */
h2 {
  color: #000000;
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 30px;
}

/* 버튼 스타일 재정의 */
.v-btn {
  background: #000000 !important;
  color: #ffffff !important;
  font-weight: 500;
  font-size: 1rem;
  padding: 12px 24px;
  text-transform: none;
  margin: 20px 0;
}

.v-btn:hover {
  background: #333333 !important;
}

/* 카운트다운 텍스트 스타일 */
p {
  color: #666666;
  font-size: 1rem;
  margin-top: 20px;
}

/* 반응형 디자인 */
@media (max-width: 600px) {
  .v-col {
    padding: 30px 20px;
  }

  h2 {
    font-size: 1.8rem;
  }
}
</style>
