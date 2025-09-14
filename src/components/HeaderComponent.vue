<template>
  <header
    class="header"
    :class="{
      'home-header': isHomePage,
      'content-header': !isHomePage,
      scrolled: isScrolled && isHomePage,
    }"
  >
    <router-link to="/" class="logo" aria-label="HANSOOM">
      <span class="thtBi">HANSOOM</span>
    </router-link>
    <nav class="gnb" aria-label="global">
      <router-link
        to="/"
        class="menu-item"
        :class="{ active: isActiveMenu('/') }"
        >숙소</router-link
      >
      <router-link
        to="/regions"
        class="menu-item"
        :class="{ active: isActiveMenu('/regions') }"
        >인기지역</router-link
      >
      <router-link
        to="/reservations"
        class="menu-item"
        :class="{ active: isActiveMenu('/reservations') }"
        >예약내역</router-link
      >
      <router-link
        to="/hotel/map"
        class="menu-item"
        :class="{ active: isActiveMenu('/hotel/map') }"
        >내 주변</router-link
      >
      <router-link
        v-if="userRole"
        to="/chat"
        class="menu-item"
        :class="{ active: isActiveMenu('/chat') }"
        >채팅</router-link
      >
      <router-link
        :to="getMyPageRoute()"
        class="menu-item"
        :class="{ active: isActiveMenu(getMyPageRoute()) }"
      >
        {{ getMyPageMenuText() }}
      </router-link>
    </nav>

    <div class="utill">
      <div class="btn">
        <!-- 알림(종) 드롭다운 -->
    
        <v-menu
          v-if="isLoggedIn"
          v-model="menuOpen"
          location="bottom end"
          :close-on-content-click="false"
          offset="8"
        >
          <template #activator="{ props }">
            <v-badge
              v-if="displayCount > 0"
              :content="badgeText"
              color="red"
              location="top end"
              offset-x="3"
              offset-y="3"
              bordered
              v-bind="props"
            >
              <button type="button" class="notification icon" aria-label="알림">
                <i class="fas fa-bell"></i>
                <span class="notification-badge">{{ displayCount }}</span>
              </button>
            </v-badge>

            <template v-else>
              <button
                type="button"
                class="notification icon"
                aria-label="알림"
                v-bind="props"
              >
                <i class="fas fa-bell"></i>
              </button>
            </template>
          </template>

          <!-- 팝오버 본문 -->
          <div class="notif-panel">
            <div class="notif-header">
              <span class="notif-title">알림</span>
              <span class="notif-count">{{ displayCount }}</span>
            </div>

            <div class="notif-body">
              <!-- 로딩 -->
              <div v-if="notifLoading" class="notif-empty">불러오는 중…</div>

              <!-- 데이터 없음 -->
              <div v-else-if="notifList.length === 0" class="notif-empty">
                새로운 알림이 없습니다.
              </div>

              <!-- 리스트 -->
              <v-list v-else density="compact">
                <v-list-item
                  v-for="(n, i) in notifList"
                  :key="n.id || i"
                  class="notif-item"
                  role="button"
                  tabindex="0"
                  @click="handleNotificationClick(n)"
                  @keydown.enter.prevent="handleNotificationClick(n)"
                >
                  <div class="notif-main">
                    <!-- 제목: 독립 라인(마키 대상) -->
                    <div
                      class="notif-title-text"
                      :ref="(el) => (titleRefs[i] = el)"
                      :title="n.title"
                    >
                      {{ n.title }}
                    </div>

                    <!-- 본문: 독립 라인 -->
                    <div class="notif-body-text">
                      {{ n.body }}
                    </div>

                    <!-- 푸터: 왼쪽 날짜, 오른쪽 X버튼 -->
                    <div class="notif-footer-row">
                      <span class="notif-date">{{
                        formatDate(n.createdTime)
                      }}</span>
                      <button
                        class="notif-dismiss"
                        type="button"
                        aria-label="알림 읽음 처리"
                        @click.stop="dismissNotification(n)"
                      >
                        <v-icon size="16">mdi-close</v-icon>
                      </button>
                    </div>
                  </div>
                </v-list-item>
              </v-list>
            </div>
          </div>
        </v-menu>

        <!-- 로그인하지 않은 상태의 알림 버튼 -->
        <template v-else>
          <v-badge
            v-if="displayCount > 0"
            :content="badgeText"
            color="red"
            location="top end"
            offset-x="3"
            offset-y="3"
            bordered
          >
            <button
              type="button"
              class="notification icon"
              aria-label="알림"
              @click="onNotificationClick"
            >
              <i class="fas fa-bell"></i>
              <span class="notification-badge">{{ displayCount }}</span>
            </button>
          </v-badge>

          <template v-else>
            <button
              type="button"
              class="notification icon"
              aria-label="알림"
              @click="onNotificationClick"
            >
              <i class="fas fa-bell"></i>
            </button>
          </template>
        </template>

        <!-- 찜 버튼 -->
        <button
          type="button"
          class="wishlist icon"
          aria-label="찜"
          @click="goToWishlist"
        >
          <i class="fas fa-heart"></i>
        </button>

        <!-- 마이페이지 드롭다운 -->
        <v-menu
          v-model="mypageMenuOpen"
          location="bottom end"
          :close-on-content-click="false"
          offset="8"
        >
          <template #activator="{ props }">
            <button
              type="button"
              class="mypage icon"
              aria-label="마이페이지"
              v-bind="props"
            >
              <i v-if="isLoggedIn" class="fas fa-user"></i>
              <i v-else class="fas fa-sign-in-alt"></i>
            </button>
          </template>

          <!-- 마이페이지 메뉴 -->
          <div class="mypage-panel">
            <div class="mypage-header">
              <span class="mypage-title">사용자 메뉴</span>
            </div>

            <div class="mypage-body">
              <template v-if="isLoggedIn">
                <div class="mypage-user-info">
                  <div class="user-avatar">
                    <img
                      v-if="user.profileImage"
                      :src="user.profileImage"
                      :alt="user.name"
                      class="profile-image"
                    />
                    <i v-else class="fas fa-user-circle"></i>
                  </div>
                  <div class="user-details">
                    <div class="user-name">{{ user.name }} 님</div>
                    <div class="user-role">
                      {{ getUserRoleText(user.userRole) }}
                    </div>
                  </div>
                </div>
                <div class="mypage-actions">
                  <router-link
                    to="/mypage"
                    class="mypage-action-item"
                    @click="mypageMenuOpen = false"
                  >
                    <i class="fas fa-user-cog"></i>
                    <span>마이페이지</span>
                  </router-link>
                  <router-link
                    to="/admin/dashboard"
                    v-if="user.userRole === 'ADMIN'"
                    class="mypage-action-item"
                    @click="mypageMenuOpen = false"
                  >
                    <i class="fas fa-desktop"></i>
                    <span>관리자페이지</span>
                  </router-link>
                  <router-link
                    to="/myhostpage"
                    v-if="user.userRole === 'HOST'"
                    class="mypage-action-item"
                    @click="mypageMenuOpen = false"
                  >
                    <i class="fas fa-hotel"></i>
                    <span>호스트 대시보드</span>
                  </router-link>
                  <a
                    href="#"
                    class="mypage-action-item logout-action"
                    @click="logout"
                  >
                    <i class="fas fa-sign-out-alt"></i>
                    <span>로그아웃</span>
                  </a>
                </div>
              </template>
              <template v-else>
                <div class="mypage-login-actions">
                  <router-link
                    to="/user/login"
                    class="mypage-action-item"
                    @click="mypageMenuOpen = false"
                  >
                    <i class="fas fa-sign-in-alt"></i>
                    <span>로그인</span>
                  </router-link>
                  <router-link
                    to="/user/create"
                    class="mypage-action-item"
                    @click="mypageMenuOpen = false"
                  >
                    <i class="fas fa-user-plus"></i>
                    <span>회원가입</span>
                  </router-link>
                </div>
              </template>
            </div>
          </div>
        </v-menu>
      </div>
    </div>

    <!-- 스낵바 -->
    <v-snackbar
      v-model="showSnackbar"
      timeout="3000"
      color="error"
      location="top"
      variant="flat"
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </header>
</template>

