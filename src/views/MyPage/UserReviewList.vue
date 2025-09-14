<template>
  <div class="user-review-list">
    <!-- 헤더 -->
    <div class="review-header">
      <h2 class="review-title">내 후기</h2>
      <p class="review-subtitle">내가 작성한 리뷰들을 확인할 수 있습니다.</p>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="loading" class="loading-container">
      <v-progress-circular indeterminate color="#111" size="40"></v-progress-circular>
      <p class="loading-text">리뷰를 불러오는 중...</p>
    </div>

    <!-- 리뷰 목록 -->
    <div v-else-if="!loading && items.length > 0" class="review-list">
      <div v-for="(r, idx) in items" :key="r.id || idx" class="review-card">
                    <!-- 호텔 헤더 -->
            <div class="hotel-header">
              <div class="hotel-title" @click="goToHotelDetail(r.hotelId)" style="cursor: pointer;">
                <span class="hotel-name">{{ r.hotelName }}</span>
                <span class="arrow">></span>
              </div>
            </div>

        <!-- 리뷰 헤더 -->
        <div class="review-head">
          <div class="review-stars">
            <v-icon
              v-for="n in 5"
              :key="n"
              size="18"
              :class="['star', n <= Math.round(r.rating) ? 'filled' : '']"
            >
              mdi-star
            </v-icon>
          </div>

          <div class="review-right">
            <span class="review-date">{{ formatDate(r.createdTime) }}</span>
                          <v-menu
                v-model="menuOpen[idx]"
                location="bottom end"
                offset="0 8"
              >
                <template v-slot:activator="{ props }">
                  <v-btn 
                    icon 
                    variant="text" 
                    density="comfortable"
                    v-bind="props"
                  >
                    <v-icon>mdi-dots-horizontal</v-icon>
                  </v-btn>
                </template>
              
              <v-list class="review-menu">
                <v-list-item
                  @click="editReview(r)"
                  class="menu-item edit"
                >
                  <template v-slot:prepend>
                    <v-icon size="18" color="#111">mdi-pencil</v-icon>
                  </template>
                  <v-list-item-title>리뷰수정</v-list-item-title>
                </v-list-item>
                
                <v-list-item
                  @click="deleteReview(r)"
                  class="menu-item delete"
                >
                  <template v-slot:prepend>
                    <v-icon size="18" color="#dc3545">mdi-delete</v-icon>
                  </template>
                  <v-list-item-title class="delete-text">리뷰삭제</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>

        <!-- 리뷰 메타 정보 -->
        <div class="review-meta" v-if="r.nickname || r.roomTypeLabel">
          <div class="review-meta-line">
            {{ r.nickname }}
            <template v-if="r.roomTypeLabel"> · {{ r.roomTypeLabel }}</template>
          </div>
        </div>

        <!-- 리뷰 내용 -->
        <div class="review-content">
          {{ r.contents }}
        </div>

        <!-- 리뷰 사진 갤러리 -->
        <div
          v-if="r.photos && r.photos.length"
          class="review-gallery"
          @mouseenter="galleryHover[idx] = true"
          @mouseleave="galleryHover[idx] = false"
        >
          <button
            v-show="galleryHover[idx] && (canLeft[idx] === true)"
            class="gallery-nav left"
            @click="scrollGallery(idx, -1)"
            aria-label="이전 이미지"
          >
            <v-icon size="22">mdi-chevron-left</v-icon>
          </button>

          <div
            class="gallery-track"
            :ref="el => (galleryRefs[idx] = el)"
          >
            <div v-for="(src, i2) in r.photos" :key="i2" class="gallery-thumb" @click="openImageModal(src)" style="cursor: pointer;">
              <v-img
                :src="src || undefined"
                width="150"
                height="110"
                cover
                class="rounded-xl"
                @error="onImgError(idx, i2)"
              />
            </div>
          </div>

          <button
            v-show="galleryHover[idx] && (canRight[idx] === true)"
            class="gallery-nav right"
            @click="scrollGallery(idx, 1)"
            aria-label="다음 이미지"
          >
            <v-icon size="22">mdi-chevron-right</v-icon>
          </button>
        </div>

        <!-- 숙소 답변 -->
        <div v-if="r.reply && r.reply.content" class="review-reply">
          <div class="reply-top">
            <span class="reply-title">숙소 답변</span>
            <span class="reply-date" v-if="r.reply.createdTime">{{ formatDate(r.reply.createdTime) }}</span>
          </div>

          <div :class="['reply-body', { expanded: expanded[idx] }]">
            {{ r.reply.content }}
          </div>

          <div class="reply-more" v-if="shouldShowMore(r.reply.content)">
            <v-btn size="small" variant="text" @click="toggleMore(idx)">
              더보기
              <v-icon size="16" class="ml-1">
                {{ expanded[idx] ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
              </v-icon>
            </v-btn>
          </div>
        </div>

        <v-divider class="review-divider" />
      </div>
    </div>

    <!-- 페이징 로딩 -->
    <div v-if="isFetching && items.length > 0" class="paging-loading">
      <v-progress-circular indeterminate color="#111" size="32"></v-progress-circular>
      <p class="paging-loading-text">더 많은 리뷰를 불러오는 중...</p>
    </div>

    <!-- 마지막 페이지 안내 -->
    <div v-if="isLastPage && items.length > 0" class="end-message">
      <p class="end-text">모든 리뷰를 불러왔습니다.</p>
    </div>

    <!-- 빈 상태 -->
    <div v-else-if="!loading && items.length === 0" class="empty-state">
      <v-icon size="64" color="#d1d5db">mdi-message-outline</v-icon>
      <h3 class="empty-title">아직 작성한 리뷰가 없습니다</h3>
      <p class="empty-subtitle">숙소를 이용하신 후 리뷰를 작성해보세요!</p>
    </div>

    <!-- 이미지 모달 -->
    <v-dialog v-model="imageModal.show" max-width="90vw" max-height="90vh" persistent>
      <v-card class="image-modal-card">
        <div class="image-modal-header">
          <v-btn
            icon
            variant="text"
            class="close-btn"
            @click="closeImageModal"
            aria-label="닫기"
          >
            <v-icon size="24">mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="image-modal-content">
          <v-img
            :src="imageModal.src"
            max-width="100%"
            max-height="80vh"
            contain
            class="modal-image"
          />
        </div>
      </v-card>
    </v-dialog>

    <!-- 수정 모달 -->
    <ReviewWriteModal
      v-model="editModal.show"
      :review="editModal.review"
      @complete="onEditComplete"
    />

    <!-- 스낵바 -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
      location="top"
    >
      {{ snackbar.message }}
      
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbar.show = false"
        >
          닫기
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import axios from "axios";
import { getResultData } from "@/utils/commonDataHandler";
import ReviewWriteModal from "@/views/Review/ReviewWriteModal.vue";

export default {
  name: "UserReviewList",
  components: {
    ReviewWriteModal,
  },
  props: {
    user: {
      type: Object,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      items: [],
      expanded: {},
      
      // 페이징 상태
      page: 0,
      isLastPage: false,
      isFetching: false,
      
      // 갤러리 상태
      galleryRefs: {},
      galleryHover: {},
      canLeft: {},
      canRight: {},

      // 메뉴 상태
      menuOpen: {},

      // 이미지 모달
      imageModal: {
        show: false,
        src: "",
      },

      // 수정 모달
      editModal: {
        show: false,
        review: null,
      },

      // 알림 메시지
      snackbar: {
        show: false,
        message: "",
        color: "success"
      },
    };
  },
  async created() {
    await this.loadUserReviews();
  },
  mounted() {
    // 무한 스크롤 이벤트 리스너 추가
    window.addEventListener('scroll', this.handleScroll);
  },
  beforeUnmount() {
    // 스크롤 이벤트 리스너 해제
    window.removeEventListener('scroll', this.handleScroll);
  },
  methods: {
    async loadUserReviews() {
      // 초기 로딩 시에만 호출
      this.page = 0;
      this.isLastPage = false;
      this.items = [];
      this.menuOpen = {};
      await this.loadMore();
    },

    async loadMore() {
      if (this.isLastPage || this.isFetching) return;
      this.isFetching = true;

      try {
        const params = { 
          page: this.page 
        };

        const res = await axios.get(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/review/user/list`, {
          params: params,
        });
        const data = getResultData(res);
        const newItems = Array.isArray(data?.content) ? data.content : [];

        if (newItems.length > 0) {
          const formattedItems = newItems.map(r => {
            const imgs = Array.isArray(r.reviewImageResDtoList)
              ? r.reviewImageResDtoList
                .map(x => (typeof x?.reviewImageUrl === 'string' ? x.reviewImageUrl.trim() : ''))
                .filter(u => /^https?:\/\/.+/i.test(u))
              : [];
            
            return {
              id: r.id,
              hotelId: r.hotelId,
              hotelName: r.hotelName,
              rating: Number(r.rating || 0),
              contents: r.contents || "",
              createdTime: r.createdTime || null,
              photos: imgs,
              nickname: r.userNickname || r.nickname || null,
              roomTypeLabel: r.roomType || null,
              reply: (r.replyContents ?? null)
                ? { content: r.replyContents, createdTime: r.replyCreatedTime || null }
                : null,
            };
          });

          this.items = [...this.items, ...formattedItems];
          
          // 새로 추가된 아이템들의 메뉴 상태 초기화
          const startIdx = this.items.length - formattedItems.length;
          formattedItems.forEach((_, index) => {
            const idx = startIdx + index;
            this.menuOpen[idx] = false;
          });
          
          this.page++;
        }
        
        if (newItems.length < 5) {
          this.isLastPage = true;
        }
      } catch (e) {
        console.error("사용자 리뷰 로드 실패:", e);
        this.isLastPage = true;
      } finally {
        this.isFetching = false;
      }
    },

    // 스크롤 이벤트 핸들러
    handleScroll() {
      const container = document.documentElement;
      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 200; // 200px 여유
      if (atBottom) {
        this.loadMore();
      }
    },

    // 날짜 포맷팅
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },

    // 더보기 토글
    toggleMore(idx) {
      this.expanded[idx] = !this.expanded[idx];
    },

    // 더보기 표시 여부
    shouldShowMore(content) {
      return content && content.length > 100;
    },

    // 이미지 모달
    openImageModal(src) {
      this.imageModal.src = src;
      this.imageModal.show = true;
    },

    closeImageModal() {
      this.imageModal.show = false;
      this.imageModal.src = "";
    },

    // 갤러리 스크롤
    scrollGallery(idx, direction) {
      const track = this.galleryRefs[idx];
      if (!track) return;

      const scrollAmount = 160; // 150px + gap
      const newScrollLeft = track.scrollLeft + (direction * scrollAmount);
      
      track.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });

      this.$nextTick(() => {
        this.updateGalleryState(idx);
      });
    },

    // 갤러리 상태 업데이트
    updateGalleryState(idx) {
      const track = this.galleryRefs[idx];
      if (!track) return;

      this.canLeft[idx] = track.scrollLeft > 0;
      this.canRight[idx] = track.scrollLeft < (track.scrollWidth - track.clientWidth);
    },

    // 이미지 에러 처리
    onImgError(idx, i2) {
      if (this.items[idx] && this.items[idx].photos) {
        this.items[idx].photos.splice(i2, 1);
      }
    },

    // 리뷰 수정
    editReview(review) {
      console.log("Editing review:", review);
      this.editModal.review = review;
      this.editModal.show = true;
    },

    // 리뷰 삭제
    async deleteReview(review) {
      try {
        // 공통 모달로 삭제 확인
        const confirmed = await this.showConfirmModal({
          title: '리뷰 삭제',
          message: '정말로 이 리뷰를 삭제하시겠습니까?',
          confirmColor: '#dc3545'
        });

        if (confirmed) {
          // 삭제 요청
          const response = await axios.delete(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/review/delete/${review.id}`);
          
                     if (response.status === 200) {
             // 삭제 성공 시 리스트에서 제거
             const index = this.items.findIndex(item => item.id === review.id);
             if (index !== -1) {
               this.items.splice(index, 1);
               // 메뉴 상태도 제거
               delete this.menuOpen[index];
             }
             
             // 성공 메시지 표시
             this.showSnackbar('리뷰가 성공적으로 삭제되었습니다.', 'success');
           }
        }
      } catch (error) {
        console.error('리뷰 삭제 실패:', error);
        // 에러 처리 (선택사항)
      }
    },

    // 공통 모달 표시
    showConfirmModal(options) {
      return new Promise((resolve) => {
        const event = new CustomEvent('show-confirm-modal', {
          detail: {
            ...options,
            resolve
          }
        });
        window.dispatchEvent(event);
      });
    },

    // 수정 모달 닫기
    closeEditModal() {
      this.editModal.show = false;
      this.editModal.review = null;
    },

    // 수정 완료 후 처리
    onEditComplete(updatedReview) {
      console.log('리뷰 수정 완료:', updatedReview);
      
      // 사진이 변경되었는지 확인
      const index = this.items.findIndex(item => item.id === updatedReview.id);
      if (index !== -1) {
        const originalPhotos = this.items[index].reviewImageResDtoList || [];
        const updatedPhotos = updatedReview.photos || [];
        
        // 사진 개수나 URL이 변경되었는지 확인
        const photosChanged = originalPhotos.length !== updatedPhotos.length || 
          originalPhotos.some((original, i) => 
            original.reviewImageUrl !== updatedPhotos[i]
          );
        
        if (photosChanged) {
          console.log('사진이 변경되었습니다. 전체 리뷰 목록을 다시 로드합니다.');
          // 사진이 변경된 경우 전체 리뷰 목록 다시 로드
          this.loadUserReviews();
          this.showSnackbar('리뷰가 성공적으로 수정되었습니다.', 'success');
        } else {
          console.log('사진은 변경되지 않았습니다. 텍스트만 업데이트합니다.');
          // 사진이 변경되지 않은 경우 텍스트만 업데이트
          const updatedItem = { ...this.items[index] };
          updatedItem.rating = updatedReview.rating;
          updatedItem.contents = updatedReview.contents;
          
          this.items[index] = updatedItem;
          
          // 갤러리 상태도 초기화
          this.galleryHover[index] = false;
          this.canLeft[index] = false;
          this.canRight[index] = false;
          this.expanded[index] = false;
          
          // 성공 메시지 표시
          this.showSnackbar('리뷰가 성공적으로 수정되었습니다.', 'success');
        }
      }
      
      this.closeEditModal();
    },

    // 스낵바 표시
    showSnackbar(message, color = 'success') {
      this.snackbar.message = message;
      this.snackbar.color = color;
      this.snackbar.show = true;
      
      // 3초 후 자동으로 숨기기
      setTimeout(() => {
        this.snackbar.show = false;
      }, 3000);
    },

    // 호텔 상세 페이지로 이동
    goToHotelDetail(hotelId) {
      console.log('호텔 상세 페이지로 이동:', hotelId);
      if (hotelId) {
        // 직접 URL로 이동
        window.location.href = `/hotel/detail/${hotelId}`;
      }
    }
  },
};
</script>

<style scoped>
.user-review-list {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

/* 헤더 */
.review-header {
  margin-bottom: 32px;
  text-align: center;
}

.review-title {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 8px 0;
}

.review-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

/* 로딩 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.loading-text {
  color: #6b7280;
  margin: 0;
}

/* 빈 상태 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-title {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
  margin: 16px 0 8px 0;
}

.empty-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

/* 리뷰 카드 */
.review-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.hotel-header {
  padding: 18px 20px 12px;
  background: #374151;
  margin: -20px -20px 20px -20px;
  border-radius: 12px 12px 0 0;
}

.hotel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: opacity 0.2s ease;
}

.hotel-title:hover {
  opacity: 0.8;
}

.hotel-name {
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.1px;
  font-size: 18px;
}

.arrow {
  color: #fff;
  font-size: 18px;
  font-weight: 800;
}

.review-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.review-stars {
  display: flex;
  align-items: center;
  gap: 1px;
}

.star {
  color: #d1d5db;
}

.star.filled {
  color: #FFD700;
}

.review-date {
  color: #6b7280;
  font-size: 14px;
}

/* 메타 정보 */
.review-meta {
  margin-bottom: 12px;
}

.review-meta-line {
  font-weight: 600;
  color: #111827;
}

/* 리뷰 내용 */
.review-content {
  color: #1f2937;
  line-height: 1.6;
  margin-bottom: 16px;
}

/* 갤러리 */
.review-gallery {
  position: relative;
  margin-bottom: 16px;
}

.gallery-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.gallery-track::-webkit-scrollbar {
  display: none;
}

.gallery-thumb {
  flex: 0 0 auto;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden;
}

.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 56px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: filter 0.15s ease;
  z-index: 1;
}

