<!-- src/views/mypage/InfoView.vue -->
<template>
  <v-container class="info-root" fluid>
    <div class="wrap">
      <v-card class="info-card" elevation="2">
        <!-- ===== 헤더: 파란 배경 + 흰색 텍스트 ===== -->
        <div class="card-header">
          <div class="tab-badge" aria-label="내정보 관리">
            <span class="text">내정보 관리</span>
          </div>
        </div>

        <v-divider class="mb-3" />

        <!-- 로딩 스켈레톤 -->
        <div v-if="loading" class="px-4 pb-4">
          <v-skeleton-loader type="article, list-item-two-line" />
        </div>

        <!-- ===== 본문 ===== -->
        <div v-else class="card-body">
          <!-- 프로필 아바타: 보기/편집 공통으로 카드 상단 중앙 -->
          <div class="avatar-zone">
            <div class="avatar-wrapper">
              <div class="avatar">
                <template v-if="avatarUrl">
                  <img :src="avatarUrl" alt="프로필 이미지" />
                </template>
                <template v-else>
                  <!-- ✅ 랜덤 밝은 배경색 적용 -->
                  <span :style="avatarStyle">{{ initial }}</span>
                </template>
              </div>

              <!-- 편집 모드에서만 원형 수정/삭제 버튼 (개별 위치 조절 지원) -->
              <div v-if="isEdit" class="avatar-actions">
                <!-- 수정 버튼 -->
                <button
                  type="button"
                  class="avatar-btn edit"
                  :style="editBtnStyle"
                  @click="triggerPick"
                  aria-label="프로필 이미지 변경"
                >
                  <v-icon size="16">mdi-pencil</v-icon>
                </button>
                <!-- 삭제 버튼 -->
                <button
                  type="button"
                  class="avatar-btn danger del"
                  :style="delBtnStyle"
                  @click="removeAvatar"
                  aria-label="프로필 이미지 삭제"
                >
                  <v-icon size="16">mdi-close</v-icon>
                </button>
              </div>
            </div>

            <!-- 숨김 파일 인풋 -->
            <input
              ref="file"
              type="file"
              accept="image/*"
              class="hidden-file"
              @change="onPick"
            />

            <div v-if="isEdit" class="hint">이미지를 선택하지 않으면 기존 이미지가 유지됩니다.</div>
          </div>

          <!-- 보기 모드 -->
          <div class="info-grid" v-if="!isEdit">
            <div class="info-item">
              <div class="label">이름</div>
              <div class="value">{{ uiUser?.name || "익명 사용자" }}</div>
            </div>

            <div class="info-item">
              <div class="label">닉네임</div>
              <div class="value">{{ uiUser?.nickName || "-" }}</div>
            </div>

            <div class="info-item">
              <div class="label">이메일</div>
              <div class="value">{{ uiUser?.email || "-" }}</div>
            </div>

            <div class="info-item">
              <div class="label">전화번호</div>
              <div class="value">{{ formatPhone(uiUser?.phoneNumber) }}</div>
            </div>

            <div class="info-item">
              <div class="label">권한</div>
              <div class="value">{{ roleLabel }}</div>
            </div>

            <div class="info-item">
              <div class="label">가입일</div>
              <div class="value">{{ formatDate(uiUser?.createdTime) }}</div>
            </div>
          </div>

          <!-- 편집 모드 -->
          <div v-else>
            <v-row dense class="mt-1">
              <v-col cols="12" md="6">
                <div class="label">이름</div>
                <v-text-field
                  v-model="form.name"
                  variant="outlined"
                  density="comfortable"
                  :rules="[rules.required]"
                  hide-details="auto"
                />
              </v-col>

              <v-col cols="12" md="6">
                <div class="label">닉네임</div>
                <v-text-field
                  v-model="form.nickName"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                />
              </v-col>

              <v-col cols="12" md="6">
                <div class="label">전화번호</div>
                <v-text-field
                  v-model="form.phoneNumber"
                  variant="outlined"
                  density="comfortable"
                  placeholder="01012341234"
                  hide-details
                />
              </v-col>

              <v-col cols="12" md="6">
                <div class="label">이메일</div>
                <v-text-field
                  :model-value="uiUser?.email || '-'"
                  variant="outlined"
                  density="comfortable"
                  disabled
                />
              </v-col>
            </v-row>
          </div>
        </div>

        <!-- ===== 하단 풋터 액션(고정) ===== -->
        <div class="card-footer">
          <div class="footer-inner">
            <div class="spacer" />

            <template v-if="!isEdit">
              <!-- ✅ 오른쪽: 회원 탈퇴 버튼 (붉은 계열, 정보수정과 동일 스타일) -->
              <v-btn
                variant="outlined"
                rounded="lg"
                class="px-5"
                :loading="deleting"
                color="#EF4444"
                @click="deleteAccount"
              >
                회원 탈퇴
              </v-btn>

              <v-btn
                variant="outlined"
                rounded="lg"
                class="px-5"
                color="#374151"
                @click="startEdit"
              >
                정보 수정
              </v-btn>
            </template>
            <template v-else>
              <v-btn variant="text" class="mr-1" @click="cancelEdit">취소</v-btn>
              <v-btn
                :loading="saving"
                color="#374151"
                rounded="lg"
                class="px-5"
                style="color:#fff"
                @click="submit"
              >
                저장
              </v-btn>
            </template>
          </div>
        </div>
      </v-card>
    </div>

    <!-- 알림 -->
    <v-snackbar
      v-model="snack.show"
      timeout="2200"
      :color="snack.color"
      location="top"
      variant="flat"
    >
      {{ snack.message }}
    </v-snackbar>
  </v-container>
