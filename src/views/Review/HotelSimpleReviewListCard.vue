<!-- ReviewCarousel.vue -->
<template>
  <div>
    <!-- 리뷰작성 버튼 (HotelDetail에서 임시 숨김) -->
    <!-- <v-btn @click="writeOpen = true">리뷰작성</v-btn> -->
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

      <!-- 본문 -->
      <div class="rv-body" @mouseenter="hover=true" @mouseleave="hover=false">
        <!-- 왼쪽 버튼 -->
        <button
          v-show="hover && canScrollLeft && reviews.length > 0"
          class="rv-nav left"
          @click="scrollBy(-1)"
          aria-label="이전 리뷰"
        >
          <v-icon size="24">mdi-chevron-left</v-icon>
        </button>

        <!-- 트랙 -->
        <div ref="track" class="rv-track">
          <!-- 빈 상태 -->
          <div v-if="!loading && reviews.length === 0" class="rv-empty">
            리뷰가 없습니다.
          </div>

          <!-- 로딩 -->
          <div v-else-if="loading" class="rv-empty">불러오는 중…</div>

          <!-- 리뷰들 -->
          <div
            v-else
            v-for="(r,i) in reviews"
            :key="i"
            class="rv-item"
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
              <div v-if="r.photoUrl" class="thumb">
                <v-img :src="r.photoUrl" height="72" width="96" cover rounded="lg" />
                <div v-if="r.photoCount && r.photoCount>1" class="thumb-badge">{{ r.photoCount }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 오른쪽 버튼 -->
        <button
          v-show="hover && canScrollRight && reviews.length > 0"
          class="rv-nav right"
          @click="scrollBy(1)"
          aria-label="다음 리뷰"
        >
          <v-icon size="24">mdi-chevron-right</v-icon>
        </button>
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
  name: "ReviewCarousel",
  components: { ReviewWriteModal }, // ✅ 추가
  props: {
    hotelId: { type: [String, Number], required: true },
  },
  data() {
    return {
        writeOpen: false,              // ← 모달 열림 상태
        loading: false,                 // 목록 로딩 표시용
        hover: false,
        canScrollLeft: false,
        canScrollRight: false,
        reservationId: 1, // 임시 사용

        // 헤더 표기용
        average: 0,                     // /review/ratings/{id}에서 세팅
        total: 0,                       // /review/ratings/{id}에서 세팅
        hostReplies: 0,                 // (백에서 내려오면 매핑)

        // 리뷰(최대 10개)
        reviews: [],
    };
  },
  watch: {
    hotelId: {
      immediate: true,
      async handler() {
        await Promise.all([this.fetchRatingSummary(), this.fetchReviews(), this.fetchHostRepliesCount()]);
      },
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.updateScrollState();
      this.$refs.track?.addEventListener("scroll", this.updateScrollState, { passive: true });
      window.addEventListener("resize", this.updateScrollState);
    });
  },
  beforeUnmount() {
    this.$refs.track?.removeEventListener("scroll", this.updateScrollState);
    window.removeEventListener("resize", this.updateScrollState);
  },
  methods: {
    async handleWriteSubmit({ rating, contents, files }) {
      // TODO: 서버 API에 맞춰 FormData로 업로드
      // 예시(엔드포인트/필드명은 백엔드에 맞게 바꾸세요)
      try {
        const fd = new FormData();
        fd.append("hotelId", this.hotelId);
        fd.append("reservationId", this.reservationId);
        fd.append("rating", String(rating));
        fd.append("contents", contents);
        (files || []).forEach((f, i) => fd.append("reviewImages", f, f.name ?? `photo_${i}.jpg`));

        // 예시 URL
        await axios.post(`${process.env.VUE_APP_API_BASE_URL}/review/create`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        console.log("[submit]", { rating, contents, filesCount: files?.length || 0 });

        // 성공 후 목록/요약/답글 개수 갱신
        await Promise.all([this.fetchRatingSummary(), this.fetchReviews(), this.fetchHostRepliesCount()]);
      } catch (e) {
        console.error("리뷰 등록 실패:", e);
      }
    },
    // ✅ 평균/총개수는 여기서 가져옴
    async fetchRatingSummary() {
      try {
        const url = `${process.env.VUE_APP_API_BASE_URL}/review/ratings/${this.hotelId}`;
        const res = await axios.get(url);
        const sum = getResultData(res); // { averageRating, ratingCount }
        this.average = Number(sum?.averageRating ?? 0);
        this.total   = Number(sum?.ratingCount ?? 0);
      } catch (e) {
        console.error("평균/총개수 로드 실패:", e);
        this.average = 0;
        this.total = 0;
      }
    },

    // ✅ 목록은 size=10으로 페이징해서 한 페이지만
    async fetchReviews() {
      this.loading = true;
      try {
        const url = `${process.env.VUE_APP_API_BASE_URL}/review/hotel/${this.hotelId}/list`;
        const res = await axios.get(url, { params: { size: 10, page: 0 } });
        const result = getResultData(res); // pageable 응답
        const list = Array.isArray(result?.content) ? result.content : [];

        this.reviews = list.map(item => {
          const date = this.formatDate(item.createdTime);
          const imgs = Array.isArray(item.reviewImageResDtoList) ? item.reviewImageResDtoList : [];
          const photoUrl = imgs[0]?.reviewImageUrl || "";
          const photoCount = imgs.length || 0;
          return {
            rating: Number(item.rating || 0),
            date,
            content: item.contents || "",
            photoUrl,
            photoCount,
          };
        });
      } catch (e) {
        console.error("리뷰 목록 로드 실패:", e);
        this.reviews = [];
      } finally {
        this.loading = false;
        this.$nextTick(this.updateScrollState);
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

    // 카드 한 장 너비(+gap) 계산
    getStep() {
      const track = this.$refs.track;
      if (!track || !track.firstElementChild) return 300;
      const item = track.firstElementChild;
      const rect = item.getBoundingClientRect();
      const styles = getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || 0);
      return Math.round(rect.width + gap);
    },
    scrollBy(dir) {
      const track = this.$refs.track;
      if (!track) return;
      const step = this.getStep() * dir;
      track.scrollBy({ left: step, behavior: "smooth" });
      setTimeout(this.updateScrollState, 260);
    },
    updateScrollState() {
      const el = this.$refs.track;
      if (!el) return;
      this.canScrollLeft = el.scrollLeft > 2;
      this.canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    },
  },
};
</script>

<style scoped>
/* 바깥 카드 */
.rv-wrap { border: 1px solid #eceff3; background: #fff; padding: 16px; border-radius: 12px !important; }

/* 헤더 */
.rv-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.rv-score { display:inline-flex; align-items:center; gap:6px; font-weight:700; color:#1f2937; }
.rv-score .avg { font-size:20px; }
.rv-score .count { color:#6b7280; font-weight:600; }
.rv-score .divider { margin:0 6px; color:#9ca3af; }
.rv-score .reply { color:#1f2937; font-weight:700; }
.rv-score i {
  color: #facc15;
  font-size: 18px;
}
.rv-more { display:inline-flex; align-items:center; gap:4px; background:transparent; border:none; cursor:pointer; color:#111827; font-weight:700; font-size:16px; }

/* 본문/트랙 */
.rv-body { position:relative; }
.rv-track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 320px; /* 고정 크기로 변경 */
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  padding: 6px 4px;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.rv-track::-webkit-scrollbar { display: none; }

/* 리뷰 카드 */
.rv-item { 
  scroll-snap-align: start; 
  border-radius: 14px; 
  background:#f6f7f9; 
  border:1px solid #eef0f3; 
  padding:12px; 
  min-height:110px;
  width: 320px; /* 고정 너비 설정 */
  flex-shrink: 0; /* 크기 축소 방지 */
}
.rv-item-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.stars { display:flex; align-items:center; gap:2px; }
.stars i {
  color: #d1d5db;
  font-size: 16px;
}
.stars i.filled {
  color: #facc15;
}
.picked-chip { margin-left:8px; background:#eef0f3; color:#4b5563; padding:2px 8px; border-radius:9999px; font-size:12px; font-weight:700; }
.date { color:#6b7280; font-size:14px; }
.rv-item-body { display:grid; grid-template-columns:1fr auto; align-items:center; gap:10px; }
.content { color:#374151; line-height:1.45; max-height:3.1em; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.thumb { position:relative; }
.thumb-badge { position:absolute; right:-6px; bottom:-6px; min-width:22px; height:22px; padding:0 6px; border-radius:9999px; background:#111827; color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; box-shadow:0 2px 6px rgba(0,0,0,.18); }

/* 좌우 버튼 */
.rv-nav {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 38px; height: 64px; border-radius: 10px;
  border: 1px solid #e5e7eb; background: #fff;
  display:flex; align-items:center; justify-content:center;
  box-shadow: 0 6px 16px rgba(0,0,0,.08);
  cursor: pointer;
}
.rv-nav.left { left: -6px; }
.rv-nav.right { right: -6px; }
.rv-nav .v-icon { color:#111827; }
.rv-nav:hover { filter: brightness(1.03); }

/* 리뷰 없을 때 / 로딩 */
.rv-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 110px;
  border-radius: 14px;
  background: #f6f7f9;
  border: 1px solid #eef0f3;
  color: #6b7280;
  font-size: 15px;
  font-weight: 500;
}

</style>
