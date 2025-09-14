<template>
  <div class="rv-page-background">
    <v-container class="rv-container">
      <div class="rating-hero" v-if="loadedSummary">
        <div class="rating-sub">숙소 평점 ({{ total }})</div>
        <div class="rating-main">
          <i class="fas fa-star rating-star"></i>
          <span class="rating-number">{{ average.toFixed(1) }}</span>
        </div>
      </div>

      <div
        v-if="!loading && previewPhotos.length"
        class="rv-photo-preview"
        @mouseenter="stripHover = true"
        @mouseleave="stripHover = false"
      >
        <div class="rv-photo-head">
          <h3 class="rv-photo-title">숙소 후기사진</h3>
          <button
            class="rv-photo-more"
            @click="openGalleryModal()"
          >
            전체보기 ({{ previewTotal }})
            <v-icon size="18">mdi-chevron-right</v-icon>
          </button>
        </div>

        <button
          v-show="stripHover && stripCanLeft && previewPhotos.length > 0"
          class="rv-gal-nav left"
          @click="scrollStrip(-1)"
          aria-label="이전 사진"
        >
          <v-icon size="22">mdi-chevron-left</v-icon>
        </button>

        <div ref="strip" class="rv-photo-track">
          <div
            v-for="(src, i) in previewPhotos"
            :key="i"
            class="rv-photo-thumb"
            @click="openImageModal(src)"
            style="cursor: pointer;"
          >
            <v-img
              :src="src || undefined"
              width="140"
              height="105"
              cover
              rounded="xl"
              @error="onStripImgError(i)"
            />
          </div>
        </div>

        <button
          v-show="stripHover && stripCanRight && previewPhotos.length > 0"
          class="rv-gal-nav right"
          @click="scrollStrip(1)"
          aria-label="다음 사진"
        >
          <v-icon size="22">mdi-chevron-right</v-icon>
        </button>
      </div>

      <!-- 후기 타이틀 -->
      <div class="review-title-section" v-if="!loading && items.length > 0">
        <h3 class="review-title">후기 ({{ total }})</h3>
      </div>

      <!-- 리뷰 필터링 -->
      <div class="review-filter" v-if="!loading && items.length > 0">
        <div class="filter-left">
          <v-checkbox
            v-model="showPhotoReviewsOnly"
            label="사진후기만 보기"
            color="#111"
            hide-details
            class="photo-filter-checkbox"
          />
        </div>
        
        <div class="filter-right">
          <v-select
            v-model="sortOrder"
            :items="sortOptions"
            item-title="text"
            item-value="value"
            variant="text"
            density="compact"
            hide-details
            class="sort-select"
            @update:model-value="onSortChange"
          />
        </div>
      </div>

      <!-- 구분선 -->
      <hr class="review-divider" v-if="!loading && items.length > 0" />

      <div v-if="loading" class="rv-loading">
        <v-skeleton-loader
          v-if="loading"
          type="list-item-two-line, image, list-item-two-line, image, list-item-two-line"
          class="mb-6"
        />
      </div>
      <div v-else>
        <div v-if="filteredReviews.length === 0" class="rv-empty">
          {{ showPhotoReviewsOnly ? '사진이 있는 리뷰가 없습니다.' : '리뷰가 없습니다.' }}
        </div>

        <div v-for="(r, idx) in filteredReviews" :key="r.id || idx" class="rv-card">
          <div class="rv-head">
            <div class="rv-stars">
              <i
                v-for="n in 5"
                :key="n"
                class="fas fa-star star"
                :class="{ 'filled': n <= Math.round(r.rating) }"
              ></i>
              <span v-if="r.isPicked" class="picked-chip">숙소 선정</span>
            </div>

            <div class="rv-right">
              <span class="rv-date">{{ formatDate(r.createdTime) }}</span>
              <v-menu v-model="menuOpen[idx]" location="bottom end">
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
                    class="menu-item"
                    @click="reportReview(r)"
                  >
                    <v-icon size="18" class="mr-2">mdi-flag</v-icon>
                    <span>후기 신고</span>
                  </v-list-item>
                  
                  <!-- 답글이 없는 경우: 답글 작성 -->
                  <v-list-item 
                    v-if="currentUser && currentUser.role === 'HOST' && (!r.reply || !r.reply.content)"
                    class="menu-item"
                    @click="writeReply(r)"
                  >
                    <v-icon size="18" class="mr-2">mdi-reply</v-icon>
                    <span>답글 작성</span>
                  </v-list-item>
                  
                  <!-- 답글이 있는 경우: 답글 수정/삭제 -->
                  <template v-if="currentUser && currentUser.role === 'HOST' && r.reply && r.reply.content">
                    <v-list-item 
                      class="menu-item"
                      @click="editReply(r)"
                    >
                      <v-icon size="18" class="mr-2">mdi-pencil</v-icon>
                      <span>답글 수정</span>
                    </v-list-item>
                    
                    <v-list-item 
                      class="menu-item"
                      @click="deleteReply(r)"
                    >
                      <v-icon size="18" class="mr-2">mdi-delete</v-icon>
                      <span class="delete-text">답글 삭제</span>
                    </v-list-item>
                  </template>
                </v-list>
              </v-menu>
            </div>
          </div>

          <div class="rv-meta" v-if="r.nickname || r.roomTypeLabel">
            <div v-if="r.nickname" class="rv-meta-line">
              {{ maskName(r.nickname) }}
              <template v-if="r.roomTypeLabel"> · {{ r.roomTypeLabel }}</template>
            </div>
          </div>

          <div class="rv-content">
            {{ r.contents }}
          </div>

          <div
            v-if="r.photos && r.photos.length"
            class="rv-gallery"
            @mouseenter="galleryHover[idx] = true"
            @mouseleave="galleryHover[idx] = false"
          >
            <button
              v-show="galleryHover[idx] && (canLeft[idx] === true)"
              class="rv-gal-nav rv-gallery-nav left"
              @click="scrollGallery(idx, -1)"
              aria-label="이전 이미지"
            >
              <v-icon size="22">mdi-chevron-left</v-icon>
            </button>

            <div
              class="rv-gallery-track"
              :ref="el => (galleryRefs[idx] = el)"
            >
              <div v-for="(src, i2) in r.photos" :key="i2" class="thumb" @click="openImageModal(src)" style="cursor: pointer;">
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
              class="rv-gal-nav rv-gallery-nav right"
              @click="scrollGallery(idx, 1)"
              aria-label="다음 이미지"
            >
              <v-icon size="22">mdi-chevron-right</v-icon>
            </button>
          </div>

          <div v-if="r.reply && r.reply.content" class="rv-reply">
            <div class="rv-reply-top">
              <span class="rv-reply-title">숙소 답변</span>
              <span class="rv-reply-date" v-if="r.reply.createdTime">{{ formatDate(r.reply.createdTime) }}</span>
            </div>

            <div :class="['rv-reply-body', { expanded: expanded[idx] }]">
              {{ r.reply.content }}
            </div>

            <div class="rv-reply-more" v-if="shouldShowMore(r.reply.content)">
              <v-btn size="small" variant="text" @click="toggleMore(idx)">
                더보기
                <v-icon size="16" class="ml-1">
                  {{ expanded[idx] ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                </v-icon>
              </v-btn>
            </div>
          </div>

          <v-divider class="my-6" />
        </div>
        
        <div v-if="isFetching" class="py-4 text-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

      </div>
    </v-container>
    
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

    <!-- 전체보기 모달 -->
    <v-dialog v-model="galleryModal.show" max-width="95vw" max-height="95vh" persistent>
      <v-card class="gallery-modal-card">
        <div class="gallery-modal-header">
          <h2 class="gallery-modal-title">숙소 후기사진 전체보기</h2>
          <v-btn
            icon
            variant="text"
            class="close-btn"
            @click="closeGalleryModal"
            aria-label="닫기"
          >
            <v-icon size="24">mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="gallery-modal-content">
          <!-- 격자 보기 모드 -->
          <div v-if="!galleryModal.showSingleImage" class="gallery-grid">
            <div
              v-for="(src, index) in galleryModal.photos"
              :key="index"
              class="gallery-item"
              @click="showSingleImageInGallery(src)"
              style="cursor: pointer;"
            >
              <v-img
                :src="src || undefined"
                width="200"
                height="150"
                cover
                class="gallery-image"
                @error="onGalleryImgError(index)"
              />
            </div>
          </div>
          
          <!-- 단일 사진 보기 모드 -->
          <div v-else class="single-image-view">
            <div class="single-image-container">
              <v-img
                :src="galleryModal.singleImageSrc"
                max-width="100%"
                max-height="100%"
                contain
                class="single-image"
              />
            </div>
            <v-btn
              icon
              variant="text"
              class="back-btn"
              @click="backToGalleryGrid"
              aria-label="뒤로가기"
            >
              <v-icon size="24">mdi-arrow-left</v-icon>
            </v-btn>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <!-- 답글 작성 모달 -->
    <ReplyWriteModal
      v-model="replyWriteModal.show"
      :review="{ id: replyWriteModal.reviewId }"
      @submit="handleReplySubmitted"
    />

    <!-- 답글 수정 모달 -->
    <ReplyWriteModal
      v-model="replyEditModal.show"
      :review="{ id: replyEditModal.reviewId }"
      :mode="'edit'"
      :reply-data="replyEditModal.replyData"
      @submit="handleReplySubmitted"
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
import { jwtDecode } from "jwt-decode";
import ReplyWriteModal from "@/views/Review/ReplyWriteModal.vue";

export default {
  name: "ReviewHotelList",
  components: {
    ReplyWriteModal,
  },
  props: {
    hotelId: {
      type: [Number, String],
      default: 1
    }
  },
  data() {
    return {
      loading: false,
      loadedSummary: false,
      average: 0,
      total: 0,
      items: [],
      expanded: {},

      // ✅ 무한 스크롤 관련 상태
      page: 0,
      isLastPage: false,
      isFetching: false,

      // 리뷰 카드별 갤러리 상태
      galleryRefs: {},   // idx -> HTMLElement
      galleryHover: {},  // idx -> boolean
      canLeft: {},       // idx -> boolean
      canRight: {},      // idx -> boolean

      // ✅ 후기사진 프리뷰 상태
      previewPhotos: [],   // 한 줄 스트립에 뿌릴 썸네일 목록 (30개)
      previewTotal: 0,     // 전체 사진 수(리뷰들의 합계)
      allReviewImages: [], // 전체 사진 목록 (전체보기용)
      stripHover: false,
      stripCanLeft: false,
      stripCanRight: false,

      // 리뷰 필터링 상태
      showPhotoReviewsOnly: false,
      sortOrder: 'latest', // 최신순, 별점 많은 순, 별점 적은 순
      sortOptions: [
        { text: '최신순', value: 'latest' },
        { text: '별점 많은 순', value: 'highestRating' },
        { text: '별점 적은 순', value: 'lowestRating' },
      ],

      // 이미지 모달 상태
      imageModal: {
        show: false,
        src: "",
      },

      // 전체보기 모달 상태
      galleryModal: {
        show: false,
        photos: [], // 전체 사진 목록
        showSingleImage: false, // 단일 사진 보기 모드 여부
        singleImageSrc: "", // 현재 보여줄 단일 사진 URL
      },

      // 메뉴 상태
      menuOpen: {},

      // 사용자 정보
      currentUser: null,

      // 답글 작성 모달 상태
      replyWriteModal: {
        show: false,
        reviewId: null,
      },

      // 답글 수정 모달 상태
      replyEditModal: {
        show: false,
        reviewId: null,
        replyData: null,
      },

      // 스낵바 상태
      snackbar: {
        show: false,
        message: "",
        color: "success"
      },
    };
  },
  async created() {
    console.log('받은 hotelId:', this.hotelId);
    console.log('hotelId 타입:', typeof this.hotelId);

    // hotelId가 유효하지 않으면 로딩 상태 유지
    if (!this.hotelId || this.hotelId === 0) {
      console.log('hotelId가 유효하지 않음, 로딩 상태 유지');
      this.loading = true;
      return;
    }

    // 사용자 정보 가져오기
    this.loadCurrentUser();

    // 요약
    try {
      const sumRes = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/review/ratings/${this.hotelId}`);
      const sum = getResultData(sumRes);
      this.average = Number(sum?.averageRating ?? 0);
      this.total = Number(sum?.ratingCount ?? 0);
    } catch (e) {
      console.error(e);
      this.average = 0; this.total = 0;
    } finally {
      this.loadedSummary = true;
    }

    // 초기 목록 로딩
    this.loading = true;
    await this.loadMore();
    this.loading = false;
    
    // ✅ 초기 로딩 후 전체 사진 가져오기
    this.$nextTick(async () => {
      await this.fetchAllReviewImages();
      this.updateStripState();
    });
  },
  mounted() {
    window.addEventListener('resize', this.updateAllGalleries);
    window.addEventListener('resize', this.updateStripState);
    // ✅ 무한 스크롤 이벤트 리스너 추가
    window.addEventListener('scroll', this.handleScroll);
    
    // ✅ 초기 스트립 상태 업데이트
    this.$nextTick(async () => {
      await this.fetchAllReviewImages();
      this.updateStripState();
    });
  },
  beforeUnmount() {
    // 스크롤 리스너 해제
    Object.values(this.galleryRefs).forEach(el => {
      el?.removeEventListener?.('scroll', this.onGalleryScroll);
    });
    window.removeEventListener('resize', this.updateAllGalleries);
    window.removeEventListener('resize', this.updateStripState);
    // ✅ 무한 스크롤 이벤트 리스너 해제
    window.removeEventListener('scroll', this.handleScroll);
  },
  computed: {
    // 필터링된 리뷰 목록
    filteredReviews() {
      if (!this.showPhotoReviewsOnly) {
        return this.items;
      }
      return this.items.filter(review => 
        review.photos && review.photos.length > 0
      );
    }
  },
  watch: {
    // hotelId가 변경될 때 리뷰 다시 로드
    async hotelId(newHotelId, oldHotelId) {
      console.log('hotelId 변경됨:', { old: oldHotelId, new: newHotelId });
      
      if (newHotelId && newHotelId !== oldHotelId && newHotelId !== 0) {
        console.log('새로운 hotelId로 리뷰 로드 시작');
        
        // 상태 초기화
        this.loading = true;
        this.loadedSummary = false;
        this.items = [];
        this.page = 0;
        this.isLastPage = false;
        this.isFetching = false;
        this.average = 0;
        this.total = 0;
        
        try {
          // 요약 정보 다시 로드
          const sumRes = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/review/ratings/${newHotelId}`);
          const sum = getResultData(sumRes);
          this.average = Number(sum?.averageRating ?? 0);
          this.total = Number(sum?.ratingCount ?? 0);
          this.loadedSummary = true;
          
          // 리뷰 목록 다시 로드
          await this.loadMore();
          
          // 전체 사진 다시 가져오기
          this.$nextTick(async () => {
            await this.fetchAllReviewImages();
            this.updateStripState();
          });
          
        } catch (error) {
          console.error('hotelId 변경 시 리뷰 로드 실패:', error);
        } finally {
          this.loading = false;
        }
      }
    },
    
    // 필터링 상태가 변경될 때 스크롤 상태 초기화
    showPhotoReviewsOnly() {
      this.isFetching = false;
      this.hasMore = true;
      // 갤러리 상태 초기화
      this.galleryHover = {};
      this.canLeft = {};
      this.canRight = {};
      this.expanded = {};
    }
  },
  methods: {
    /* === 무한 스크롤 로직 === */
    async loadMore() {
      if (this.isLastPage || this.isFetching) return;
      this.isFetching = true;

      try {
        // 정렬 파라미터 구성
        const params = { 
          size: 10, 
          page: this.page 
        };
        
        // 별점 정렬 시 sort 파라미터 추가
        if (this.sortOrder === 'highestRating') {
          params.sort = 'rating,desc';
        } else if (this.sortOrder === 'lowestRating') {
          params.sort = 'rating,asc';
        }
        // 최신순(latest)은 기본값이므로 파라미터 추가하지 않음

        const listRes = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/review/hotel/${this.hotelId}/list`, {
          params: params,
        });
        const result = getResultData(listRes);
        const newItems = Array.isArray(result?.content) ? result.content : [];

        if (newItems.length > 0) {
          const formattedItems = newItems.map(r => {
            const imgs = Array.isArray(r.reviewImageResDtoList)
              ? r.reviewImageResDtoList
                .map(x => (typeof x?.reviewImageUrl === 'string' ? x.reviewImageUrl.trim() : ''))
                .filter(u => /^https?:\/\/.+/i.test(u))
              : [];
            return {
              id: r.id, // 고유 id가 있으면 사용, 없으면 Vue key 에러 방지용 임시 key로 사용
              rating: Number(r.rating || 0),
              contents: r.contents || "",
              createdTime: r.createdTime || null,
              photos: imgs,
              nickname: r.userNickname || r.nickname || null,
              roomTypeLabel: r.roomType || null,
              isPicked: !!r.isPicked,
              reply: (r.replyContents ?? null)
                ? { 
                    id: r.replyId, // replyId 추가
                    content: r.replyContents, 
                    createdTime: r.replyCreatedTime || null 
                  }
                : null,
            };
          });

          this.items = [...this.items, ...formattedItems];
          this.page++;
          
          // 새로 로드된 아이템들의 메뉴 상태 초기화
          formattedItems.forEach((_, index) => {
            const globalIndex = this.items.length - formattedItems.length + index;
            this.menuOpen[globalIndex] = false;
          });
        }
        
        if (newItems.length < 10) {
          this.isLastPage = true;
        }

        // DOM 갱신 후: 갤러리 초기화 + 전체 사진 가져오기
        this.$nextTick(async () => {
          this.initGalleries();
          await this.fetchAllReviewImages();
        });
      } catch (e) {
        console.error(e);
        // 오류 발생 시에도 로딩 상태 해제
        this.isLastPage = true;
      } finally {
        this.isFetching = false;
      }
    },
    handleScroll() {
      const container = document.documentElement;
      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 200; // 200px 여유
      if (atBottom) {
        this.loadMore();
      }
    },
    /* === 프리뷰 스트립 로직 === */
    // 전체 사진 가져오기
    async fetchAllReviewImages() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/review/images/${this.hotelId}`);
        if (response.status === 200) {
          const result = response.data?.result || [];
          const imageUrls = result.map(item => item.reviewImageUrl);
          
          // 사진 정렬을 반대로 변경 (최신 → 오래된 순서)
          const reversedImageUrls = imageUrls.reverse();
          
          this.previewTotal = reversedImageUrls.length;
          this.previewPhotos = reversedImageUrls.slice(0, 30); // 미리보기용 30개
          this.allReviewImages = reversedImageUrls; // 전체 사진 저장 (전체보기용)
          
          console.log('fetchAllReviewImages:', {
            totalImages: imageUrls.length,
            previewPhotos: this.previewPhotos.length,
            allImages: this.allReviewImages.length
          });
          
          this.$nextTick(() => {
            this.updateStripState();
          });
        }
      } catch (error) {
        console.error('전체 사진 가져오기 실패:', error);
        // 실패 시 기존 방식으로 fallback
        this.buildPhotoPreview();
      }
    },

    buildPhotoPreview() {
      // 모든 리뷰 사진을 모아 한 줄 스트립으로 구성 (fallback용)
      const all = this.items.flatMap(r => Array.isArray(r.photos) ? r.photos : []);
      this.previewTotal = all.length;
      this.previewPhotos = all.slice(0, 30); // 미리보기용 30개
      this.allReviewImages = all; // 전체 사진 저장 (전체보기용)
      
      console.log('buildPhotoPreview:', {
        totalPhotos: all.length,
        previewPhotos: this.previewPhotos.length,
        allImages: this.allReviewImages.length,
        items: this.items.length
      });
      
      this.$nextTick(() => {
        this.updateStripState();
      });
    },
    onStripImgError(i) {
      if (!Array.isArray(this.previewPhotos)) return;
      this.previewPhotos.splice(i, 1);
      this.$nextTick(() => {
        this.updateStripState();
      });
    },
    getStripStep() {
      const track = this.$refs.strip;
      if (!track) return 160; // 140 + gap 대략
      const first = track.querySelector('.rv-photo-thumb');
      if (!first) return 160;
      const rect = first.getBoundingClientRect();
      const styles = getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || 0);
      return Math.round(rect.width + gap);
    },
    scrollStrip(dir) {
      const track = this.$refs.strip;
      if (!track) return;
      const step = this.getStripStep() * dir;
      track.scrollBy({ left: step, behavior: 'smooth' });
      setTimeout(this.updateStripState, 260);
    },
    updateStripState() {
      const el = this.$refs.strip;
      if (!el) {
        console.log('updateStripState: strip ref not found');
        return;
      }
      
      this.stripCanLeft = el.scrollLeft > 2;
      this.stripCanRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
      
      console.log('updateStripState:', {
        scrollLeft: el.scrollLeft,
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
        stripCanLeft: this.stripCanLeft,
        stripCanRight: this.stripCanRight,
        previewPhotosLength: this.previewPhotos.length
      });
    },

    /* === 리뷰 카드 내부 이미지 에러 처리 === */
    onImgError(cardIdx, photoIdx) {
      const list = this.items[cardIdx]?.photos;
      if (!Array.isArray(list)) return;
      list.splice(photoIdx, 1);
              this.$nextTick(async () => {
          if (list.length === 0) this.galleryHover[cardIdx] = false;
          this.updateAllGalleries();
          // 프리뷰 스트립도 전체 합계가 바뀔 수 있으니 갱신
          await this.fetchAllReviewImages();
        });
    },
    onGalleryImgError(index) {
      if (!Array.isArray(this.galleryModal.photos)) return;
      this.galleryModal.photos.splice(index, 1);
    },

    /* === 유틸 === */
    formatDate(iso) {
      if (!iso) return "";
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}.${m}.${day}`;
    },
    maskName(name) {
      if (!name) return "";
      if (name.length <= 2) return name[0] + "*";
      return name.slice(0, 2) + "*".repeat(Math.min(7, name.length - 2));
    },
    shouldShowMore(text) { return (text || "").length > 90; },
    toggleMore(idx) { this.expanded[idx] = !this.expanded[idx]; },

    /* === 갤러리 네비 === */
    initGalleries() {
      Object.values(this.galleryRefs).forEach(el => {
        el?.removeEventListener?.('scroll', this.onGalleryScroll);
      });
      Object.values(this.galleryRefs).forEach(el => {
        if (!el) return;
        el.addEventListener('scroll', this.onGalleryScroll, { passive: true });
      });
      this.updateAllGalleries();
    },
    onGalleryScroll() { this.updateAllGalleries(); },
    updateAllGalleries() {
      Object.entries(this.galleryRefs).forEach(([idx, el]) => {
        if (!el) return;
        const left = el.scrollLeft;
        const max = el.scrollWidth - el.clientWidth;
        this.canLeft[idx] = left > 2;
        this.canRight[idx] = left < (max - 2);
      });
    },
    getThumbStep(el) {
      if (!el) return 170;
      const first = el.querySelector('.thumb');
      if (!first) return 170;
      const rect = first.getBoundingClientRect();
      const styles = getComputedStyle(el);
      const gap = parseFloat(styles.columnGap || styles.gap || 0);
      return Math.round(rect.width + gap);
    },
    scrollGallery(idx, dir) {
      const el = this.galleryRefs[idx];
      if (!el) return;
      const step = this.getThumbStep(el) * dir;
      el.scrollBy({ left: step, behavior: 'smooth' });
      setTimeout(this.updateAllGalleries, 260);
    },

    /* === 메뉴 관련 메서드 === */
    // 현재 사용자 정보 로드
    loadCurrentUser() {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
          const payload = jwtDecode(accessToken);
          this.currentUser = {
            id: payload.sub,
            role: payload.role,
            email: payload.email
          };
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
        this.currentUser = null;
      }
    },

    // 후기 신고
    reportReview(review) {
      console.log('후기 신고:', review);
      // TODO: 후기 신고 기능 구현
      this.menuOpen[this.items.findIndex(item => item.id === review.id)] = false;
    },

    // 답글 작성
    writeReply(review) {
      console.log('답글 작성:', review);
      
      // 기존 답글이 있는지 확인
      if (review.reply && review.reply.content) {
        // 답글이 이미 존재하는 경우
        this.showSnackbar('답글은 1개만 작성 가능합니다.', 'error');
        this.menuOpen[this.items.findIndex(item => item.id === review.id)] = false;
        return;
      }
      
      // 답글이 없는 경우에만 모달 열기
      this.replyWriteModal.reviewId = review.id;
      this.replyWriteModal.show = true;
      this.menuOpen[this.items.findIndex(item => item.id === review.id)] = false;
    },

    // 답글 수정
    editReply(review) {
      console.log('답글 수정:', review);
      console.log('답글 데이터:', review.reply);
      // 답글 데이터를 모달에 전달
      this.replyEditModal.reviewId = review.id;
      this.replyEditModal.replyData = review.reply;
      this.replyEditModal.show = true;
      this.menuOpen[this.items.findIndex(item => item.id === review.id)] = false;
    },

    // 답글 삭제
    async deleteReply(review) {
      console.log('답글 삭제:', review);
      
      try {
        // 삭제 확인을 위한 공통 모달 호출
        const confirmed = await this.showConfirmModal({
          title: '답글 삭제',
          message: '정말로 이 답글을 삭제하시겠습니까?',
          confirmColor: '#dc3545'
        });

        if (confirmed) {
          // 답글 삭제 API 호출
          const response = await axios.delete(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/reply/delete/${review.reply.id}`);
          
          if (response.status === 200) {
            console.log('답글이 성공적으로 삭제되었습니다.');
            
            // 성공 메시지 표시
            this.showSnackbar('답글이 성공적으로 삭제되었습니다.', 'success');
            
            // 목록 다시 로드하여 답변 포함 여부 확인
            this.page = 0;
            this.isLastPage = false;
            this.isFetching = false;
            this.items = [];
            await this.loadMore();
          }
        }
      } catch (error) {
        console.error('답글 삭제 실패:', error);
        this.showSnackbar('답글 삭제에 실패했습니다.', 'error');
      }
      
      this.menuOpen[this.items.findIndex(item => item.id === review.id)] = false;
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

    /* === 이미지 모달 로직 === */
    openImageModal(src) {
      this.imageModal.src = src;
      this.imageModal.show = true;
    },
    closeImageModal() {
      this.imageModal.show = false;
      this.imageModal.src = "";
    },

         /* === 전체보기 모달 로직 === */
     openGalleryModal() {
       // 전체보기 시에는 모든 사진을 표시
       this.galleryModal.photos = this.allReviewImages;
       this.galleryModal.show = true;
       this.galleryModal.showSingleImage = false;
       this.galleryModal.singleImageSrc = "";
     },
     closeGalleryModal() {
       this.galleryModal.show = false;
       this.galleryModal.photos = [];
       this.galleryModal.showSingleImage = false;
       this.galleryModal.singleImageSrc = "";
     },
     showSingleImageInGallery(src) {
       this.galleryModal.singleImageSrc = src;
       this.galleryModal.showSingleImage = true;
     },
     backToGalleryGrid() {
       this.galleryModal.showSingleImage = false;
       this.galleryModal.singleImageSrc = "";
     },

        /* === 답글 작성/수정 모달 로직 === */
    async handleReplySubmitted(data) {
      console.log('답글 제출됨:', data);
      
      try {
        let response;
        
        if (data.mode === 'edit') {
          // 답글 수정 API 호출
          response = await axios.put(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/reply/update`, {
            replyId: data.replyId,
            contents: data.content
          });
        } else {
          // 답글 생성 API 호출
          response = await axios.post(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/reply/create`, {
            reviewId: data.reviewId,
            contents: data.content
          });
        }
        
        if (response.status === 200 || response.status === 201) {
          const successMessage = data.mode === 'edit' 
            ? '답글이 성공적으로 수정되었습니다.' 
            : '답글이 성공적으로 작성되었습니다.';
          
          console.log(successMessage);
          
          // 성공 시 모달 닫기
          if (data.mode === 'edit') {
            this.replyEditModal.show = false;
            this.replyEditModal.reviewId = null;
            this.replyEditModal.replyData = null;
          } else {
            this.replyWriteModal.show = false;
            this.replyWriteModal.reviewId = null;
          }
          
          // 성공 메시지 표시
          this.showSnackbar(successMessage, 'success');
          
          // 목록 다시 로드하여 답변 포함 여부 확인
          this.page = 0;
          this.isLastPage = false;
          this.isFetching = false;
          this.items = [];
          await this.loadMore();
        }
      } catch (error) {
        console.error('답글 처리 실패:', error);
        
        // 에러 발생 시에도 모달은 닫기
        if (data.mode === 'edit') {
          this.replyEditModal.show = false;
          this.replyEditModal.reviewId = null;
          this.replyEditModal.replyData = null;
        } else {
          this.replyWriteModal.show = false;
          this.replyWriteModal.reviewId = null;
        }
        
        // 에러 메시지 표시
        const errorMessage = data.mode === 'edit' 
          ? '답글 수정에 실패했습니다.' 
          : '답글 작성에 실패했습니다.';
        this.showSnackbar(errorMessage, 'error');
      }
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

    /* === 정렬 로직 === */
    onSortChange() {
      this.page = 0; // 정렬 변경 시 페이지 초기화
      this.isLastPage = false;
      this.isFetching = false;
      this.items = []; // 기존 데이터 초기화
      this.loadMore();
    }
  },
};
</script>