</template>

<script>
import axios from "axios";

export default {
  name: "InfoView",
  props: {
    user: { type: Object, default: () => ({}) },
    loading: { type: Boolean, default: false },
  },
  emits: ["updated"],
  data() {
    return {
      isEdit: false,
      saving: false,
      deleting: false, // ✅ 회원 탈퇴 로딩 상태

      form: { name: "", nickName: "", phoneNumber: "" },
      profileFile: null,
      previewUrl: "",
      removeProfileImage: false, // ✅ 서버 DTO의 boolean과 1:1 매핑

      // 버튼 위치 조절
      editBtnPos: { bottom: 2, right: -2 }, // 연필
      delBtnPos:  { bottom: 2, left:  -2 }, // 삭제

      // ✅ 이니셜 아바타 배경 (밝은 랜덤 컬러)
      avatarBgColor: "",

      // ✅ 저장 후 즉시 화면 반영용 로컬 사용자 캐시
      localUser: null,

      snack: { show: false, message: "", color: "success" },
      rules: { required: v => !!String(v || "").trim() || "필수 입력입니다." },
    };
  },
  computed: {
    // 화면 표시용 사용자: 로컬 캐시 우선
    uiUser() {
      return this.localUser || this.user || {};
    },
    avatarUrl() {
      if (this.removeProfileImage) return "";
      return this.previewUrl || this.uiUser?.profileImage || "";
    },
    initial() {
      const s = (this.uiUser?.name || this.uiUser?.nickName || "익명").trim();
      return s ? s[0] : "익";
    },
    // 권한 라벨 매핑
    roleLabel() {
      const r = (this.uiUser?.userRole || "").toString().toUpperCase();
      const map = { USER: "회원", HOST: "호스트", ADMIN: "관리자" };
      return map[r] ?? "-";
    },
    // 버튼 스타일 생성기 (숫자는 px로 자동 변환)
    editBtnStyle() {
      return this.toPosStyle(this.editBtnPos);
    },
    delBtnStyle() {
      return this.toPosStyle(this.delBtnPos);
    },
    // ✅ 이니셜 아바타 스타일
    avatarStyle() {
      return {
        background: this.avatarBgColor || "#374151",
        color: "#fff",
      };
    },
  },
  watch: {
    user: {
      immediate: true,
      handler(u) {
        // 폼은 항상 최신 프롭으로 동기화
        this.form.name = u?.name || "";
        this.form.nickName = u?.nickName || "";
        this.form.phoneNumber = u?.phoneNumber || "";
        this.ensureAvatarColor();
      },
    },
    // 프로필 이미지가 사라지는 전환에도 색 보정
    removeProfileImage(val) {
      if (val) this.ensureAvatarColor();
    },
    previewUrl(val) {
      if (!val && !this.uiUser?.profileImage) this.ensureAvatarColor();
    },
  },
  methods: {
    /* ===== 저장 후 UI 즉시 반영을 위한 보조 ===== */
    normalizeUser(raw) {
      const d =
        raw?.data?.result ??
        raw?.result ??
        raw?.data ??
        raw ??
        {};
      return {
        email:        d.email ?? "",
        name:         d.name ?? "",
        nickName:     d.nickName ?? "",
        phoneNumber:  d.phoneNumber ?? "",
        userRole:     d.userRole ?? "",
        profileImage: d.profileImage ?? null,
        createdTime:  d.createdTime ?? "",
      };
    },
    async refreshUser() {
      try {
        const res = await axios.get(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/user/mypage`);
        const u = this.normalizeUser(res);
        this.localUser = u;               // 화면 즉시 갱신
        this.$emit("updated", u);         // (선택) 부모가 받으면 상단 상태도 동기화 가능
        this.ensureAvatarColor();
      } catch (e) {
        console.error("사용자 재조회 실패:", e);
      }
    },

    // ===== 랜덤 밝은 색 생성 =====
    ensureAvatarColor() {
      if (this.avatarUrl) return; // 이미지가 있으면 색 필요 없음
      if (!this.avatarBgColor) this.avatarBgColor = this.pickRandomBright();
    },
    pickRandomBright() {
      // 어두운 계열 제외한, 가독성 좋은 중간-밝은 팔레트
      const palette = [
        "#3B82F6", "#06B6D4", "#10B981", "#22C55E",
        "#84CC16", "#F59E0B", "#F97316", "#EF4444",
        "#EC4899", "#8B5CF6", "#A855F7", "#14B8A6",
      ];
      return palette[Math.floor(Math.random() * palette.length)];
    },

    setEditBtnPos(pos = {}) { this.editBtnPos = { ...this.editBtnPos, ...pos }; },
    setDelBtnPos(pos = {})  { this.delBtnPos  = { ...this.delBtnPos,  ...pos }; },

    toPosStyle(pos) {
      const style = { position: "absolute" };
      for (const k of ["top", "right", "bottom", "left"]) {
        if (pos[k] !== undefined && pos[k] !== null) {
          const v = pos[k];
          style[k] = typeof v === "number" ? `${v}px` : String(v);
        }
      }
      if (pos.transform) style.transform = String(pos.transform);
      return style;
    },

    startEdit() {
      this.isEdit = true;
      this.form.name = this.uiUser?.name || "";
      this.form.nickName = this.uiUser?.nickName || "";
      this.form.phoneNumber = this.uiUser?.phoneNumber || "";
      this.removeProfileImage = false; // 새 편집 시작 시 기본값
      this.clearPicked();
      this.ensureAvatarColor();
    },
    cancelEdit() {
      this.isEdit = false;
      this.removeProfileImage = false;
      this.clearPicked();
    },
    triggerPick() {
      this.$refs.file?.click?.();
    },
    onPick(e) {
      const file = e?.target?.files?.[0];
      if (!file) return;
      this.removeProfileImage = false; // 새 이미지 선택 시 삭제 해제
      this.clearPicked();
      this.profileFile = file;
      this.previewUrl = URL.createObjectURL(file);
    },
    removeAvatar() {
      this.removeProfileImage = true; // ✅ 서버 boolean
      this.clearPicked();            // 파일/미리보기 제거
      this.ensureAvatarColor();
    },
    clearPicked() {
      if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = "";
      this.profileFile = null;
      if (this.$refs.file) this.$refs.file.value = "";
    },
    openSnack(message, color = "success") {
      this.snack = { show: true, color, message };
    },

    async submit() {
      const nameCheck = this.rules.required(this.form.name);
      if (nameCheck !== true) return this.openSnack(nameCheck, "error");

      try {
        this.saving = true;

        const fd = new FormData();
        fd.append("name", this.form.name ?? "");
        fd.append("nickName", this.form.nickName ?? "");
        fd.append("phoneNumber", this.form.phoneNumber ?? "");

        // ✅ 서버 DTO(UserUpdateDto)에 맞게 boolean 항상 전송
        // - 이미지 삭제: removeProfileImage=true, profileImage 미포함
        // - 새 이미지 업로드: removeProfileImage=false, profileImage 파일 포함
        // - 아무것도 안 건드림: removeProfileImage=false, profileImage 미포함
        fd.append("removeProfileImage", String(this.removeProfileImage));

        if (!this.removeProfileImage && this.profileFile) {
          fd.append("profileImage", this.profileFile, this.profileFile.name);
        }

        await axios.put(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/user/update`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // ✅ 저장 성공: 서버에서 최신 프로필을 재조회하여 화면 즉시 반영
        await this.refreshUser();

        this.openSnack("저장되었습니다.", "success");
        this.isEdit = false;
      } catch (e) {
        console.error(e);
        this.openSnack("저장에 실패했습니다.", "error");
      } finally {
        this.saving = false;
        this.clearPicked();
      }
    },

    // 로그아웃 기능
    logout() {
      try {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.reload();
      } catch (error) {
        console.log(error);
      }
    },

    // 회원탈퇴 확인 모달
    async deleteAccount() {
      const confirmed = await new Promise((resolve) => {
        this.$modalBus.showConfirm({
          title: '회원 탈퇴',
          message: '정말로 회원 탈퇴를 하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
          confirmColor: '#EF4444',
          resolve: resolve
        });
      });
      
      if (confirmed) {
        // 기존 회원탈퇴 로직 실행
        this.performDeleteAccount();
      }
    },

    // 실제 회원탈퇴 실행
    async performDeleteAccount() {
      try {
        this.deleting = true;
        await axios.delete(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/user/delete`);
        
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        this.openSnack("회원 탈퇴가 완료되었습니다.", "success");
        setTimeout(() => {
          window.location.reload();
        }, 600);
      } catch (e) {
        console.error(e);
        this.openSnack("회원 탈퇴에 실패했습니다.", "error");
      } finally {
        this.deleting = false;
      }
    },

    formatPhone(p) {
      const s = (p || "").replace(/\D/g, "");
      if (s.length === 11) return `${s.slice(0,3)}-${s.slice(3,7)}-${s.slice(7)}`;
      if (s.length === 10) return `${s.slice(0,3)}-${s.slice(3,6)}-${s.slice(6)}`;
      return p || "-";
    },
    formatDate(iso) {
      if (!iso) return "-";
      const d = new Date(iso);
      if (isNaN(d.getTime())) return "-";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}.${m}.${day}`;
    },
  },
  beforeUnmount() {
    this.clearPicked();
  },
};
</script>

<style scoped>
/* ===== 전체 레이아웃 & 변수 ===== */
.info-view{
  --blue:#374151;
  --border:#e8ecf3;
  --panel:#f5f7fb;
  --text:#334155;
  --muted:#94a3b8;
  --indPad: 6px;
  --indW:   5px;
  --indH:  28px;
}

.wrap{ display:flex; justify-content:center; }
.info-card{
  width:100%;
  max-width: 880px;
  border:1px solid var(--border);
  border-radius:16px;
  overflow: clip;
}

/* 헤더 */
.card-header{ padding: 18px 20px 12px; background: #374151; }
.tab-badge{
  position:relative; display:inline-flex; align-items:center; gap:10px;
  padding-left: calc(var(--indPad) + var(--indW) + 1px);
  min-height: 36px;
}
.tab-badge .text{ font-weight:800; color:#fff; letter-spacing:.1px; font-size:18px; }

/* 본문 */
.card-body{ padding: 6px 20px 12px; }

/* 아바타 */
.avatar-zone{ display:flex; flex-direction:column; align-items:center; margin:6px 0 14px; }
.avatar-wrapper{ position: relative; display:inline-flex; align-items:center; }
.avatar{
  width:104px; height:104px; border-radius:9999px; background:#e9f1ff;
  display:grid; place-items:center; overflow:hidden; border:2px solid #d7e6ff;
}
.avatar img{ width:100%; height:100%; object-fit:cover; }
.avatar span{
  font-weight:900; /* 배경색은 inline-style로 주입 */
  color:#fff;
  width:100%; height:100%;
  display:grid; place-items:center; font-size:36px;
  border-radius:9999px;
}

/* 액션 영역: 전체 덮고, 버튼만 클릭되게 */
.avatar-actions{
  position:absolute;
  inset:0;
  pointer-events:none;
  z-index: 1;
}

/* 버튼 기본 스타일 + 절대 위치(개별 스타일 바인딩으로 top/right/bottom/left 제어) */
.avatar-btn{
  position: absolute;
  pointer-events:auto;
  width:28px; height:28px; border-radius:9999px;
  display:inline-flex; align-items:center; justify-content:center;
  background:#fff; border:1px solid #e5e7eb; box-shadow:0 2px 6px rgba(0,0,0,.15);
  transition: transform .1s ease;
}
.avatar-btn:hover{ transform: translateY(-1px); }
.avatar-btn.danger{ background:#fff5f5; border-color:#ffd7d7; }
.hint{ color:#6b7280; font-size:12px; margin-top:6px; }

/* 숨김 파일 인풋 */
.hidden-file{
  position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0);
  white-space:nowrap; border:0; padding:0; margin:-1px;
}

/* 정보 그리드 */
.info-grid{
  display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:14px;
}
@media (max-width: 768px){ .info-grid{ grid-template-columns:1fr; } }
.info-item{ border:1px solid #eceff3; background:#f9fbff; border-radius:12px; padding:12px 14px; }
.label{ color:#6b7280; font-weight:600; margin-bottom:6px; }
.value{ color:#111827; font-weight:700; }

/* 풋터: 경계선 제거 */
.card-footer{
  position: sticky;
  bottom: 0;
  background: #fff;
  border-top: none;
}
.footer-inner{ display:flex; align-items:center; gap:8px; padding: 10px 14px; }
.spacer{ flex:1; }
</style>