<script>
import axios from "axios";
import { EventSourcePolyfill } from "event-source-polyfill";
import { jwtDecode } from "jwt-decode";

export default {
  name: "HeaderBar",
  data() {
    return {
      isLoggedIn: !!localStorage.getItem("accessToken"),
      isScrolled: false,
      // 사용자 정보
      user: {
        name: "",
        userRole: "",
        profileImage: null,
      },

      // 알림 상태
      menuOpen: false,
      mypageMenuOpen: false,
      notifLoading: false,
      // { id, reservationId, hotelId, createdTime, title, body }[]
      notifList: [],
      notifCount: 0,

      // 제목 마키(자동 스크롤)
      titleRefs: {},
      marqueeRafs: {},
      marqueeTimers: {},

      // 🔌 SSE
      sse: null,
      sseHandlers: null,
      userRole: null,
      isLogined: false,

      // 스낵바
      showSnackbar: false,
      snackbarMessage: "",
    };
  },
  computed: {
    displayCount() {
      return this.isLoggedIn ? this.notifCount : 0;
    },
    badgeText() {
      return this.displayCount > 99 ? "99+" : String(this.displayCount);
    },
    isHomePage() {
      const isHome =
        this.$route.path === "/" || this.$route.path === "/hansoom/home";
      return isHome;
    },
  },
  async created() {
    window.addEventListener("storage", this.onStorage);
    // 결제 완료 시 알림 초기화 이벤트 리스너
    window.addEventListener("refresh-notifications", this.handleRefreshNotifications);

    if (this.isLoggedIn) {
      await this.fetchNotifications();
      await this.fetchUserInfo(); // 사용자 정보 로드
    }

    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      const payload = jwtDecode(accessToken);
      this.userRole = payload.role;
      this.isLogined = true;
    }
    this.startSSE();
  },
  mounted() {
    window.addEventListener("scroll", this.handleScroll);
    // MyPage에서 로그아웃 요청을 받는 이벤트 리스너
    window.addEventListener("logout-request", this.logout);
  },
  beforeUnmount() {
    window.removeEventListener("storage", this.onStorage);
    window.removeEventListener("scroll", this.handleScroll);
    // 로그아웃 이벤트 리스너 제거
    window.removeEventListener("logout-request", this.logout);
    // 결제 완료 알림 초기화 이벤트 리스너 제거
    window.removeEventListener("refresh-notifications", this.handleRefreshNotifications);
    this.clearAllMarquees();
    this.stopSSE();
  },
  watch: {
    menuOpen(val) {
      if (val) {
        this.$nextTick(this.initMarquees);
      } else {
        this.clearAllMarquees();
      }
    },
    notifList() {
      if (this.menuOpen) {
        this.$nextTick(this.initMarquees);
      }
    },
    $route() {
      // 라우트 변경 시 스크롤 상태 초기화
      this.isScrolled = false;
    },
  },
  methods: {
    // 사용자 정보 가져오기
 

    async fetchUserInfo() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const res = await axios.get(
          `${
            process.env.VUE_APP_API_BASE_URL || "http://localhost:8080"
          }/user/mypage`
        );
        const data = res?.data?.result || {};

        this.user = {
          name: data.name || "",
          userRole: data.userRole || "",
          profileImage: data.profileImage || null,
        };
      } catch (e) {
        console.error("사용자 정보 로드 실패:", e);
      }
    },

    // 사용자 역할을 한글로 변환
    getUserRoleText(userRole) {
      switch (userRole) {
        case "USER":
          return "회원";
        case "HOST":
          return "호스트";
        case "ADMIN":
          return "관리자";
        default:
          return "회원";
      }
    },

    // 메뉴 활성화 상태 확인
    isActiveMenu(path) {
      // 홈페이지에서는 '숙소' 메뉴가 기본 활성화
      if (this.isHomePage && path === "/") {
        return true;
      }
      // 마이페이지는 /mypage로 시작하는 모든 경로에서 활성화
      if (path === "/mypage" && this.$route.path.startsWith("/mypage")) {
        return true;
      }
      // 다른 페이지에서는 현재 라우트와 일치하는 메뉴만 활성화
      return this.$route.path === path;
    },

    // 스크롤 이벤트 핸들러
    handleScroll() {
      // 홈페이지에서만 스크롤 효과 적용
      if (this.isHomePage) {
        const scrollY = window.scrollY;
        const videoHeight = window.innerHeight; // 동영상 높이

        if (scrollY > videoHeight * 0.3) {
          // 동영상 영역을 벗어나면 헤더를 진하게
          this.isScrolled = true;
        } else {
          // 동영상 영역에 있으면 헤더를 투명하게
          this.isScrolled = false;
        }
      }
    },

    /* ====== 라우트 경로 결정 유틸 ======
       알림 타입에 따라 적절한 페이지로 이동 */
    resolveRouteByNotification(n) {
      console.log("알림 데이터 전체:", n);
      console.log("알림 제목:", n?.title);
      console.log("알림 타입:", n?.type);

      // NEW_HOTEL_SUBMITTED: 관리자 대시보드로 이동
      if (n?.type === "NEW_HOTEL_SUBMITTED") {
        const route = { path: "/admin/dashboard" };
        console.log("호텔 등록 심사 요청 - 관리자 대시보드로 이동:", route);
        return route;
      }

      // REVIEW_REQUEST: 완료된 예약 탭으로 이동
      if (n?.type === "REVIEW_REQUEST") {
        const route = { path: "/reservations", query: { tab: "completed" } };
        console.log("리뷰 요청 알림 - 완료된 예약 탭으로 이동:", route);
        return route;
      }

      // 나머지는 기본 예약 내역 페이지로 이동
      const route = { path: "/reservations" };
      console.log("일반 알림 - 기본 예약 내역 페이지로 이동:", route);
      return route;
    },

    /* ====== SSE 연결 관리 ====== */
    startSSE() {
      if (this.sse) return;

      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) return;

      this.sseHandlers = {
        connect: (event) => {
          console.log("[SSE] connect:", event);
        },
        reserved: (event) => {
          console.log("[SSE] reserved:", event);
          this.fetchNotifications();
        },
        hotelSubmitted: (event) => {
          console.log("[SSE] hotelSubmitted:", event);
          this.fetchNotifications();
        },
      };

      this.sse = new EventSourcePolyfill(
        `${process.env.VUE_APP_API_BASE_URL}/sse/connect`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      this.sse.addEventListener("connect", this.sseHandlers.connect);
      this.sse.addEventListener("reserved", this.sseHandlers.reserved);
      this.sse.addEventListener(
        "hotelSubmitted",
        this.sseHandlers.hotelSubmitted
      );
    },
    stopSSE() {
      try {
        if (this.sse && this.sseHandlers) {
          this.sse.removeEventListener("connect", this.sseHandlers.connect);
          this.sse.removeEventListener("reserved", this.sseHandlers.reserved);
          this.sse.removeEventListener(
            "hotelSubmitted",
            this.sseHandlers.hotelSubmitted
          );
        }
        if (this.sse) this.sse.close();
      } catch (e) {
        console.warn("[SSE] close error:", e);
      } finally {
        this.sse = null;
        this.sseHandlers = null;
      }
    },

    /* ====== 알림 API ====== */
    async fetchNotifications() {
      try {
        this.notifLoading = true;
        const token = localStorage.getItem("accessToken");

        const res = await axios.get(
          `${
            process.env.VUE_APP_API_BASE_URL || "http://localhost:8080"
          }/noti/list`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        const data = res?.data;
        const list = Array.isArray(data?.result) ? data.result : [];
        this.notifList = this.$dateUtils.sortByServerTime(list, "createdTime");
        this.notifCount = this.notifList.length;
      } catch (e) {
        console.error("알림 목록 조회 실패:", e);
        this.notifList = [];
        this.notifCount = 0;
      } finally {
        this.notifLoading = false;
      }
    },

    // 메인 클릭: 읽음 처리 + 조건부 이동(reservationId / hotelId)
    async handleNotificationClick(n) {
      try {
        const token = localStorage.getItem("accessToken");
        if (n?.id != null) {
          await axios.patch(
            `${
              process.env.VUE_APP_API_BASE_URL || "http://localhost:8080"
            }/noti/updateState/${n.id}`,
            {},
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );
        }
        await this.fetchNotifications();

        const route = this.resolveRouteByNotification(n);
        console.log("알림 클릭 - 알림 데이터:", n);
        console.log("이동할 경로:", route);

        if (route) {
          this.menuOpen = false;
          this.$router.push(route);
        }
      } catch (e) {
        console.error("알림 클릭 처리 실패:", e);
      }
    },

    // X 버튼: 읽음 처리만 (이동 없음)
    async dismissNotification(n) {
      try {
        const token = localStorage.getItem("accessToken");
        if (n?.id != null) {
          await axios.patch(
            `${
              process.env.VUE_APP_API_BASE_URL || "http://localhost:8080"
            }/noti/updateState/${n.id}`,
            {},
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          );
        }
        await this.fetchNotifications();
      } catch (e) {
        console.error("알림 읽음 처리 실패:", e);
      }
    },

    // 결제 완료 시 알림 초기화
    async handleRefreshNotifications() {
      try {
        console.log('결제 완료: 알림 새로고침 시작');
        await this.fetchNotifications();
        console.log('결제 완료: 알림 새로고침 완료');
      } catch (error) {
        console.error('결제 완료: 알림 새로고침 실패:', error);
      }
    },

    /* ====== 세션/로그인 연동 ====== */
    onStorage(e) {
      if (e.key === "accessToken") {
        this.isLoggedIn = !!localStorage.getItem("accessToken");

        this.stopSSE();
        if (this.isLoggedIn) {
          const token = localStorage.getItem("accessToken");
          if (token) {
            try {
              const payload = jwtDecode(token);
              this.userRole = payload.role;
            } catch (error) {
              console.log(error);
            }
          }
          this.fetchNotifications();
          this.startSSE();
          this.fetchUserInfo(); // 사용자 정보 로드
        } else {
          this.notifList = [];
          this.notifCount = 0;
          this.menuOpen = false;
          this.mypageMenuOpen = false;
          this.userRole = null;
          this.isLogined = false;
          this.user = { name: "", userRole: "", profileImage: null }; // 로그아웃 시 사용자 정보 초기화
        }
      }
    },
    async logout() {
      try {
        // 서버에 로그아웃 요청 (실패해도 클라이언트에서 로그아웃 처리)
        try {
          const response = await axios.post(
            `${
              process.env.VUE_APP_API_BASE_URL || "http://localhost:8080"
            }/user/auth/logout`,
            null,
            { withCredentials: true }
          );
          console.log("서버 로그아웃 성공:", response);
        } catch (serverError) {
          console.log(
            "서버 로그아웃 실패, 클라이언트에서 로그아웃 처리:",
            serverError
          );
        }

        // 모든 로컬스토리지 데이터 제거
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("role");
        localStorage.removeItem("email");
        localStorage.removeItem("userId");

        // 추가로 저장될 수 있는 데이터들도 제거
        localStorage.removeItem("userRole");
        localStorage.removeItem("userName");
        localStorage.removeItem("profileImage");
        localStorage.removeItem("isLoggedIn");

        // SSE 연결 중지
        this.stopSSE();

        // 컴포넌트 상태 초기화
        this.isLoggedIn = false;
        this.isLogined = false;
        this.notifList = [];
        this.notifCount = 0;
        this.menuOpen = false;
        this.mypageMenuOpen = false;
        this.userRole = null;
        this.user = { name: "", userRole: "", profileImage: null };

        console.log("로그아웃 완료 - 모든 로컬스토리지 데이터 제거됨");

        // 페이지 새로고침하여 모든 상태 초기화
        window.location.reload();
      } catch (error) {
        console.error("로그아웃 처리 중 오류:", error);

        // 오류가 발생해도 로컬스토리지는 정리
        localStorage.clear();
        window.location.reload();
      }
    },

    /* ====== 기타 ====== */
    formatDate(iso) {
      return this.$dateUtils.formatServerDateTime(iso);
    },

    /* ====== 제목 자동 스크롤(마키) — 한 방향(좌→우)만 ====== */
    initMarquees() {
      this.clearAllMarquees();

      Object.entries(this.titleRefs).forEach(([idx, el]) => {
        if (!el) return;
        el.scrollLeft = 0;

        const overflow = el.scrollWidth - el.clientWidth;
        if (overflow > 2) {
          this.marqueeTimers[idx] = setTimeout(() => {
            if (!this.menuOpen) return;
            this.runMarqueeOneWay(Number(idx), el);
          }, 1000);
        }
      });
    },
    runMarqueeOneWay(idx, el) {
      const overflow = el.scrollWidth - el.clientWidth;
      if (overflow <= 2) return;

      const pxPerSec = 40;
      const startLeft = el.scrollLeft;
      const target = overflow;
      const distance = target - startLeft;
      const duration = Math.max(1, Math.abs(distance) / pxPerSec) * 1000;

      const startTs = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - startTs) / duration);
        el.scrollLeft = startLeft + distance * t;

        if (t < 1) {
          this.marqueeRafs[idx] = requestAnimationFrame(step);
        } else {
          this.marqueeTimers[idx] = setTimeout(() => {
            el.scrollLeft = 0;
            this.marqueeTimers[idx] = setTimeout(() => {
              if (!this.menuOpen) return;
              this.runMarqueeOneWay(idx, el);
            }, 1000);
          }, 1000);
        }
      };

      this.marqueeRafs[idx] = requestAnimationFrame(step);
    },
    clearAllMarquees() {
      Object.values(this.marqueeRafs).forEach((id) => cancelAnimationFrame(id));
      Object.values(this.marqueeTimers).forEach((id) => clearTimeout(id));
      this.marqueeRafs = {};
      this.marqueeTimers = {};

      Object.values(this.titleRefs).forEach((el) => {
        if (el) el.scrollLeft = 0;
      });
    },

    // 마이페이지 메뉴 텍스트 및 경로 결정
    getMyPageMenuText() {
      if (this.isLoggedIn) {
        if (this.user.userRole === "ADMIN") {
          return "관리자페이지";
        } else if (this.user.userRole === "HOST") {
          return "호스트페이지";
        } else if (this.user.userRole === "USER") {
          return "마이페이지";
        }
        return this.user.name || "마이페이지";
      }
      return "마이페이지";
    },
    getMyPageRoute() {
      if (this.isLoggedIn) {
        if (this.user.userRole === "ADMIN") {
          return "/admin/dashboard";
        } else if (this.user.userRole === "HOST") {
          return "/myhostpage";
        }
        return "/mypage";
      }
      return "/user/login"; // 로그인 페이지로 리다이렉트
    },

    // 찜 목록 페이지로 이동
    goToWishlist() {
      if (this.isLoggedIn) {
        this.$router.push("/mypage/wish");
      } else {
        this.showSnackbarMessage("찜 목록은 로그인 후 이용 가능합니다.");
      }
    },

    // 알림 버튼 클릭 처리 (로그인하지 않은 상태에서만 호출됨)
    onNotificationClick() {
      this.showSnackbarMessage("알림은 로그인 후 이용 가능합니다.");
    },

    // 스낵바 메시지 표시
    showSnackbarMessage(message) {
      this.snackbarMessage = message;
      this.showSnackbar = true;
      setTimeout(() => {
        this.hideSnackbar();
      }, 3000);
    },

    // 스낵바 숨김
    hideSnackbar() {
      this.showSnackbar = false;
    },
  },
};
</script>

