<!-- HotelVerticalReviewListCard.vue -->
<template>
  <div>
    <v-card class="rv-wrap" elevation="1">
      <!-- 헤더 -->
      <div class="rv-header">
        <div class="rv-score">
          <i class="fas fa-star filled"></i>
          <span class="avg">{{ average.toFixed(1) }}</span>
          <span class="count">({{ total }})</span>
          <span class="divider">·</span>
          <span class="reply">숙소답변({{ hostReplies }})</span>
        </div>

        <v-btn class="rv-more" variant="text" :to="`/review/hotel/list/${hotelId}`">
          전체보기
          <v-icon size="18">mdi-chevron-right</v-icon>
        </v-btn>
      </div>

      <!-- 본문 - 세로 스크롤 -->
      <div class="rv-body-vertical">
        <!-- 빈 상태 -->
        <div v-if="!loading && reviews.length === 0" class="rv-empty">
          리뷰가 없습니다.
        </div>

        <!-- 로딩 -->
        <div v-else-if="loading" class="rv-loading">
          <v-progress-circular indeterminate size="24" color="primary" />
          <span>불러오는 중...</span>
        </div>

        <!-- 리뷰들 - 세로 리스트 -->
        <div v-else class="rv-list-vertical">
          <div
            v-for="(r, i) in reviews"
            :key="i"
            class="rv-item-vertical"
          >
            <div class="rv-item-head">
              <div class="stars">
                <i 
                  v-for="n in 5" 
                  :key="n" 
                  class="fas fa-star" 
                  :class="{ 'filled': n <= Math.round(r.rating) }"
                ></i>
              </div>
              <div class="date">{{ r.date }}</div>
            </div>

            <div class="rv-item-body">
              <div class="content">{{ r.content }}</div>
              <div v-if="r.photoUrls && r.photoUrls.length > 0" class="photo-section">
                <div class="photo-scroll-container" :ref="`scrollContainer_${i}`">
                  <div class="photo-scroll-wrapper">
                    <v-img 
                      v-for="(photoUrl, photoIndex) in r.photoUrls"
                      :key="photoIndex"
                      :src="photoUrl" 
                      height="120" 
                      width="160" 
                      cover 
                      rounded="lg"
                      class="photo-image"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 화살표 버튼들 - 리뷰 아이템 레벨에서 고정 -->
            <div v-if="r.photoUrls && r.photoUrls.length > 1" class="photo-controls">
              <button 
                class="photo-scroll-btn photo-scroll-left"
                @click="scrollPhotos(i, 'left')"
              >
                <i class="fas fa-chevron-left"></i>
              </button>
              
              <button 
                class="photo-scroll-btn photo-scroll-right"
                @click="scrollPhotos(i, 'right')"
              >
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </v-card>

    <!-- 리뷰 작성 모달 연결 -->
    <ReviewWriteModal
      v-model="writeOpen"
      @submit="handleWriteSubmit"
    />
  </div>
</template>

<script>
import axios from "axios";
import { getResultData } from "@/utils/commonDataHandler";
import ReviewWriteModal from "./ReviewWriteModal.vue";

