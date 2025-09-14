<template>
  <div class="popular-regions-page">
    <!-- 지역별 호텔 섹션 -->
    <div class="regions-container">
      <div class="container">
        <div
          v-for="region in regions"
          :key="region.name"
          class="region-section"
        >
          <div class="region-header">
            <h2>{{ region.englishName }}</h2>
            <p>{{ region.description }}</p>
          </div>

          <!-- 호텔 카드와 리뷰를 5:5 비율로 배치 -->
          <div class="region-content">
            <!-- 왼쪽: 단일 호텔 카드 (50%) -->
            <div class="hotels-section">
              <div class="single-hotel-wrapper">
                <button
                  class="nav-btn nav-left"
                  @click="previousHotel(region.name)"
                  :disabled="!canGoPrevious(region.name)"
                  aria-label="이전 호텔"
                >
                  <i class="fas fa-chevron-left"></i>
                </button>

                <div class="hotel-display">
                  <SingleHotelCard
                    v-if="getCurrentHotel(region.name)"
                    :id="getCurrentHotel(region.name).id"
                    :rank="getCurrentHotel(region.name).rank"
                    :img="getCurrentHotel(region.name).img"
                    :title="getCurrentHotel(region.name).title"
                    :price="getCurrentHotel(region.name).price"
                    :rating="getCurrentHotel(region.name).rating"
                    :reviews="getCurrentHotel(region.name).reviews"
                    :is-selected="true"
                    @click="
                      selectHotel(getCurrentHotel(region.name), region.name)
                    "
                  />

                  <!-- 호텔이 없는 경우 -->
                  <div v-else class="no-hotel">
                    <i class="fas fa-hotel"></i>
                    <p>호텔 정보가 없습니다</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 오른쪽: 리뷰 섹션 (50%) -->
            <div v-if="selectedHotels[region.name]" class="reviews-section">
              <div class="reviews-wrapper">
                <Suspense>
                  <template #default>
                    <HotelVerticalReviewListCard
                      :hotel-id="selectedHotels[region.name].id"
                    />
                  </template>
                  <template #fallback>
                    <div class="loading-reviews">리뷰를 불러오는 중...</div>
                  </template>
                </Suspense>

                <button
                  class="nav-btn nav-right"
                  @click="nextHotel(region.name)"
                  :disabled="!canGoNext(region.name)"
                  aria-label="다음 호텔"
                >
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent } from "vue";
import axios from "axios";
import SingleHotelCard from "@/components/SingleHotelCard.vue";

// 비동기 컴포넌트로 로드
const HotelVerticalReviewListCard = defineAsyncComponent(() =>
  import("@/views/Review/HotelVerticalReviewListCard.vue")
);




// 지역별 선택된 호텔 상태
const selectedHotels = ref({});

// 지역별 현재 호텔 인덱스
const currentHotelIndex = ref({});

// 지역 데이터
const regions = ref([
  {
    name: "제주도",
    englishName: "JEJU ISLAND",
    description: "자연과 문화가 공존하는 아름다운 섬",
    hotels: [],
  },
  {
    name: "서울",
    englishName: "SEOUL",
    description: "대한민국의 수도",
    hotels: [],
  },
  {
    name: "부산",
    englishName: "BUSAN",
    description: "바다와 도시가 만나는 활기찬 항구도시",
    hotels: [],
  },
  {
    name: "경주",
    englishName: "GYEONGJU",
    description: "천년의 역사가 살아있는 문화도시",
    hotels: [],
  },
  {
    name: "전주",
    englishName: "JEONJU",
    description: "한옥과 전통음식의 고장",
    hotels: [],
  },
]);

// 날짜 관련 함수들
const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

// 각 지역별 인기 호텔 로드
const loadRegionHotels = async (regionName, regionIndex) => {
  try {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const params = new URLSearchParams();
    params.append("address", regionName);
    params.append("checkIn", formatDate(today));
    params.append("checkOut", formatDate(tomorrow));
    params.append("people", "2");

    const response = await axios.get(
      `${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/hotel/place?${params.toString()}`
    );

    if (response.data && response.data.result) {
      const hotelData = response.data.result;

      regions.value[regionIndex].hotels = hotelData.map((hotel, index) => ({
        id: hotel.id,
        rank: index + 1,
        img:
          hotel.image ||
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&h=1200&fit=crop",
        title: hotel.hotelName,
        price: `₩${hotel.price?.toLocaleString() || "0"}~`,
        rating: hotel.rating || 0.0,
        reviews: hotel.reviewCount || 0,
      }));
    }
  } catch (error) {
    console.error(`${regionName} 인기 호텔 로드 실패:`, error);
    regions.value[regionIndex].hotels = [];
  }
};

// 호텔 선택 (탭 기능)
const selectHotel = (hotel, regionName) => {
  selectedHotels.value[regionName] = hotel;
};

// 현재 호텔 가져오기
const getCurrentHotel = (regionName) => {
  const region = regions.value.find((r) => r.name === regionName);
  if (!region || region.hotels.length === 0) return null;

  const currentIndex = currentHotelIndex.value[regionName] || 0;
  return region.hotels[currentIndex] || null;
};

