<template>
  <v-container class="login-bg" fluid>
    <v-row align="center" justify="center" style="min-height: 90vh;">
      <v-col cols="12" md="5" lg="4" class="d-flex flex-column align-center">
        <!-- 로고 (로그인과 동일 스케일) -->
        <div class="d-flex align-center justify-center" style="gap: 12px; margin-top: 40px; margin-bottom: 40px;">
          <span class="thtBi">HANSOOM</span>
        </div>

        <!-- 제목 (로그인과 동일 폰트/간격) -->
        <div class="text-center mb-2" style="font-size:1.7rem;font-weight:700;">회원가입</div>
        <div class="text-center mb-8" style="color:#555;font-size:1rem;">
          hansoom과 함께 특별한 여행을 시작해보세요
        </div>

        <!-- 회원가입 폼 (로그인과 동일 톤) -->
        <v-card width="100%" class="pa-6" elevation="0" style="background:none;box-shadow:none;">
          <v-form @submit.prevent="register">
            <!-- 회원 유형 선택 -->
            <div class="d-flex justify-center mb-8">
              <v-btn-toggle
                v-model="userRole"
                class="member-type-toggle"
                rounded
                divided
                mandatory
              >
                <v-btn value="USER">일반 회원</v-btn>
                <v-btn value="HOST">호스트 회원</v-btn>
              </v-btn-toggle>
            </div>

            <!-- 프로필 이미지 업로드 -->
            <div class="profile-upload mb-4">
              <div class="profile-circle">
                <v-avatar size="120" class="profile-avatar">
                  <v-img v-if="profilePreview" :src="profilePreview" alt="프로필 이미지" cover />
                  <v-icon v-else size="66" color="#9aa3af">mdi-account</v-icon>
                </v-avatar>

                <!-- 우측 하단 + / X 버튼 -->
                <button
                  type="button"
                  class="profile-fab"
                  :class="profileFile ? 'remove-mode' : 'add-mode'"
                  @click="profileFile ? clearProfile() : triggerFile()"
                >
                  <v-icon size="22">
                    {{ profileFile ? 'mdi-close' : 'mdi-plus' }}
                  </v-icon>
                </button>
              </div>

              <!-- 숨겨진 파일 입력 -->
              <input
                ref="fileInput"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="hidden-file"
                @change="onSelectProfile"
              />

              <div class="profile-hint">PNG/JPG/WEBP, 최대 10MB</div>
            </div>

            <div class="mb-3">
              <div class="mb-2" style="font-size:0.90rem;color:#222;">이름</div>
              <v-text-field
                v-model="name"
                placeholder="이름을 입력해주세요"
                hide-details
                density="comfortable"
                variant="outlined"
                class="input-field"
                required
              />
            </div>

            <div class="mb-3">
              <div class="mb-2" style="font-size:0.90rem;color:#222;">닉네임(선택)</div>
              <v-text-field
                v-model="nickname"
                placeholder="닉네임을 입력해주세요"
                hide-details
                density="comfortable"
                variant="outlined"
                class="input-field"
              />
            </div>

            <div class="mb-3">
              <div class="mb-2" style="font-size:0.90rem;color:#222;">이메일 주소</div>
              <v-text-field
                v-model="email"
                placeholder="이메일을 입력해주세요"
                hide-details
                density="comfortable"
                variant="outlined"
                class="input-field"
                required
              />
            </div>

            <div class="mb-3">
              <div class="mb-2" style="font-size:0.90rem;color:#222;">전화번호</div>
              <v-text-field
                v-model="phoneNumber"
                placeholder="전화번호를 입력해주세요"
                hide-details
                density="comfortable"
                variant="outlined"
                class="input-field"
                required
              />
            </div>

            <div class="mb-3">
              <div class="mb-2" style="font-size:0.90rem;color:#222;">비밀번호</div>
              <v-text-field
                v-model="password"
                type="password"
                placeholder="비밀번호를 입력해주세요"
                hide-details
                density="comfortable"
                variant="outlined"
                class="input-field"
                required
              />
            </div>

            <div class="mb-5">
              <div class="mb-2" style="font-size:0.90rem;color:#222;">비밀번호 확인</div>
              <v-text-field
                v-model="passwordConfirm"
                type="password"
                placeholder="비밀번호를 다시 입력해주세요"
                hide-details
                density="comfortable"
                variant="outlined"
                class="input-field"
                required
              />
            </div>

            <!-- 동의 체크박스 -->
            <div class="checkbox-wrap mb-5">
              <label class="plain-checkbox">
                <input type="checkbox" v-model="agreements.terms" />
                <span>
                  <span class="required">*</span>
                  <a href="#" @click.prevent="showTermsModal" class="agreement-link">이용약관</a>에 동의합니다
                </span>
              </label>
              <label class="plain-checkbox">
                <input type="checkbox" v-model="agreements.privacy" />
                <span>
                  <span class="required">*</span>
                  <a href="#" @click.prevent="showPrivacyModal" class="agreement-link">개인정보처리방침</a>에 동의합니다
                </span>
              </label>
              <label class="plain-checkbox">
                <input type="checkbox" v-model="agreements.marketing" />
                <span>
                  마케팅 정보 수신에 동의합니다 (선택)
                </span>
              </label>
            </div>

            <!-- 회원가입 버튼 (로그인 버튼과 동일 스타일) -->
            <v-btn
              block
              color="#111"
              size="large"
              type="submit"
              rounded="lg"
              class="login-btn mb-3"
              style="font-weight:500;font-size:1.00rem;height:40px;"
            >
              회원가입
            </v-btn>
          </v-form>

          <!-- 로그인 링크 (로그인 화면의 "회원가입" 링크 톤과 동일) -->
          <div class="text-center mb-5" style="color:#333;">
            이미 계정이 있으신가요?
            <router-link to="/user/login" class="signup-link">로그인</router-link>
          </div>

          <!-- 또는 구분선 (USER일 때만 노출) -->
          <div class="divider-row mb-4" v-if="userRole === 'USER'">
            <v-divider class="flex-grow-1" />
            <span class="divider-text">또는</span>
            <v-divider class="flex-grow-1" />
          </div>

          <!-- 소셜 로그인 버튼 (USER일 때만 노출) -->
          <div class="d-flex flex-row gap-3 justify-center" v-if="userRole === 'USER'">
            <v-btn
              class="social-btn"
              :style="{ backgroundImage: `url(${googleImg})` }"
              variant="flat"
              @click="googleLogin"
            ></v-btn>
            <v-btn
              class="social-btn"
              :style="{ backgroundImage: `url(${kakaoImg})` }"
              variant="flat"
              @click="kakaoLogin"
            ></v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- 이용약관 모달 -->
    <v-dialog v-model="termsModalOpen" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <span class="text-h6">이용약관</span>
          <v-btn icon @click="termsModalOpen = false" color="black">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-4" style="max-height: 400px; overflow-y: auto;">
          <div class="terms-content">
            <h3>제1조 (목적)</h3>
            <p>본 약관은 한숨(이하 "회사")이 제공하는 숙박 예약 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
            
            <h3>제2조 (정의)</h3>
            <p>1. "서비스"라 함은 회사가 제공하는 숙박 예약 및 관련 서비스를 의미합니다.</p>
            <p>2. "회원"이라 함은 회사의 서비스에 접속하여 본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.</p>
            
            <h3>제3조 (약관의 효력 및 변경)</h3>
            <p>1. 본 약관은 서비스를 이용하고자 하는 모든 회원에 대하여 그 효력을 발생합니다.</p>
            <p>2. 회사는 필요한 경우 관련법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.</p>
            
            <h3>제4조 (서비스의 제공)</h3>
            <p>회사는 다음과 같은 서비스를 제공합니다:</p>
            <ul>
              <li>숙박 시설 정보 제공</li>
              <li>숙박 예약 서비스</li>
              <li>결제 서비스</li>
              <li>고객 지원 서비스</li>
            </ul>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="black" @click="termsModalOpen = false">확인</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 개인정보처리방침 모달 -->
    <v-dialog v-model="privacyModalOpen" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <span class="text-h6">개인정보처리방침</span>
          <v-btn icon @click="privacyModalOpen = false" color="black">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-4" style="max-height: 400px; overflow-y: auto;">
          <div class="privacy-content">
            <h3>1. 개인정보의 수집 및 이용목적</h3>
            <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
            
            <h3>2. 수집하는 개인정보 항목</h3>
            <p>회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:</p>
            <ul>
              <li>필수항목: 이메일, 비밀번호, 이름, 전화번호</li>
              <li>선택항목: 닉네임, 프로필 이미지</li>
            </ul>
            
            <h3>3. 개인정보의 보유 및 이용기간</h3>
            <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
            
            <h3>4. 개인정보의 파기절차 및 방법</h3>
            <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="black" @click="privacyModalOpen = false">확인</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 에러 스낵바 -->
    <v-snackbar
      v-model="showSnackbar"
      timeout="4000"
      color="error"
      location="top"
      variant="flat"
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script>
import googleImg from "@/assets/user/google_login.png";
import kakaoImg from "@/assets/user/kakao_login.png";
import { getErrorMessage } from "@/utils/commonDataHandler";
import axios from "axios";

