<!-- src/views/Review/ReplyWriteModal.vue -->
<template>
  <v-dialog
    v-model="internalOpen"
    width="560"
    persistent
    class="reply-dialog"
  >
    <v-card rounded="xl" class="reply-card">
      <!-- 헤더 -->
      <div class="reply-head">
        <div class="reply-head-title">{{ mode === 'edit' ? '답글 수정' : '답글 작성' }}</div>
        <v-btn icon variant="text" class="reply-head-close" @click="close" aria-label="닫기">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- 본문 -->
      <v-card-text class="reply-body pt-5 pb-1 no-scrollbar">
        <!-- 답글 내용 섹션 -->
        <section class="content-sec">
          <div class="sec-title">답글 내용</div>
          <v-textarea
            v-model="form.content"
            placeholder="답글을 작성해주세요"
            rows="6"
            variant="outlined"
            hide-details
            class="content-textarea"
            maxlength="1000"
            counter
          />
        </section>
      </v-card-text>

      <!-- 푸터 액션 -->
      <v-card-actions class="reply-actions">
        <v-btn class="btn-cancel" variant="text" @click="close">취소</v-btn>
        <v-btn class="btn-submit" :disabled="!canSubmit" @click="submit">{{ mode === 'edit' ? '수정' : '등록' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "ReplyWriteModal",
  props: {
    modelValue: { type: Boolean, default: false },
    review: { type: Object, default: null }, // 답글을 작성할 리뷰
    mode: { type: String, default: 'write' }, // 'write' 또는 'edit'
    replyData: { type: Object, default: null }, // 수정 모드일 때 기존 답글 데이터
  },
  emits: ["update:modelValue", "submit"],
  data() {
    return {
      internalOpen: this.modelValue,
      form: {
        content: "", // 답글 내용
      },
    };
  },
      watch: {
      modelValue(v) {
        this.internalOpen = v;
        if (v) {
          if (this.mode === 'edit' && this.replyData) {
            this.initializeFormForEdit();
          } else {
            this.resetForm();
          }
        }
      },
      internalOpen(v) {
        this.$emit("update:modelValue", v);
      },
      mode: {
        handler(newMode) {
          if (newMode === 'edit' && this.replyData && this.internalOpen) {
            this.initializeFormForEdit();
          }
        },
        immediate: true
      },
      replyData: {
        handler(newReplyData) {
          if (newReplyData && this.mode === 'edit' && this.internalOpen) {
            this.initializeFormForEdit();
          }
        },
        immediate: true
      }
    },
  computed: {
    canSubmit() {
      return (this.form.content || "").trim().length > 0;
    },
  },
  methods: {
    resetForm() {
      this.form.content = "";
    },
    initializeFormForEdit() {
      console.log('initializeFormForEdit 호출됨:', this.replyData);
      if (this.replyData && this.replyData.content) {
        this.form.content = this.replyData.content;
        console.log('폼에 기존 답글 내용 설정됨:', this.form.content);
      } else {
        console.log('replyData 또는 content가 없음');
      }
    },
    close() {
      this.internalOpen = false;
    },
    submit() {
      if (!this.canSubmit) return;
      
      const data = {
        content: (this.form.content || "").trim(),
        reviewId: this.review?.id,
      };
      
      if (this.mode === 'edit' && this.replyData) {
        // 수정 모드: replyId 추가
        console.log('수정 모드 - replyData:', this.replyData);
        data.replyId = this.replyData.id;
        data.mode = 'edit';
        console.log('수정 모드 - 전송할 데이터:', data);
      } else {
        // 작성 모드
        data.mode = 'write';
      }
      
      this.$emit("submit", data);
      this.close();
    },
  },
};
</script>

<style scoped>
/* ===== 스크롤 전략 ===== */
.reply-dialog :deep(.v-overlay__content) {
  overflow: visible !important;
}

.reply-card {
  max-height: 82vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reply-body {
  flex: 1;
  overflow-y: auto;
}

/* 공통: 스크롤바 숨김 */
.no-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.no-scrollbar::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* ===== 헤더 ===== */
.reply-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #111;
  color: #fff;
  padding: 10px 14px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}

.reply-head-title {
  font-weight: 800;
  font-size: 17px;
  letter-spacing: -0.2px;
}

.reply-head-close {
  color: #fff;
}

/* ===== 섹션 공통 ===== */
.sec-title {
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

/* ===== 답글 내용 섹션 ===== */
.content-sec {
  margin-bottom: 18px;
}

.content-textarea {
  font-size: 14px;
}

.content-textarea :deep(.v-field__outline) {
  border-color: #d1d5db;
}

.content-textarea :deep(.v-field--focused .v-field__outline) {
  border-color: #111;
}

/* ===== 푸터 액션 ===== */
.reply-actions {
  padding: 16px 20px 20px;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel {
  color: #6b7280;
  font-weight: 500;
  padding: 8px 16px;
}

.btn-submit {
  background: #111;
  color: #fff;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 8px;
  text-transform: none;
  letter-spacing: -0.2px;
}

.btn-submit:hover {
  background: #374151;
}

.btn-submit:disabled {
  background: #d1d5db;
  color: #9ca3af;
}
</style>