<style scoped>
/* ----- Header ----- */
.header {
  position: fixed;
  inset: 0 0 auto 0;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  z-index: 100;
  color: #fff;
}

/* 헤더 내의 모든 링크에서 밑줄 제거 */
.header a {
  text-decoration: none;
}

/* 홈페이지 헤더 - 기본적으로 완전 투명 */
.header.home-header {
  background: transparent;
}

.header.home-header::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0));
  pointer-events: none;
  transition: background 0.3s ease;
}

/* 스크롤된 상태의 홈페이지 헤더 - 검게 */
.header.home-header.scrolled::before {
  background: rgba(0, 0, 0, 0.95);
}

/* 콘텐츠 페이지 헤더 - 항상 검게, 콘텐츠를 가리지 않음 */
.header.content-header {
  background: rgba(0, 0, 0, 0.95);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header.content-header::before {
  display: none;
}

.header .logo {
  position: relative;
  display: flex;
  align-items: center;
  z-index: 1;
  font-weight: 700;
  font-size: 1.2rem;
}
.thtBi {
  color: #fff;
  font-weight: 700;
  font-style: italic;
  font-family: "Georgia", serif;
}

.gnb {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 28px;
  z-index: 1;
}
.gnb .menu-item {
  font-size: 0.95rem;
  letter-spacing: -0.02em;
  opacity: 0.85;
  padding: 8px 12px;
  cursor: pointer;
  color: #fff;
  min-width: 80px;
  text-align: center;
  transition: none;
  text-decoration: none;
}
.gnb .menu-item:hover {
  opacity: 1;
}
.gnb .menu-item.active {
  opacity: 1;
  font-weight: 700;
  border-bottom: 2px solid #fff;
  transition: none;
}

.utill {
  margin-left: auto;
  position: relative;
  z-index: 1;
}
.utill .btn {
  display: flex;
  gap: 12px;
  align-items: center;
}

.utill .icon {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  transition: background 0.3s ease;
  text-decoration: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.utill .icon:hover {
  background: rgba(255, 255, 255, 1);
}

/* 알림 배지 */
.notification {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* === 알림 드롭다운 패널 === */
.notif-panel {
  width: 360px;
  max-width: 86vw;
  background: #fff;
  border: none;
  border-radius: 8px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

/* 헤더 색상 */
.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #111;
  color: #fff;
}
.notif-title {
  font-weight: 800;
}
.notif-count {
  font-weight: 700;
  opacity: 0.95;
}

.notif-body {
  max-height: 360px;
  overflow-y: auto;
  border-top: 1px solid #e9eefc;
}
.notif-empty {
  padding: 24px 14px;
  color: #6b7280;
  font-size: 14px;
  text-align: center;
}

/* 리스트 행 */
.notif-item {
  padding: 10px 14px !important;
  border-bottom: 1px solid #f6f7f9;
  cursor: pointer;
}
.notif-item:last-child {
  border-bottom: 0;
}

/* 본문 블록 */
.notif-main {
  min-width: 0;
}

/* 제목: 한 줄 + 오버플로우 스크롤(마키 대상) */
.notif-title-text {
  font-weight: 700;
  color: #111827;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  scrollbar-width: none;
}
.notif-title-text::-webkit-scrollbar {
  display: none;
}

/* 본문: 두 줄까지 표시 */
.notif-body-text {
  color: #374151;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 푸터: 날짜(왼쪽) / X버튼(오른쪽) */
.notif-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}
.notif-date {
  color: #6b7280;
  font-size: 12px;
  white-space: nowrap;
}

/* 닫기(X): 우측 작은 버튼 */
.notif-dismiss {
  border: 0;
  background: transparent;
  padding: 4px;
  cursor: pointer;
  color: #9aa3af;
  border-radius: 6px;
}
.notif-dismiss:hover {
  color: #111;
}

/* === 마이페이지 드롭다운 패널 === */
.mypage-panel {
  width: 280px;
  max-width: 86vw;
  background: #fff;
  border: none;
  border-radius: 8px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.mypage-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 14px;
  background: #111;
  color: #fff;
  border-bottom: 1px solid #e9eefc;
}
.mypage-title {
  font-weight: 800;
  font-size: 14px;
}

.mypage-body {
  padding: 16px;
}

.mypage-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: #e9ecef;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  font-size: 20px;
  overflow: hidden;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.user-details {
  flex: 1;
}

.user-name {
  font-weight: 600;
  color: #212529;
  margin-bottom: 2px;
}

.user-role {
  font-size: 12px;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mypage-actions,
.mypage-login-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mypage-action-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  color: #495057;
  text-decoration: none;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.mypage-action-item:hover {
  color: #333;
}

.mypage-action-item i {
  width: 16px;
  text-align: center;
  color: #6c757d;
}

.mypage-action-item:hover i {
  color: #333;
}

.logout-action {
  color: #dc3545;
}

.logout-action i {
  color: #dc3545;
}

.logout-action:hover {
  color: #721c24;
}

.logout-action:hover i {
  color: #721c24;
}

/* 반응형 */
@media (max-width: 768px) {
  .header {
    gap: 14px;
    padding: 0 16px;
  }
  .gnb {
    display: none;
  }
}
</style>