.gallery-nav.left {
  left: -6px;
}

.gallery-nav.right {
  right: -6px;
}

.gallery-nav:hover {
  filter: brightness(1.03);
}

.gallery-nav .v-icon {
  color: #111827;
}

/* 숙소 답변 */
.review-reply {
  background: #f6f7f9;
  border: 1px solid #eef0f3;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}

.reply-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.reply-title {
  font-weight: 700;
  color: #111827;
}

.reply-date {
  color: #6b7280;
  font-size: 14px;
}

.reply-body {
  color: #374151;
  line-height: 1.6;
  max-height: 3.2em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.reply-body.expanded {
  max-height: none;
  display: block;
}

.reply-more {
  text-align: right;
  margin-top: 8px;
}

/* 구분선 */
.review-divider {
  margin-top: 20px;
  border-color: #e5e7eb;
}

/* 이미지 모달 */
.image-modal-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background-color: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.image-modal-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
  z-index: 10;
}

.close-btn {
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

.image-modal-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  height: 80vh;
}

.modal-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 페이징 로딩 */
.paging-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  gap: 10px;
  background-color: #f9fafb;
  border-radius: 12px;
  margin-top: 20px;
  border: 1px solid #e5e7eb;
}

.paging-loading-text {
  color: #6b7280;
  font-size: 16px;
  margin: 0;
}

/* 마지막 페이지 안내 */
.end-message {
  text-align: center;
  padding: 30px 20px;
  background-color: #f9fafb;
  border-radius: 12px;
  margin-top: 20px;
  border: 1px solid #e5e7eb;
}

.end-text {
  color: #6b7280;
  font-size: 16px;
  margin: 0;
}

/* 메뉴 */
.review-menu {
  min-width: 150px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  background-color: #fff;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.menu-item:hover {
  background-color: #f0f2f5;
}

.menu-item .v-icon {
  color: #111827;
}

.delete-text {
  color: #dc3545;
}
</style>