export default {
  name: "HotelVerticalReviewListCard",
  components: { ReviewWriteModal },
  props: {
    hotelId: { type: [String, Number], required: true },
  },
  data() {
    return {
      writeOpen: false,
      loading: false,
      reservationId: 1,

      // 헤더 표기용
      average: 0,
      total: 0,
      hostReplies: 0,

      // 리뷰(최대 10개)
      reviews: [],
    };
  },
  watch: {
    hotelId: {
      immediate: true,
      async handler() {
        await Promise.all([
          this.fetchRatingSummary(), 
          this.fetchReviews(), 
          this.fetchHostRepliesCount()
        ]);
      },
    },
  },
  methods: {
    async handleWriteSubmit({ rating, contents, files }) {
      try {
        const fd = new FormData();
        fd.append("hotelId", this.hotelId);
        fd.append("reservationId", this.reservationId);
        fd.append("rating", String(rating));
        fd.append("contents", contents);
        (files || []).forEach((f, i) => fd.append("reviewImages", f, f.name ?? `photo_${i}.jpg`));

        await axios.post(`${process.env.VUE_APP_API_BASE_URL}/review/create`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        console.log("[submit]", { rating, contents, filesCount: files?.length || 0 });

        // 성공 후 목록/요약/답글 개수 갱신
        await Promise.all([
          this.fetchRatingSummary(), 
          this.fetchReviews(), 
          this.fetchHostRepliesCount()
        ]);
      } catch (e) {
        console.error("리뷰 등록 실패:", e);
      }
    },

    // 평균/총개수 가져오기
    async fetchRatingSummary() {
      try {
        const url = `${process.env.VUE_APP_API_BASE_URL}/review/ratings/${this.hotelId}`;
        const res = await axios.get(url);
        const sum = getResultData(res);
        this.average = Number(sum?.averageRating ?? 0);
        this.total = Number(sum?.ratingCount ?? 0);
      } catch (e) {
        console.error("평균/총개수 로드 실패:", e);
        this.average = 0;
        this.total = 0;
      }
    },

    // 리뷰 목록 가져오기
    async fetchReviews() {
      this.loading = true;
      try {
        const url = `${process.env.VUE_APP_API_BASE_URL}/review/hotel/${this.hotelId}/list`;
        const res = await axios.get(url, { params: { size: 10, page: 0 } });
        const result = getResultData(res);
        const list = Array.isArray(result?.content) ? result.content : [];

        this.reviews = list.map(item => {
          const date = this.formatDate(item.createdTime);
          const imgs = Array.isArray(item.reviewImageResDtoList) ? item.reviewImageResDtoList : [];
          const photoUrls = imgs
            .map(img => img?.reviewImageUrl?.trim())
            .filter(url => url && url !== "");
          return {
            rating: Number(item.rating || 0),
            date,
            content: item.contents || "",
            photoUrls,
          };
        });
        
      } catch (e) {
        console.error("리뷰 목록 로드 실패:", e);
        this.reviews = [];
      } finally {
        this.loading = false;
      }
    },

    // 숙소답변 개수 가져오기
    async fetchHostRepliesCount() {
      try {
        const url = `${process.env.VUE_APP_API_BASE_URL}/reply/hotels/${this.hotelId}/replies/count`;
        const res = await axios.get(url);
        const result = res.data?.result;
        this.hostReplies = Number(result || 0);
      } catch (e) {
        console.error("숙소답변 개수 로드 실패:", e);
        this.hostReplies = 0;
      }
    },

    formatDate(iso) {
      if (!iso) return "";
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}.${m}.${day}`;
    },

    // 사진 스크롤 관련 메서드들
    scrollPhotos(reviewIndex, direction) {
      const container = this.$refs[`scrollContainer_${reviewIndex}`];
      if (!container || container.length === 0) return;
      
      const scrollContainer = container[0];
      const scrollAmount = 180; // 160px (이미지 너비) + 12px (간격) + 8px (여유)
      
      if (direction === 'left') {
        scrollContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    },

  },
};
</script>

<style scoped>
/* 바깥 카드 */
.rv-wrap { 
  border: 1px solid #eceff3; 
  background: #fff; 
  padding: 16px; 
  border-radius: 12px !important;
  max-width: 500px; /* 리뷰 카드 최대 너비 제한 */
}

/* 헤더 */
.rv-header { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  margin-bottom: 16px; 
}

.rv-score { 
  display: inline-flex; 
  align-items: center; 
  gap: 6px; 
  font-weight: 700; 
  color: #1f2937; 
}

.rv-score .avg { 
  font-size: 20px; 
}

.rv-score .count { 
  color: #6b7280; 
  font-weight: 600; 
}

.rv-score .divider { 
  margin: 0 6px; 
  color: #9ca3af; 
}

.rv-score .reply { 
  color: #1f2937; 
  font-weight: 700; 
}

.rv-score i {
  color: #facc15;
  font-size: 18px;
}

.rv-more { 
  display: inline-flex; 
  align-items: center; 
  gap: 4px; 
  background: transparent; 
  border: none; 
  cursor: pointer; 
  color: #111827; 
  font-weight: 700; 
  font-size: 16px; 
}

/* 세로 스크롤 본문 */
.rv-body-vertical {
  height: 450px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
}

.rv-body-vertical::-webkit-scrollbar {
  width: 6px;
}

.rv-body-vertical::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.rv-body-vertical::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.rv-body-vertical::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* 세로 리스트 */
.rv-list-vertical {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 세로 리뷰 아이템 */
.rv-item-vertical { 
  position: relative;
  border-radius: 12px; 
  background: #f8f9fa; 
  border: 1px solid #e9ecef; 
  padding: 16px; 
  transition: all 0.2s ease;
}


.rv-item-head { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  margin-bottom: 12px; 
}

.stars { 
  display: flex; 
  align-items: center; 
  gap: 2px; 
}

.stars i {
  color: #d1d5db;
  font-size: 16px;
}

.stars i.filled {
  color: #facc15;
}

.date { 
  color: #6b7280; 
  font-size: 14px; 
  font-weight: 500;
}

.rv-item-body { 
  display: flex; 
  flex-direction: column; 
  gap: 12px; 
}

.content { 
  color: #374151; 
  line-height: 1.6; 
  font-size: 15px;
  word-break: break-word;
}

/* 사진 섹션 */
.photo-section {
  align-self: flex-start;
  width: 100%;
}

.photo-scroll-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
  scrollbar-color: #d1d5db #f3f4f6;
}

.photo-scroll-container::-webkit-scrollbar {
  height: 6px;
}

.photo-scroll-container::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.photo-scroll-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.photo-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.photo-scroll-wrapper {
  display: flex;
  gap: 12px;
  padding: 4px 0;
  min-width: max-content;
}

.photo-image {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

/* 사진 컨트롤 영역 */
.photo-controls {
  position: absolute;
  top: 60.5%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  pointer-events: none;
  z-index: 20;
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* 리뷰 아이템에 호버 시 버튼 표시 */
.rv-item-vertical:hover .photo-controls {
  opacity: 1;
}

/* 사진 스크롤 버튼 */
.photo-scroll-btn {
  position: absolute;
  top: 0;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  pointer-events: auto;
  backdrop-filter: blur(4px);
}

.photo-scroll-btn:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.1);
}

.photo-scroll-btn i {
  font-size: 8px;
  color: white;
}

.photo-scroll-left {
  left: 1px;
}

.photo-scroll-right {
  right: 1px;
}

/* 로딩 상태 */
.rv-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 450px;
  color: #6b7280;
  font-size: 15px;
  font-weight: 500;
}

/* 빈 상태 */
.rv-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 450px;
  border-radius: 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  color: #6b7280;
  font-size: 15px;
  font-weight: 500;
}


/* 반응형 */
@media (max-width: 768px) {
  .rv-item-vertical {
    padding: 12px;
  }
  
  .rv-item-body {
    gap: 10px;
  }
  
  .content {
    font-size: 14px;
  }
  
  .photo-image {
    height: 100px !important;
    width: 130px !important;
  }
  
  .photo-scroll-wrapper {
    gap: 8px;
  }
  
  .photo-scroll-btn {
    width: 16px;
    height: 16px;
  }
  
  .photo-scroll-btn i {
    font-size: 6px;
  }
  
  .photo-scroll-left {
    left: -8px;
  }
  
  .photo-scroll-right {
    right: -8px;
  }
}
</style>