// 이전 호텔로 이동
const previousHotel = (regionName) => {
  const region = regions.value.find((r) => r.name === regionName);
  if (!region || region.hotels.length === 0) return;

  const currentIndex = currentHotelIndex.value[regionName] || 0;
  const newIndex =
    currentIndex > 0 ? currentIndex - 1 : region.hotels.length - 1;

  currentHotelIndex.value[regionName] = newIndex;
  selectedHotels.value[regionName] = region.hotels[newIndex];
};

// 다음 호텔로 이동
const nextHotel = (regionName) => {
  const region = regions.value.find((r) => r.name === regionName);
  if (!region || region.hotels.length === 0) return;

  const currentIndex = currentHotelIndex.value[regionName] || 0;
  const newIndex =
    currentIndex < region.hotels.length - 1 ? currentIndex + 1 : 0;

  currentHotelIndex.value[regionName] = newIndex;
  selectedHotels.value[regionName] = region.hotels[newIndex];
};

// 이전 버튼 활성화 여부
const canGoPrevious = (regionName) => {
  const region = regions.value.find((r) => r.name === regionName);
  return region && region.hotels.length > 1;
};

// 다음 버튼 활성화 여부
const canGoNext = (regionName) => {
  const region = regions.value.find((r) => r.name === regionName);
  return region && region.hotels.length > 1;
};

// 호텔 상세 페이지로 이동 (현재 사용하지 않음)
// const goToHotelDetail = (hotelId) => {
//   router.push(`/hotel/detail/${hotelId}`);
// }

// 컴포넌트 마운트 시 모든 지역의 호텔 로드
onMounted(async () => {
  const loadPromises = regions.value.map((region, index) =>
    loadRegionHotels(region.name, index)
  );

  await Promise.all(loadPromises);

  // 각 지역의 첫 번째 호텔을 자동 선택하고 인덱스 초기화
  regions.value.forEach((region) => {
    if (region.hotels.length > 0) {
      currentHotelIndex.value[region.name] = 0;
      selectedHotels.value[region.name] = region.hotels[0];
    }
  });
});
</script>

<style scoped>
.popular-regions-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 지역 섹션 */
.regions-container {
  padding: 40px 0 80px 0;
}

.region-section {
  margin-bottom: 80px;
}

.region-section:last-child {
  margin-bottom: 0;
}

/* 호텔 카드와 리뷰를 5:5 비율로 배치 */
.region-content {
  display: flex;
  align-items: flex-start;
}

.hotels-section {
  flex: 1;
  min-width: 0; /* flex item이 축소될 수 있도록 */
}

.reviews-section {
  flex: 1;
  min-width: 0; /* flex item이 축소될 수 있도록 */
  margin-left: -20px; /* 호텔 카드와 더 가깝게 붙이기 */
  padding-top: 20px; /* 호텔 카드와 윗라인 맞추기 */
}

.region-header {
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e9ecef;
  text-align: center;
}

.region-header h2 {
  font-size: 2rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
  font-family: "Arial", "Helvetica", sans-serif;
  letter-spacing: 1.5px;
}

.region-header p {
  font-size: 1.1rem;
  font-weight: 500;
  color: #6b7280;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* 단일 호텔 래퍼 */
.single-hotel-wrapper {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.hotel-display {
  flex: 1;
  display: flex;
  justify-content: center;
}

/* 네비게이션 버튼 */
.nav-btn {
  width: 50px;
  height: 50px;
  background: #111827;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.nav-btn:hover:not(:disabled) {
  background: #000000;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.nav-btn i {
  font-size: 18px;
  color: white;
}

.nav-left {
  order: 1;
}

.hotel-display {
  order: 2;
}

/* 리뷰 섹션의 오른쪽 버튼 */
.reviews-wrapper .nav-right {
  position: absolute;
  top: 48%;
  right: -9px;
  transform: translateY(-50%);
  z-index: 20;
  width: 50px;
  height: 50px;
  background: #111827;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.reviews-wrapper .nav-right:hover:not(:disabled) {
  background: #000000;
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.reviews-wrapper .nav-right:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.reviews-wrapper .nav-right i {
  font-size: 18px;
  color: white;
}

/* 호텔이 없는 경우 */
.no-hotel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #6b7280;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.no-hotel i {
  font-size: 3rem;
  margin-bottom: 16px;
  color: #d1d5db;
}

.no-hotel p {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

/* 선택된 호텔 카드 스타일 */
.hotels-grid .selected {
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 2px solid #3b82f6;
}

/* 리뷰 섹션 */
.reviews-section {
  height: 100%;
  min-height: 600px; /* 호텔 카드와 동일한 높이 설정 */
}

.reviews-wrapper {
  position: relative;
  height: 100%;
}

/* 로딩 상태 */
.loading-reviews {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

/* 반응형 */
@media (max-width: 768px) {
  .regions-container {
    padding: 40px 0;
  }

  .region-header h2 {
    font-size: 1.5rem;
    letter-spacing: 1px;
  }

  .region-header p {
    font-size: 1rem;
  }

  /* 모바일에서는 세로 배치 */
  .region-content {
    flex-direction: column;
    gap: 20px;
  }

  .hotels-section {
    order: 1;
  }

  .reviews-section {
    order: 2;
  }

  .single-hotel-wrapper {
    padding: 16px;
    gap: 16px;
  }

  .nav-btn {
    width: 40px;
    height: 40px;
  }

  .nav-btn i {
    font-size: 14px;
  }

  .no-hotel {
    min-height: 250px;
  }

  .no-hotel i {
    font-size: 2rem;
  }
}
</style>
