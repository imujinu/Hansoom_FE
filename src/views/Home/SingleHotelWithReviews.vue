<template>
  <div class="single-hotel-page">
    <!-- 페이지 헤더 -->
    <div class="page-header">
      <div class="header-content">
        <h1>인기 호텔</h1>
        <p>추천 호텔의 상세 정보와 고객 리뷰를 확인해보세요</p>
      </div>
    </div>

    <!-- 호텔과 리뷰를 5:5 비율로 배치 -->
    <div class="hotel-reviews-container">
      <div class="container">
        <div class="hotel-reviews-content">
          <!-- 왼쪽: 단일 호텔 카드 (50%) -->
          <div class="hotel-section">
            <SingleHotelCard
              v-if="selectedHotel"
              :id="selectedHotel.id"
              :rank="selectedHotel.rank"
              :img="selectedHotel.img"
              :title="selectedHotel.title"
              :price="selectedHotel.price"
              :rating="selectedHotel.rating"
              :reviews="selectedHotel.reviews"
              :is-selected="true"
              @click="onHotelClick"
            />
            
            <!-- 호텔이 선택되지 않은 경우 -->
            <div v-else class="no-hotel-selected">
              <div class="no-hotel-icon">
                <i class="fas fa-hotel"></i>
              </div>
              <h3>호텔을 선택해주세요</h3>
              <p>좌측의 호텔 목록에서 관심 있는 호텔을 클릭하면 상세 정보와 리뷰를 확인할 수 있습니다.</p>
            </div>
          </div>
          
          <!-- 오른쪽: 리뷰 섹션 (50%) -->
          <div v-if="selectedHotel" class="reviews-section">
            <div class="reviews-container">
              <div class="reviews-header">
                <h3>{{ selectedHotel.title }} 리뷰</h3>
                <p>고객들의 실제 후기를 확인해보세요</p>
              </div>
              <Suspense>
                <template #default>
                  <HotelVerticalReviewListCard :hotel-id="selectedHotel.id" />
                </template>
                <template #fallback>
                  <div class="loading-reviews">리뷰를 불러오는 중...</div>
                </template>
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import SingleHotelCard from '@/components/SingleHotelCard.vue'

// 비동기 컴포넌트로 로드
const HotelVerticalReviewListCard = defineAsyncComponent(() => 
  import('@/views/Review/HotelVerticalReviewListCard.vue')
)

const router = useRouter()

// 선택된 호텔 상태
const selectedHotel = ref(null)

// 날짜 관련 함수
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
}

// 호텔 카드 클릭 이벤트
const onHotelClick = (hotel) => {
  selectedHotel.value = hotel;
}

// 컴포넌트 마운트 시 기본 호텔 로드 (선택사항)
onMounted(async () => {
  // 필요시 기본 호텔을 로드하거나 첫 번째 호텔을 선택
  // await loadDefaultHotel();
});

// 외부에서 호텔을 설정할 수 있는 메서드 (부모 컴포넌트에서 사용)
const setSelectedHotel = (hotel) => {
  selectedHotel.value = hotel;
};

// 외부에서 접근 가능하도록 expose
defineExpose({
  setSelectedHotel
});
</script>

<style scoped>
.single-hotel-page {
  min-height: 100vh;
  background: #f8f9fa;
}

/* 페이지 헤더 */
.page-header {
  background: transparent;
  padding: 80px 0 60px 0;
  text-align: center;
  color: #111827;
}

.header-content h1 {
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #111827;
}

.header-content p {
  font-size: 1.25rem;
  font-weight: 500;
  margin: 0;
  color: #6b7280;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 호텔과 리뷰를 5:5 비율로 배치 */
.hotel-reviews-container {
  padding: 80px 0;
}

.hotel-reviews-content {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.hotel-section {
  flex: 1;
  min-width: 0;
}

.reviews-section {
  flex: 1;
  min-width: 0;
}


/* 호텔이 선택되지 않은 경우 */
.no-hotel-selected {
  background: white;
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
}

.no-hotel-icon {
  font-size: 4rem;
  color: #d1d5db;
  margin-bottom: 24px;
}

.no-hotel-selected h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 12px 0;
}

.no-hotel-selected p {
  color: #6b7280;
  font-size: 16px;
  line-height: 1.5;
  margin: 0;
}

/* 리뷰 섹션 */
.reviews-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  height: 100%;
}

.reviews-header {
  text-align: center;
  margin-bottom: 20px;
}

.reviews-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.reviews-header p {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
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
  .page-header {
    padding: 60px 0 40px 0;
  }
  
  .header-content h1 {
    font-size: 2rem;
  }
  
  .header-content p {
    font-size: 1rem;
  }
  
  .hotel-reviews-container {
    padding: 40px 0;
  }
  
  /* 모바일에서는 세로 배치 */
  .hotel-reviews-content {
    flex-direction: column;
    gap: 20px;
  }
  
  .hotel-section {
    order: 1;
  }
  
  .reviews-section {
    order: 2;
  }
  
  
  .no-hotel-selected {
    padding: 40px 20px;
  }
  
  .no-hotel-icon {
    font-size: 3rem;
  }
  
  .reviews-container {
    padding: 16px;
  }
}
</style>
