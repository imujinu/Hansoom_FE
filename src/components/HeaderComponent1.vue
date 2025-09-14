<template>
  <v-app-bar flat class="header" height="72">
    <router-link to="/" class="logo" aria-label="HANSOOM">
      <span class="thtBi">HANSOOM</span>
    </router-link>
    <nav class="gnb" aria-label="global">
      <router-link
        v-for="(menu, index) in menuItems"
        :key="index"
        :to="menu.path"
        :class="{ on: activeMenu === index }"
        @click="setActiveMenu(index)"
        class="menu-item"
      >
        {{ menu.name }}
      </router-link>
      <router-link
        v-for="(menu, index) in menuItems"
        :key="index"
        :to="menu.path"
        :class="{ on: activeMenu === index }"
        @click="setActiveMenu(index)"
        class="menu-item"
      >
        채팅
      </router-link>
    </nav>
    <div class="utill">
      <div class="btn">
        <router-link
          to="/notifications"
          class="notification icon"
          aria-label="알림"
        >
          <i class="fas fa-bell"></i>
          <span class="notification-badge">3</span>
        </router-link>
        <router-link to="/wishlist" class="wishlist icon" aria-label="찜">
          <i class="fas fa-heart"></i>
        </router-link>
        <router-link to="/mypage" class="mypage icon" aria-label="마이페이지">
          <i class="fas fa-user"></i>
        </router-link>
      </div>
    </div>
  </v-app-bar>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

// 메뉴 데이터 (라우터 경로 포함)
const menuItems = ref([
  { name: "숙소", path: "/stays" },
  { name: "인기지역", path: "/regions" },
  { name: "예약내역", path: "/reservations" },
  { name: "내 주변", path: "/hotel/map" },
  { name: "마이페이지", path: "/mypage" },
]);

// 현재 활성화된 메뉴 인덱스 (라우터 경로 기반으로 자동 계산)
const activeMenu = computed(() => {
  const currentPath = route.path;
  return menuItems.value.findIndex((menu) => menu.path === currentPath);
});

// 메뉴 활성화 함수
const setActiveMenu = (index) => {
  // 라우터를 통해 페이지 이동
  if (menuItems.value[index]) {
    // router.push(menuItems.value[index].path) // 필요시 활성화
  }
};
</script>

<style scoped>
/* ----- Header ----- */
.header {
  background: rgba(0, 0, 0, 0.85) !important;
  color: #fff !important;
  box-shadow: none !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
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

.gnb a {
  font-size: 0.95rem;
  letter-spacing: -0.02em;
  opacity: 0.85;
  padding: 8px 12px;
  cursor: pointer;
  color: #fff;
  min-width: 80px;
  text-align: center;
  transition: none;
}

.gnb a:hover {
  opacity: 1;
}

.gnb a.on {
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
}

.utill .icon:hover {
  background: rgba(255, 255, 255, 1);
}

.utill .wishlist {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  color: #333;
  transition: background 0.3s ease;
}

.utill .wishlist:hover {
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