<style scoped>
.rv-page-background {
  background: #fafbfc;
  min-height: 100vh;
}

.rv-container { max-width: 900px; }

/* 상단 요약 */
.rating-hero { text-align:center; padding: 6px 0 18px; }
.rating-sub { color:#6b7280; font-size:15px; }
.rating-main { display:inline-flex; align-items:center; gap:6px; margin-top:4px; }
.rating-star { 
  color: #facc15; 
  font-size: 40px;
}
.rating-number { font-size:36px; font-weight:800; }

/* ✅ 후기사진 프리뷰 */
.rv-photo-preview { position: relative; margin: 8px 0 14px; }
.rv-photo-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.rv-photo-title { margin:0; font-size:22px; font-weight:800; color:#111827; }
.rv-photo-more { 
  display:inline-flex; 
  align-items:center; 
  gap:4px; 
  color:#111827; 
  font-weight:700; 
  text-decoration:none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font-size: inherit;
}
.rv-photo-track{
  display:grid; grid-auto-flow: column; grid-auto-columns: max-content;
  gap: 12px; overflow-x: auto; padding: 2px 6px 8px;
  scrollbar-width: none; -ms-overflow-style: none;
  height: 121px; /* 사진 높이(105px) + 상하 패딩(16px) */
  align-items: center; /* 세로 중앙 정렬 */
}
.rv-photo-track::-webkit-scrollbar { display:none; }
.rv-photo-thumb { 
  flex:0 0 auto; 
  background-color: #f8f9fa; /* 사진 배경색 추가 */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden; /* 사진이 카드 밖으로 넘치지 않도록 */
}

/* 카드 */
.rv-card { padding: 4px 4px 0; }
.rv-empty {
  text-align:center; color:#6b7280; background:#f8fafc; border:1px dashed #e5e7eb;
  border-radius: 12px; padding: 24px; margin-top: 8px;
}

/* 헤더 */
.rv-head { display:flex; align-items:center; justify-content:space-between; }
.rv-stars { display:flex; align-items:center; gap:2px; }
.star { 
  color: #d1d5db; 
  font-size: 16px;
}
.star.filled { 
  color: #facc15; 
}
.picked-chip {
  margin-left:8px; background:#eef0f3; color:#4b5563;
  padding:2px 8px; border-radius:9999px; font-size:12px; font-weight:700;
}
.rv-right { display:flex; align-items:center; gap:4px; }
.rv-date { color:#6b7280; font-size:14px; }

/* 메타 */
.rv-meta { margin-top:8px; }
.rv-meta-line { font-weight:600; color:#111827; }
.rv-meta-line.sub { color:#6b7280; margin-top:2px; }

/* 본문 */
.rv-content { margin-top:10px; color:#1f2937; line-height:1.55; }

/* === 갤러리 (hover 네비) === */
.rv-gallery { position: relative; margin-top:12px; }
.rv-gallery-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: max-content;   /* 썸네일 폭만큼 */
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-width: none; -ms-overflow-style: none;
}
.rv-gallery-track::-webkit-scrollbar { display:none; }
.thumb { 
  flex:0 0 auto; 
  background-color: #f8f9fa; /* 사진 배경색 추가 */
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden; /* 사진이 카드 밖으로 넘치지 않도록 */
}

.rv-gal-nav {
  position: absolute; 
  top: 72.5px; /* 숙소 후기사진 버튼 위치 (건드리지 않음) */
  transform: none; /* transform 제거하고 절대값 사용 */
  width: 34px; height: 56px; border-radius: 10px;
  border: 1px solid #e5e7eb; background: #fff;
  display:flex; align-items:center; justify-content:center;
  box-shadow: 0 6px 16px rgba(0,0,0,.08);
  cursor: pointer; transition: filter .15s ease; z-index: 1;
}
.rv-gal-nav.left { left: -6px; }
.rv-gal-nav.right { right: -6px; }
.rv-gal-nav:hover { filter: brightness(1.03); }
.rv-gal-nav .v-icon { color:#111827; }

/* 실제 리뷰들의 사진 갤러리용 버튼 위치 조정 */
.rv-gallery-nav {
  top: 25.5px; /* 사진 높이(110px)의 절반 + 약간의 조정 */
}

/* 숙소 답변 박스 */
.rv-reply {
  margin-top:12px; background:#f6f7f9; border:1px solid #eef0f3;
  border-radius:12px; padding:12px;
}
.rv-reply-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
.rv-reply-title { font-weight:700; color:#111827; }
.rv-reply-date { color:#6b7280; font-size:14px; }
.rv-reply-body {
  color:#374151; line-height:1.55;
  max-height: 3.2em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.rv-reply-body.expanded { max-height: none; display: block; }
.rv-reply-more { text-align:right; margin-top:2px; }

/* 이미지 모달 스타일 */
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
  height: 80vh; /* 모달 높이의 80% */
}

.modal-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 전체보기 모달 스타일 */
.gallery-modal-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background-color: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.gallery-modal-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
}

.gallery-modal-title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #111827;
}

.back-btn {
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

.back-btn:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

.gallery-modal-content {
  padding: 20px;
  height: 80vh; /* 모달 높이의 80% */
  display: flex;
  justify-content: center;
  align-items: flex-start; /* 위쪽 정렬로 변경 */
  overflow-y: auto; /* 세로 스크롤 가능 */
  padding-top: 80px; /* 헤더 높이만큼 상단 여백 추가 */
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); /* 썸네일 크기에 맞춰 그리드 구성 */
  gap: 12px;
  width: 100%;
  max-width: 900px; /* 컨테이너 최대 너비 */
}

.gallery-item {
  position: relative;
  width: 100%;
  height: 150px; /* 썸네일 높이 */
  border-radius: 12px;
  overflow: hidden; /* 사진이 카드 밖으로 넘치지 않도록 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s ease;
  background-color: #f8f9fa; /* 사진 배경색 추가 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery-item:hover {
  transform: scale(1.05);
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 단일 사진 보기 모드 스타일 */
.single-image-view {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.single-image-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.single-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.single-image-view .back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
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
  z-index: 10;
}

.single-image-view .back-btn:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

/* 리뷰 필터링 스타일 */
.review-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  margin-bottom: 12px;
}

.filter-left {
  flex: 1; /* 왼쪽 항목이 차지할 공간 */
}

.filter-right {
  flex: 0 0 auto; /* 오른쪽 항목은 고정 */
}

.photo-filter-checkbox .v-input--selection-controls__input {
  margin-right: 8px;
}

.sort-select .v-input__control {
  min-height: 36px; /* 드롭박스 높이 조정 */
}

.sort-select .v-input__slot {
  margin-bottom: 0; /* 드롭박스 아래 여백 제거 */
}

.sort-select .v-field__outline {
  display: none; /* 테두리 숨김 */
}

.sort-select .v-field__field {
  background: transparent; /* 배경 투명 */
}

.sort-select .v-field__input {
  padding: 0; /* 패딩 제거 */
  min-height: auto; /* 최소 높이 제거 */
}

.rv-loading {
  margin-top: 12px;
}

/* 후기 타이틀 스타일 */
.review-title-section {
  margin-top: 20px;
  margin-bottom: 10px;
  text-align: left;
}

.review-title {
  font-size: 22px;
  font-weight: 800;
  color: #111827;
  margin: 0;
}

/* 리뷰 필터링 구분선 스타일 */
.review-divider {
  margin-top: 10px;
  margin-bottom: 10px;
  border: none;
  border-top: 1px solid #e5e7eb;
  height: 1px;
  background-color: #e5e7eb;
  width: 100%;
}

/* 리뷰 메뉴 스타일 */
.review-menu {
  min-width: 160px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  background: #fff;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.menu-item:hover {
  background-color: #f3f4f6;
}

.menu-item .v-icon {
  color: #6b7280;
}

.menu-item span {
  font-size: 14px;
  color: #374151;
}

.delete-text {
  color: #dc3545 !important;
}
</style>