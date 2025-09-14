<!-- src/views/mypage/MyPage.vue -->
<template>
  <!-- 화면 가득 사용 -->
  <v-container class="mypage-root" fluid>
    <div class="shell">
      <!-- ===== 왼쪽 사이드바 ===== -->
      <aside class="sidenav">
        <!-- 네비게이션: 아이콘 + 텍스트 (앞 정렬 + 왼쪽 여백 고정) -->
        <nav class="nav">
          <router-link
            v-for="m in menus"
            :key="m.to"
            :to="m.to"
            class="nav-row"
            active-class="is-active"
          >
            <v-icon size="20" class="icon">{{ m.icon }}</v-icon>
            <span class="text">{{ m.label }}</span>
          </router-link>
        </nav>

        <div class="grow" />
        <!-- ✅ 하단 로그아웃 버튼 추가 -->
        <button type="button" class="logout-btn" @click="logout" aria-label="로그아웃">
          <v-icon size="18" class="logout-icon">mdi-logout</v-icon>
          <span>로그아웃</span>
        </button>
      </aside>

      <!-- ===== 오른쪽 콘텐츠 ===== -->
      <main class="panel">
        <div class="panel-inner">
          <router-view v-slot="{ Component }">
            <component :is="Component" :user="user" :loading="loading" />
          </router-view>
        </div>
      </main>
    </div>
  </v-container>
</template>

<script>
import axios from "axios";
import { getResultData } from "@/utils/commonDataHandler";

