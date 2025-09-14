<!-- src/components/ReviewWriteModal.vue -->
<template>
  <v-dialog
    v-model="internalOpen"
    width="560"
    persistent
    class="rvw-dialog"
  >
    <v-card rounded="xl" class="rvw-card">
      <!-- 헤더 -->
      <div class="rvw-head">
        <div class="rvw-head-title">{{ review ? '리뷰수정' : '리뷰작성' }}</div>
        <v-btn icon variant="text" class="rvw-head-close" @click="close" aria-label="닫기">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- 본문(내부 스크롤, 스크롤바는 숨김) -->
      <v-card-text class="rvw-body pt-5 pb-1 no-scrollbar">
        <!-- 별점 섹션 -->
        <section class="rating-sec">
          <div class="rating-q">숙소는 어땠나요?</div>
          <v-rating
            v-model="form.rating"
            class="tight-stars"
            length="5"
            density="compact"
            hover
            :clearable="false"
            size="30"
            active-color="#FFD700"
            color="#e5e7eb"
            :style="{ '--v-rating-gap': '2px' }"
            @update:modelValue="onRatingUpdate"
          />
          <div v-if="form.rating" class="rating-label">{{ starLabel }}</div>
        </section>

        <!-- 이미지 섹션 -->
        <section class="photo-sec">
          <div class="sec-title">사진 (선택)</div>

          <!-- 숨겨진 파일 입력 (v-model 바인딩) -->
          <v-file-input
            ref="fileInput"
            v-model="pickedFiles"
            accept="image/*"
            multiple
            :show-size="false"
            :counter="false"
            hide-details
            class="visually-hidden-input"
          />

          <!-- 빈 상태: 얇고 긴 업로드 바 -->
          <button
            v-if="previews.length === 0"
            type="button"
            class="empty-uploader"
            @click="triggerFileSelect"
            :disabled="isAtMax"
            :aria-label="isAtMax ? '최대 10장 업로드 완료' : '이미지 추가'"
          >
            <v-icon size="18" class="mr-2">mdi-plus</v-icon>
            이미지 추가해주세요
            <span v-if="isAtMax" class="max-chip-inline">10장 제한</span>
          </button>

          <!-- 이미지 있는 상태: 가로 리스트(가로 스크롤, 스크롤바 숨김) -->
          <div v-else class="photo-track">
            <!-- 업로드 타일 -->
            <button
              type="button"
              class="tile upload-tile"
              @click="triggerFileSelect"
              :disabled="isAtMax"
              :aria-label="isAtMax ? '최대 10장 업로드 완료' : '이미지 추가'"
            >
              <div class="upload-inner">
                <v-icon size="26">mdi-plus</v-icon>
                <div class="upload-text">
                  <div class="line1">이미지</div>
                  <div class="line2">추가해주세요</div>
                </div>
                <div v-if="isAtMax" class="max-chip">10장 제한</div>
              </div>
            </button>

            <!-- 선택된 이미지들 -->
            <div
              v-for="(src, i) in previews"
              :key="i"
              class="tile img-tile"
            >
              <v-img :src="src" width="140" height="105" cover rounded="lg" />
              <v-btn
                class="img-remove"
                icon
                size="x-small"
                density="comfortable"
                variant="flat"
                :aria-label="`이미지 ${i+1} 삭제`"
                @click="removeFile(i)"
              >
                <v-icon size="12">mdi-close</v-icon>
              </v-btn>
            </div>
          </div>

          <!-- 개수 카운터 -->
          <div class="photo-counter">{{ previews.length }} / {{ maxFiles }}</div>
        </section>

        <!-- 작성 가이드 카드 -->
        <section class="guide-sec">
          <v-alert
            variant="tonal"
            color="primary"
            border="start"
            rounded="lg"
            class="guide-card"
          >
            <div class="guide-title">이렇게 작성하면 좋아요.</div>
            <div class="guide-body">
              청결도, 서비스 등 숙소에 대한 전반적인 경험을 작성해 주세요.
            </div>
          </v-alert>
        </section>

        <!-- 내용 섹션(카드형 텍스트필드, 오버레이 제거) -->
        <section class="content-sec">
          <div class="sec-title">내용 (선택)</div>
          <div class="textarea-card">
            <v-textarea
              v-model="form.contents"
              variant="plain"
              rows="5"
              auto-grow
              :counter="1000"
              :maxlength="1000"
              placeholder="숙소 이용 후기를 작성해 주세요."
              hide-details
            />
            <div class="char-counter">
              {{ (form.contents || '').length }} / 1000
            </div>
          </div>
        </section>
      </v-card-text>

      <!-- 액션 -->
      <v-card-actions class="rvw-actions">
        <v-btn class="btn-cancel" variant="text" @click="close">취소</v-btn>
        <v-btn class="btn-submit" :disabled="!canSubmit" @click="submit">{{ review ? '수정' : '등록' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import axios from "axios";

export default {
  name: "ReviewWriteModal",
  props: {
    modelValue: { type: Boolean, default: false },
    maxFiles: { type: Number, default: 10 },
    review: { type: Object, default: null }, // 수정할 리뷰 데이터
  },
  emits: ["update:modelValue", "submit", "complete"],
  data() {
    return {
      internalOpen: this.modelValue,
      form: {
        rating: 5,        // 기본 5점(필수)
        contents: "",     // 선택
        files: [],        // 선택(최대 maxFiles)
      },
      pickedFiles: [],    // v-file-input 바인딩
      previews: [],       // objectURL 목록
      existingImages: [], // 수정 모드에서 기존 이미지 URL들
      labels: {
        1: "별로에요",
        2: "그저그래요",
        3: "괜찮아요",
        4: "좋아요",
        5: "최고에요",
      },
    };
  },
  watch: {
    modelValue(v) {
      this.internalOpen = v;
      if (v && this.review) {
        this.initializeFormForEdit();
      }
    },
    internalOpen(v) {
      this.$emit("update:modelValue", v);
      if (!v) {
        // 모달이 닫힐 때 완전 리셋
        this.resetForm();
      }
    },
    review: {
      handler(newReview) {
        if (newReview && this.internalOpen) {
          this.initializeFormForEdit();
        }
      },
      immediate: true
    },
    pickedFiles(newFiles) {
      this.onFilesPicked(newFiles);
    },
  },
  computed: {
    canSubmit() {
      return Number(this.form.rating) >= 1 && Number(this.form.rating) <= 5;
    },
    starLabel() {
      const n = Math.round(this.form.rating || 0);
      return this.labels[n] || "";
    },
    isAtMax() {
      return (this.form.files?.length || 0) >= this.maxFiles;
    },
  },
  methods: {
    onRatingUpdate(val) {
      if (val < 1) this.form.rating = 1;
      else this.form.rating = Math.round(val);
    },
    triggerFileSelect() {
      if (this.isAtMax) return;
      // 같은 파일 재선택도 이벤트 발생하도록 미리 리셋
      this.pickedFiles = [];
      this.$nextTick(() => {
        this.$refs.fileInput?.reset?.();
        const inputEl = this.$refs.fileInput?.$el?.querySelector('input[type="file"]');
        inputEl?.click?.();
      });
    },
    onFilesPicked(newFiles) {
      const pickedList = Array.from(newFiles || []);
      if (pickedList.length === 0) return;

      const remain = this.maxFiles - (this.form.files?.length || 0);
      const slice = pickedList.slice(0, Math.max(0, remain));
      if (slice.length === 0) {
        this.pickedFiles = [];
        this.$refs.fileInput?.reset?.();
        return;
      }

      // 파일/미리보기 누적(최대치 유지)
      this.form.files = [...(this.form.files || []), ...slice].slice(0, this.maxFiles);
      const newUrls = slice.map(f => URL.createObjectURL(f));
      this.previews = [...this.previews, ...newUrls].slice(0, this.maxFiles);

      // 즉시 리셋하여 같은 파일 다시 선택 가능
      this.pickedFiles = [];
      this.$refs.fileInput?.reset?.();
    },
    removeFile(i) {
      const files = Array.from(this.form.files || []);
      const removedPreview = this.previews[i];
      
      if (removedPreview) {
        // blob URL이면 revoke
        if (removedPreview.startsWith('blob:')) {
          URL.revokeObjectURL(removedPreview);
        }
        
        // existingImages에서도 제거
        const existingIndex = this.existingImages.indexOf(removedPreview);
        if (existingIndex !== -1) {
          this.existingImages.splice(existingIndex, 1);
        }
      }
      
      files.splice(i, 1);
      this.form.files = files;
      this.previews.splice(i, 1);
    },
    cleanupPreviews() {
      // 모든 blob URL 해제
      (this.previews || []).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      
      // 모든 배열 초기화
      this.previews = [];
      this.existingImages = [];
      this.pickedFiles = [];
      this.form.files = [];
      
      // 파일 입력 필드 리셋
      this.$nextTick(() => {
        this.$refs.fileInput?.reset?.();
      });
    },
    close() {
      // 취소 시 폼 완전 리셋
      this.resetForm();
      this.internalOpen = false;
    },
    async submit() {
      if (this.review) {
        // 수정 모드: API 호출
        try {
          await this.updateReview();
        } catch (error) {
          console.error('리뷰 수정 실패:', error);
          // 에러 처리 (선택사항)
          return;
        }
      } else {
        // 신규 작성 모드: submit 이벤트로 데이터 전달
        const data = {
          rating: Math.round(this.form.rating),
          contents: (this.form.contents || "").trim(),
          files: this.form.files,
        };
        this.$emit("submit", data);
      }
      
      this.close();
    },

    // 리뷰 수정 API 호출
    async updateReview() {
      const formData = new FormData();
      
      // 기본 데이터
      formData.append('id', this.review.id);
      formData.append('rating', Math.round(this.form.rating));
      formData.append('contents', (this.form.contents || "").trim());
      
      // 기존 이미지 URL들
      this.existingImages.forEach((url, index) => {
        formData.append(`existingImageUrls[${index}]`, url);
      });
      
      // 새로 추가된 이미지들 (파일)
      const newImages = this.form.files || [];
      newImages.forEach(file => {
        formData.append('newImages', file);
      });
      
      // API 호출
      const response = await axios.put(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/review/update`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      
      if (response.status === 200) {
        // 수정 성공 시 complete 이벤트로 수정된 데이터 전달
        this.$emit("complete", {
          id: this.review.id,
          rating: Math.round(this.form.rating),
          contents: (this.form.contents || "").trim(),
          photos: this.previews
        });
      }
    },
    resetForm() {
      // 폼 데이터 리셋
      this.form.rating = 5;
      this.form.contents = "";
      this.form.files = [];
      
      // 파일 관련 데이터 리셋
      this.pickedFiles = [];
      this.existingImages = [];
      
      // 미리보기 정리 및 리셋
      this.cleanupPreviews();
      
      // 파일 입력 필드 리셋
      this.$nextTick(() => {
        this.$refs.fileInput?.reset?.();
      });
    },
    initializeFormForEdit() {
      if (!this.review) return;
      
      this.form.rating = this.review.rating || 5;
      this.form.contents = this.review.contents || "";
      
      // 기존 이미지들을 previews에 추가
      if (this.review.photos && this.review.photos.length > 0) {
        this.previews = [...this.review.photos];
      }
      // 기존 이미지 URL들을 existingImages에 추가
      if (this.review.photos && this.review.photos.length > 0) {
        this.existingImages = [...this.review.photos];
      }
    }
  },
  beforeUnmount() {
    this.cleanupPreviews();
  },
};
</script>

<style scoped>
/* ===== 스크롤 전략 ===== */
.rvw-dialog :deep(.v-overlay__content) {
  overflow: visible !important;
}
.rvw-card {
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 우측 스크롤 흔적 제거 */
}
.rvw-body {
  flex: 1;
  overflow-y: auto;
}

/* 공통: 스크롤바 숨김 */
.no-scrollbar {
  scrollbar-width: none;           /* Firefox */
  -ms-overflow-style: none;        /* IE/Edge */
}
.no-scrollbar::-webkit-scrollbar { /* Chrome/Safari */
  width: 0;
  height: 0;
}

/* ===== 헤더 (두께 살짝 얇게) ===== */
.rvw-head {
  display:flex; align-items:center; justify-content:space-between;
  background:#111; color:#fff; padding:10px 14px;
  border-top-left-radius: 16px; border-top-right-radius: 16px;
}
.rvw-head-title { font-weight:800; font-size:17px; letter-spacing:-0.2px; }
.rvw-head-close { color:#fff; }

/* ===== 섹션 공통 ===== */
.sec-title { font-weight:700; color:#111827; margin-bottom:8px; }

/* ===== 별점 섹션 ===== */
.rating-sec { text-align:center; margin-bottom:18px; }
.rating-q { font-size:18px; font-weight:700; margin-bottom:8px; color:#111827; }
.rating-label { font-size:16px; font-weight:500; color:#6b7280; }

/* 별 간격 확 줄이기 */
.tight-stars { /* v-rating 루트에 직접 적용 */
  --v-rating-gap: 2px;
}
.tight-stars :deep(.v-btn.v-btn--icon) {
  padding: 0 1px !important;
  min-width: auto !important;
}

/* ===== 사진 섹션 ===== */
.photo-sec { margin: 10px 0 8px; }

/* 빈 상태 업로더 바 */
.empty-uploader {
  width: 100%;
  height: 44px;
  border-radius: 10px;
  border: 1px dashed #9ca3af;
  background: #f3f4f6;
  color: #111;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  cursor: pointer;
  transition: filter .15s ease;
}
.empty-uploader:hover { filter: brightness(1.02); }
.max-chip-inline {
  margin-left: 8px;
  font-size: 12px;
  background:#111827; color:#fff; border-radius:9999px;
  padding: 2px 6px; font-weight:800;
}

/* 리스트 모드 (가로 스크롤, 스크롤바 숨김) */
.photo-track {
  display:grid; grid-auto-flow: column; grid-auto-columns: max-content;
  gap:12px; overflow-x:auto; padding: 4px 2px 8px;
  scrollbar-width:none; -ms-overflow-style:none;
}
.photo-track::-webkit-scrollbar { display:none; }

.tile {
  position:relative; width:140px; height:105px; border-radius:12px;
  border:1px dashed #e5e7eb; background:#f9fafb; flex:0 0 auto;
  display:flex; align-items:center; justify-content:center;
  margin-top: 8px;
}
.upload-tile { border-style:solid; border-color:#9ca3af; background:#f3f4f6; }
.upload-inner { display:flex; flex-direction:column; align-items:center; gap:6px; }
.upload-text { text-align:center; line-height:1.05; }
.upload-text .line1 { font-weight:900; letter-spacing:-0.2px; }
.upload-text .line2 { font-size:13px; color:#6b7280; }
.max-chip {
  position:absolute; top:6px; right:6px; font-size:11px; padding:2px 6px;
  border-radius:9999px; background:#111827; color:#fff; font-weight:700;
}

/* 우상단 제거 버튼 더 작게(18px) */
.img-tile { border: none; background:transparent; }
.img-remove {
  position:absolute; top:-5px; right:-5px;
  background:#111827; color:#fff; border-radius:9999px;
  width: 18px !important; height: 18px !important;
  min-width: 18px !important;
  box-shadow: 0 2px 6px rgba(0,0,0,.15);
}
.img-remove :deep(.v-icon) { font-size:12px !important; line-height:18px; }

/* 사진 카운터 */
.photo-counter { text-align:right; color:#6b7280; font-size:13px; margin-top:4px; }

/* ===== 가이드 카드 ===== */
.guide-sec { margin: 12px 0 4px; }
.guide-card { padding:12px 14px; }
.guide-title { font-weight:800; margin-bottom:2px; color:#111827; }
.guide-body { color:#374151; }

/* ===== 내용 섹션(카드형 텍스트필드) ===== */
.content-sec { margin-top:8px; }
.textarea-card {
  position: relative;
  border: 1px solid #9ca3af;
  background: #f3f4f6;
  border-radius: 12px;
  padding: 6px 8px 26px;
  transition: box-shadow .15s ease, outline .15s ease;
}
.textarea-card:focus-within {
  outline: 2px solid #111;
  outline-offset: 0;
}
/* Vuetify의 필드 오버레이/배경 완전 제거 + 입력 레이어 최상위 */
.textarea-card :deep(.v-field__overlay),
.textarea-card :deep(.v-field__background) {
  display: none !important;
  background: transparent !important;
  opacity: 0 !important;
}
.textarea-card :deep(.v-field) { background: transparent !important; box-shadow: none !important; }
.textarea-card :deep(.v-field__input),

.textarea-card :deep(textarea) {
  position: relative; z-index: 1;
  background: transparent !important;
  padding: 18px 8px 4px !important;
  color: #111827;
}

.textarea-card :deep(.v-field__outline),
.textarea-card :deep(.v-field__loader) { display: none !important; }

.char-counter {
  position:absolute; right:10px; bottom:6px;
  font-size:12px; color:#6b7280;
}

/* ===== 액션 ===== */
.rvw-actions {
  padding: 12px 16px 16px;
  display:flex; align-items:center; justify-content:flex-end; gap:8px;
}
.btn-cancel { color:#6b7280; }
.btn-submit {
  background:#111; color:#fff; font-weight:800;
  border-radius:10px; padding: 8px 16px;
}

/* 접근성용 숨김 인풋 */
.visually-hidden-input {
  position: absolute !important;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0);
  white-space: nowrap; border: 0;
}
</style>
