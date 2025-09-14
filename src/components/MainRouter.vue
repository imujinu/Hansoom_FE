<template>
  <!-- 상단 헤더 -->

  <!-- 메인 콘텐츠 -->
  <v-main>
    <v-container>
      <!-- 페이지 제목 -->
      <v-row>
        <v-col>
          <h2 class="text-h5 font-weight-bold mb-4">라우터 목록</h2>
        </v-col>
      </v-row>

      <!-- 카드 목록 -->
      <v-row>
        <v-col cols="12" md="6" lg="4">
          <v-card class="hover-card">
            <v-card-title>호텔</v-card-title>
            <v-card-text>
              <v-row>
                <v-col>
                  <router-link
                    to="/room/search"
                    class="link"
                  >
                    호텔룸 조회
                  </router-link>
                </v-col>
                <v-col>
                  <router-link
                    to="/hotel/search"
                    class="link"
                  >
                    호텔 검색
                  </router-link>
                </v-col>
                <v-col>
                  <router-link
                    to="/hotel/map"
                    class="link"
                  >
                    호텔 지도
                  </router-link>
                </v-col>
              </v-row>
              <v-row>
                <v-col>
                  <router-link
                    to="/hotel/register"
                    class="link"
                  >
                    호텔 등록
                  </router-link>
                </v-col>
                <v-col>
                  <router-link
                    to="/hotel/myhotel"
                    class="link"
                  >
                    내 호텔 관리
                  </router-link>
                </v-col>
              </v-row>    
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" lg="4">
          <v-card class="hover-card">
            <v-card-title>예약</v-card-title>
            <v-card-text>
              <router-link to="/reservation" class="link"
                >예약 페이지</router-link
              >
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" lg="4">
          <v-card class="hover-card">
            <v-card-title>예약 내역</v-card-title>
            <v-card-text>
              <router-link to="/reservations" class="link"
                >예약 내역 확인</router-link
              >
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" lg="4">
          <v-card class="hover-card">
            <v-card-title>로그인</v-card-title>
            <v-card-text>
              <router-link to="/user/login" class="link">로그인</router-link>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" lg="4">
          <v-card class="hover-card">
            <v-card-title>회원가입</v-card-title>
            <v-card-text>
              <router-link to="/user/create" class="link">회원가입</router-link>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="6" lg="4">
          <v-card class="hover-card">
            <v-card-title>호텔 리뷰</v-card-title>
            <v-card-text>
              <router-link to="/review/hotel/reviewCards" class="link"
                >호텔 리뷰</router-link
              >
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" lg="4">
          <v-card class="hover-card">
            <v-card-title>관리화면</v-card-title>
            <v-card-text>
              <router-link to="/admin/dashboard" class="link">관리자화면</router-link>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" lg="4">
          <v-card class="hover-card">
            <v-card-title>채팅</v-card-title>

            <v-card-text>
              <v-row>
                <v-col>
                  <router-link to="/chat" class="link">채팅메인</router-link>
                </v-col>
                <v-col>
                  <router-link to="/groupChat" class="link"
                    >그룹채팅</router-link
                  >
                </v-col>
                <v-col>
                  <router-link to="/chat/host" class="link"
                    >호스트 채팅 관리</router-link
                  >
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script></script>

<style scoped>
.link {
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.hover-card {
  transition: 0.2s;
}

.hover-card:hover {
  transform: translateY(-4px);
}
</style>