export default {
  name: "MyPage",
  data() {
    return {
      loading: true,
      user: {
        email: "",
        name: "",
        nickName: "",
        phoneNumber: "",
        userRole: "",
        profileImage: null,
        createdTime: "",
      },
      menus: [
        { label: "내정보 관리", to: "/mypage/info",         icon: "mdi-account-circle-outline" },
        { label: "예약 내역",   to: "/mypage/reservations", icon: "mdi-calendar-check-outline" },
        { label: "찜 목록",     to: "/mypage/wish",         icon: "mdi-heart-outline" },
        { label: "내 후기",     to: "/mypage/review",       icon: "mdi-message-outline" },
      ],
    };
  },
  async created() {
    await this.fetchMyPage();
  },
  methods: {
    async fetchMyPage() {
      try {
        this.loading = true;
        const res = await axios.get(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/user/mypage`);
        const data = (getResultData ? getResultData(res) : res?.data?.result) || {};
        this.user = {
          email:        data.email ?? "",
          name:         data.name ?? "",
          nickName:     data.nickName ?? "",
          phoneNumber:  data.phoneNumber ?? "",
          userRole:     data.userRole ?? "",
          profileImage: data.profileImage ?? null,
          createdTime:  data.createdTime ?? "",
        };
      } catch (e) {
        console.error("마이페이지 로드 실패:", e);
      } finally {
        this.loading = false;
      }
    },

    // 로그아웃 기능
    logout() {
      try {
        console.log('MyPage에서 로그아웃 요청');
        // HeaderComponent의 logout 함수 호출
        window.dispatchEvent(new CustomEvent('logout-request'));
      } catch (error) {
        console.error("로그아웃 실패:", error);
        // 에러 발생 시 기본 로그아웃 처리
        this.performLogout();
      }
    },

    // 기본 로그아웃 처리 (HeaderComponent 호출 실패 시)
    performLogout() {
      try {
        console.log('MyPage에서 직접 로그아웃 처리');
        
        // 모든 로컬스토리지 데이터 제거
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("role");
        localStorage.removeItem("email");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        localStorage.removeItem("profileImage");
        localStorage.removeItem("isLoggedIn");
        
        console.log('MyPage 로그아웃 완료 - 모든 로컬스토리지 데이터 제거됨');
        window.location.reload();
      } catch (error) {
        console.error('MyPage 로그아웃 처리 중 오류:', error);
        // 최후의 수단으로 모든 로컬스토리지 클리어
        localStorage.clear();
        window.location.reload();
      }
    },
  },
};
</script>

<style scoped>
/* ===== 전체 레이아웃 & 변수 ===== */
.mypage-root{
  --blue:#111;
  --border:#e8ecf3;
  --panel:#f5f7fb;
  --text:#334155;
  --muted:#94a3b8;

  /* 슬림바/간격 제어 변수 */
  --indPad: 6px;   /* 좌측 가장자리 → 슬림바까지 여백 */
  --indW:   5px;   /* 슬림바 두께 */
  --indGap: 42px;  /* 슬림바 ↔ 아이콘 간격 */

  padding:0 !important;
  background:var(--panel);
  min-height:80vh;
}
.shell{
  display:grid;
  grid-template-columns: 240px 1fr; /* 와이드 사이드바 */
  min-height:80vh;
}

/* ===== 사이드바 ===== */
.sidenav{
  position:sticky; top:0; height:100vh;
  background:#fff;
  border-right:1px solid var(--blue); /* 얇은 파란 테두리 */
  padding:16px 14px;
  display:flex; flex-direction:column; gap:10px;
  box-shadow: 0 6px 24px rgba(20,30,60,.05);
}

/* 네비게이션 */
.nav{ display:flex; flex-direction:column; gap:6px; margin-top:4px; }
.nav-row{
  display:flex; align-items:center; justify-content:flex-start; /* ← 앞 정렬 */
  gap:10px;
  height:46px;
  width:100%;
  border-radius:12px;
  text-decoration:none;
  color:var(--text);
  position:relative;
  transition: background .12s ease, color .12s ease;

  /* 왼쪽 의도적 공백(= 슬림바 + 간격 고정) */
  padding-left: calc(var(--indPad) + var(--indW) + var(--indGap));
  padding-right: 12px;
}

/* 아이콘 머리선 고정: 고정폭 + 중앙정렬 */
.nav-row .icon{
  color:var(--muted);
  width:24px; min-width:24px;
  display:inline-flex; align-items:center; justify-content:center;
}
.nav-row .text{ font-weight:700; letter-spacing:.1px; }

/* hover만 은은한 배경, active에는 배경 없음 */
.nav-row:hover{ background:#f0f5ff; }

/* ✅ 활성: 배경 X, 아이콘/텍스트 포인트 컬러 + 왼쪽 슬림 인디케이터 */
.nav-row.is-active{ background:transparent; }
.nav-row.is-active .icon,
.nav-row.is-active .text{ color:var(--blue) !important; }
.nav-row.is-active::before{
  content:""; position:absolute; left: var(--indPad); top:50%;
  transform:translateY(-50%);
  width:var(--indW); height:36px; border-radius:9999px; background:var(--blue);
}

/* ✅ 하단 로그아웃 버튼 스타일 */
.logout-btn{
  display:flex; align-items:center; justify-content:center; gap:8px;
  width:100%; height:44px;
  border-radius:12px;
  border:1px dashed #d7e6ff;
  background:#f2f7ff;
  color:var(--blue);
  font-weight:800;
  cursor:pointer;
  transition: filter .15s ease;
}
.logout-btn:hover{ filter: brightness(1.03); }
.logout-icon{ color:var(--blue); }

/* ===== 오른쪽 패널 ===== */
.panel{ overflow:auto; }
.panel-inner{ padding:22px 24px 28px; min-height:100%; }
.title{ font-size:22px; font-weight:800; color:#111827; margin:0 0 14px; }

/* 반응형 */
@media (max-width: 860px){
  .shell{ grid-template-columns: 200px 1fr; }
}
@media (max-width: 640px){
  .shell{ grid-template-columns: 1fr; }
  .sidenav{ position:relative; height:auto; border-right:none; border-bottom:1px solid var(--blue); }
}

</style>
