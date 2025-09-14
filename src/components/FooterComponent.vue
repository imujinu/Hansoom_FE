<template>
  <v-footer class="footer-main">
    <v-container fluid class="pa-0">
      <!-- Footer Content -->
      <v-row class="footer-content pa-8">
        <v-col cols="12" md="4" class="company-section">
          <div class="company-logo">
            <span class="thtBi">HANSOOM</span>
          </div>
          <div class="company-description mt-4">
            한숨 쉬지 말고, 한숨 쉬다가세요
          </div>
          <div class="social-links mt-6">
            <v-btn
              v-for="social in socialLinks"
              :key="social.name"
              :icon="social.icon"
              variant="text"
              size="small"
              class="social-btn"
              @click="showComingSoon"
            ></v-btn>
          </div>
        </v-col>
        
        <v-col cols="12" md="8">
          <v-row>
            <v-col cols="6" md="4">
              <div class="footer-section">
                <h3 class="section-title">서비스</h3>
                <ul class="link-list">
                  <li v-for="link in serviceLinks" :key="link.name">
                    <a href="#" @click.prevent="showComingSoon" class="footer-link">{{ link.name }}</a>
                  </li>
                </ul>
              </div>
            </v-col>
            
            <v-col cols="6" md="4">
              <div class="footer-section">
                <h3 class="section-title">고객센터</h3>
                <ul class="link-list">
                  <li v-for="link in supportLinks" :key="link.name">
                    <a href="#" @click.prevent="showComingSoon" class="footer-link">{{ link.name }}</a>
                  </li>
                  <li class="contact-info">
                    <v-icon size="small" class="mr-2">mdi-phone</v-icon>
                    <span>1588-0000</span>
                  </li>
                </ul>
              </div>
            </v-col>
            
            <v-col cols="6" md="4">
              <div class="footer-section">
                <h3 class="section-title">정보</h3>
                <ul class="link-list">
                  <li v-for="link in infoLinks" :key="link.name">
                    <a href="#" @click.prevent="showComingSoon" class="footer-link">{{ link.name }}</a>
                  </li>
                </ul>
              </div>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <!-- Bottom Bar -->
      <v-row class="footer-bottom pa-2">
        <v-col cols="12" class="d-flex align-center justify-space-between flex-wrap">
          <div class="copyright">
            © 2025 <strong>HANSOOM</strong>. All rights reserved.
          </div>
          <div class="bottom-links">
            <a href="#" @click.prevent="showComingSoon" class="bottom-link">이용약관</a>
            <a href="#" @click.prevent="showComingSoon" class="bottom-link">개인정보처리방침</a>
            <a href="#" @click.prevent="showComingSoon" class="bottom-link">쿠키 정책</a>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- 스낵바 -->
    <v-snackbar
      v-model="snackbar"
      :timeout="2000"
      color="grey-darken-3"
      location="bottom center"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-tools</v-icon>
        기능 준비중입니다.
      </div>
    </v-snackbar>
  </v-footer>
</template>

<script>
export default {
  data() {
    return {
      snackbar: false,
      socialLinks: [
        { name: 'Facebook', icon: 'mdi-facebook' },
        { name: 'Twitter', icon: 'mdi-twitter' },
        { name: 'Instagram', icon: 'mdi-instagram' },
        { name: 'YouTube', icon: 'mdi-youtube' }
      ],
      serviceLinks: [
        { name: '숙소 검색' },
        { name: '인기 지역' },
        { name: '이벤트' },
        { name: '쿠폰' }
      ],
      supportLinks: [
        { name: '자주 묻는 질문' },
        { name: '문의하기' },
        { name: '예약 관리' }
      ],
      infoLinks: [
        { name: '회사 소개' },
        { name: '이용약관' },
        { name: '개인정보처리방침' },
        { name: '채용 정보' }
      ]
    };
  },
  methods: {
    showComingSoon() {
      this.snackbar = true;
    }
  }
};
</script>

<style scoped>
.footer-main {
  background: #000000;
  color: white;
  margin: 0;
  padding: 0;
  width: 100%;
  position: relative;
  bottom: 0;
  left: 0;
  right: 0;
}

.footer-content {
  background: #000000;
  position: relative;
  margin: 0;
  width: 100%;
}

.footer-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #ffffff, transparent);
}

.company-section {
  position: relative;
}

.company-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.thtBi {
  color: #fff;
  font-weight: 700;
  font-style: italic;
  font-family: "Georgia", serif;
  font-size: 1.8rem;
}

.company-description {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #e0e0e0;
  font-style: italic;
}

.social-links {
  display: flex;
  gap: 16px;
}

.social-btn {
  color: #b0b0b0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.social-btn:hover {
  color: #ffffff;
  transform: translateY(-2px);
}

.footer-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 16px;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 30px;
  height: 2px;
  background: #ffffff;
  border-radius: 1px;
}

.link-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.link-list li {
  margin-bottom: 12px;
}

.footer-link {
  color: #b0b0b0;
  text-decoration: none;
  transition: all 0.3s ease;
  display: inline-block;
  position: relative;
  cursor: pointer;
}

.footer-link:hover {
  color: #ffffff;
  transform: translateX(4px);
}

.footer-link::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: #ffffff;
  transition: width 0.3s ease;
}

.footer-link:hover::before {
  width: 100%;
}

.contact-info {
  display: flex;
  align-items: center;
  color: #ffffff;
  font-weight: 500;
}

.footer-bottom {
  background: rgba(255, 255, 255, 0.05);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 0;
  width: 100%;
}

.copyright {
  color: #b0b0b0;
  font-size: 0.9rem;
}

.bottom-links {
  display: flex;
  gap: 24px;
}

.bottom-link {
  color: #b0b0b0;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
  cursor: pointer;
}

.bottom-link:hover {
  color: #ffffff;
}

/* 반응형 디자인 */
@media (max-width: 960px) {
  .footer-content {
    padding: 48px 24px !important;
  }
  
  .company-logo {
    justify-content: center;
    margin-bottom: 24px;
  }
  
  .social-links {
    justify-content: center;
  }
  
  .footer-section {
    text-align: center;
  }
  
  .section-title::after {
    left: 50%;
    transform: translateX(-50%);
  }
  
  .bottom-links {
    margin-top: 16px;
    justify-content: center;
  }
}

@media (max-width: 600px) {
  .footer-content {
    padding: 32px 16px !important;
  }
  
  .thtBi {
    font-size: 1.5rem;
  }
  
  .company-description {
    font-size: 1rem;
    text-align: center;
  }
  
  .bottom-links {
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }
}
</style>