export default {
  name: "SignupView",
  data() {
    return {
      googleImg,
      kakaoImg,
      userRole: "USER",
      profileFile: null,
      profilePreview: null,
      name: "",
      nickname: "",
      email: "",
      phoneNumber: "",
      password: "",
      passwordConfirm: "",
      agreements: { terms: false, privacy: false, marketing: false },
      googleUrl: "https://accounts.google.com/o/oauth2/auth",
      googleClientId: "184039275121-3v895hcqj0imbjne3pfs9ceg6h8gld30.apps.googleusercontent.com",
      googleRedirectUrl: "https://www.hansoom.shop/oauth/google/redirect",
      googleScope: "openid email profile",

      kakaoUrl: "https://kauth.kakao.com/oauth/authorize",
      kakaoClientId: "f04e0b2f9773e2e421e24a448dc478a0",
      kakaoRedirectUrl: "https://www.hansoom.shop/oauth/kakao/redirect",

      termsModalOpen: false,
      privacyModalOpen: false,
      showSnackbar: false,
      snackbarMessage: ''
    };
  },
  beforeUnmount() {
    if (this.profilePreview) URL.revokeObjectURL(this.profilePreview);
  },
  methods: {
    // ====== 폼 검증 시작 ======
    isValidEmail(email) {
      // 가장 일반적인 이메일 패턴
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    },
    isValidPhone(phone) {
      // 숫자만 추출 후 10~11자리 허용 (하이픈 포함 입력도 허용)
      const digits = (phone || "").replace(/\D/g, "");
      return digits.length === 10 || digits.length === 11;
    },
    validateForm() {
      const name = (this.name || "").trim();
      const email = (this.email || "").trim();
      const phone = (this.phoneNumber || "").trim();
      const pw = (this.password || "");
      const pwc = (this.passwordConfirm || "");

      if (!name) {
        this.showSnackbarMessage("이름을 입력해주세요.");
        return false;
      }
      if (!email) {
        this.showSnackbarMessage("이메일 주소를 입력해주세요.");
        return false;
      }
      if (!this.isValidEmail(email)) {
        this.showSnackbarMessage("올바른 이메일 형식이 아닙니다.");
        return false;
      }
      if (!phone) {
        this.showSnackbarMessage("전화번호를 입력해주세요.");
        return false;
      }
      if (!this.isValidPhone(phone)) {
        this.showSnackbarMessage("전화번호 형식이 올바르지 않습니다. 숫자만 10~11자리로 입력해주세요.");
        return false;
      }
      if (!pw) {
        this.showSnackbarMessage("비밀번호를 입력해주세요.");
        return false;
      }
      if (!pwc) {
        this.showSnackbarMessage("비밀번호 확인을 입력해주세요.");
        return false;
      }
      if (pw !== pwc) {
        this.showSnackbarMessage("비밀번호가 일치하지 않습니다.");
        return false;
      }
      if (!this.agreements.terms || !this.agreements.privacy) {
        this.showSnackbarMessage("이용약관과 개인정보처리방침에 동의해주세요.");
        return false;
      }
      return true;
    },
    // ====== 폼 검증 끝 ======

    triggerFile() {
      this.$refs.fileInput && this.$refs.fileInput.click();
    },
    onSelectProfile(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const okType = ["image/png", "image/jpeg", "image/webp"].includes(file.type);
      if (!okType) {
        this.showSnackbarMessage("PNG, JPG, WEBP 형식만 업로드할 수 있어요.");
        e.target.value = "";
        return;
      }
      const max = 10 * 1024 * 1024; // 10MB
      if (file.size > max) {
        this.showSnackbarMessage("파일 크기가 10MB를 초과합니다.");
        e.target.value = "";
        return;
      }

      if (this.profilePreview) URL.revokeObjectURL(this.profilePreview);
      this.profileFile = file;
      this.profilePreview = URL.createObjectURL(file);
    },
    clearProfile() {
      if (this.profilePreview) URL.revokeObjectURL(this.profilePreview);
      this.profileFile = null;
      this.profilePreview = null;
      if (this.$refs.fileInput) this.$refs.fileInput.value = "";
    },

    async register() {
      // ★ 폼 검증
      if (!this.validateForm()) return;

      const formData = new FormData();

      // JSON 데이터를 Blob으로 추가
      const jsonData = {
        email: this.email.trim(),
        name: this.name.trim(),
        nickName: (this.nickname || "").trim(),   // 선택사항
        password: this.password,
        phoneNumber: this.phoneNumber.trim(),
        userRole: this.userRole
      };
      formData.append(
        "userCreateDto",
        new Blob([JSON.stringify(jsonData)], { type: "application/json" })
      );

      if (this.profileFile) {
        // 실제 파일 있을 때
        formData.append("profileImage", this.profileFile);
      } else {
        // 서버가 "키는 필수"일 때만 사용 (아니면 이 부분 제거)
        formData.append(
          "profileImage",
          new Blob([], { type: "application/octet-stream" }),
          ""
        );
      }

      try {
        const res = await axios.post(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/user/create`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        console.log("성공", res.data);
        
        // 회원가입 성공 시 로그인 화면으로 이동 (성공 메시지 표시를 위한 쿼리 파라미터 추가)
        this.$router.push('/user/login?signup=success');
      } catch (err) {
        console.error("에러", err);
        this.showSnackbarMessage(getErrorMessage(err));
      }
    },

    googleLogin() {
      const auth_uri = `${this.googleUrl}?client_id=${this.googleClientId}&redirect_uri=${this.googleRedirectUrl}&response_type=code&scope=${this.googleScope}`;
      window.location.href = auth_uri;
    },
    kakaoLogin() {
      const auth_uri = `${this.kakaoUrl}?client_id=${this.kakaoClientId}&redirect_uri=${this.kakaoRedirectUrl}&response_type=code`;
      window.location.href = auth_uri;
    },

    showTermsModal() {
      this.termsModalOpen = true;
    },
    showPrivacyModal() {
      this.privacyModalOpen = true;
    },

    // 스낵바 메시지 표시
    showSnackbarMessage(message) {
      this.snackbarMessage = message;
      this.showSnackbar = true;
    },
  },
};
</script>

<style scoped>
/* HANSOOM 로고 스타일 (헤더와 동일) */
.thtBi {
  color: #111;
  font-weight: 700;
  font-style: italic;
  font-family: 'Georgia', serif;
  font-size: 1.5rem;
  letter-spacing: 0.05em;
}

/* 로그인 화면과 동일 스타일 */
.login-bg {
  background: #fafbfc;
  min-height: 100vh;
}

.input-field :deep(input) {
  font-size: 1.1rem;
  background: #fff !important;
  border-radius: 11px !important;
}

.login-btn { box-shadow: none !important; }

.find-link {
  color: #2176ff !important;
  font-size: 0.97rem;
  text-decoration: none;
  font-weight: 500;
}

.signup-link {
  color: #2176ff !important;
  margin-left: 0.3em;
  text-decoration: none;
  font-weight: 500;
}

.gap-3 { gap: 1rem; }

/* 체크박스 (로그인과 동일 톤) */
.checkbox-wrap { display:flex; flex-direction:column; gap:2px; margin-bottom:20px; }
.plain-checkbox { display:flex; align-items:center; gap:8px; font-size:0.97rem; margin-bottom:2px; color:#444; }
.plain-checkbox input[type="checkbox"] { width:18px; height:18px; accent-color:#111; }

/* 구분선 (로그인과 동일) */
.divider-row { display:flex; align-items:center; justify-content:center; width:100%; }
.divider-text { margin:0 12px; color:#B0B4BA; font-size:0.98rem; white-space:nowrap; }

/* SNS 버튼 (로그인과 동일) */
.social-btn {
  width: 190px;
  height: 48px;
  border-radius: 12px;
  padding: 0;
  min-width: unset;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  background-color: transparent !important;
  box-shadow: none !important;
  border: none !important;
  transition: filter 0.13s;
}
.social-btn::before { background-color: transparent !important; }
.social-btn:hover,
.social-btn:focus,
.social-btn:focus-visible {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}
.social-btn:hover { filter: brightness(1.06); }

.required {
  color: red;
  margin-right: 2px;
}
.agreement-link {
  color: #2176ff;
  text-decoration: underline;
}

/* 버튼 토글 스타일 */
.member-type-toggle {
  width: 100%;
  max-width: 360px; /* 가로 길이 조정 */
}

.member-type-toggle .v-btn {
  flex: 1; /* 두 버튼 동일 폭 */
  height: 36px; /* 높이 낮춤 */
  font-size: 0.95rem;
  font-weight: 500;
  background-color: #fff;
  color: #000000;
  border: 1px solid #ccc;
}

.member-type-toggle .v-btn.v-btn--active {
  background-color: #111 !important; /* 클릭 시 검은색 */
  color: #fff !important;
  border-color: #111 !important;
}

.profile-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.profile-circle {
  position: relative;
  width: 120px;
  height: 120px;
}

.profile-avatar {
  width: 100%;
  height: 100%;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.profile-fab {
  position: absolute;
  right: 0px;
  bottom: 0px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f3f4f6; /* 밝은 회색 배경 */
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  cursor: pointer;
  transition: background-color 0.2s;
}

.profile-fab.add-mode v-icon {
  color: #2176ff; /* 파란색 + */
}

.profile-fab.remove-mode v-icon {
  color: #ff3b30; /* 빨간색 X */
}

.profile-fab:hover {
  background-color: #e5e7eb;
}

.hidden-file {
  display: none;
}

.profile-hint {
  font-size: 0.82rem;
  color: #8a8f98;
}

/* 모달 내용 스타일 */
.terms-content, .privacy-content {
  font-size: 0.95rem;
  color: #333;
  line-height: 1.6;
}

.terms-content h3, .privacy-content h3 {
  color: #111;
  margin-top: 15px;
  margin-bottom: 8px;
}

.terms-content p, .privacy-content p {
  margin-bottom: 10px;
}

.terms-content ul, .privacy-content ul {
  padding-left: 20px;
  margin-bottom: 15px;
}

.terms-content li, .privacy-content li {
  margin-bottom: 5px;
}

.social-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

</style>
