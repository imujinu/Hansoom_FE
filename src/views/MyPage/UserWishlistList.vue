<template>
  <div class="wishlist-page">
    <div class="page-header">
      <h1 class="page-title">찜 목록</h1>
      <p class="page-subtitle">마음에 드는 호텔들을 저장해보세요</p>
    </div>

    <!-- 로딩 상태 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-content">
        <div class="loading-spinner-large">
          <div class="spinner-large"></div>
        </div>
        <h3 class="loading-title">호텔을 불러오는 중</h3>
        <p class="loading-subtitle">잠시만 기다려주세요...</p>
      </div>
    </div>

    <!-- 호텔 목록 -->
    <div v-else class="hotel-grid">
      <div 
        v-for="hotel in hotels" 
        :key="hotel.id"
        class="hotel-card"
        @click="goToHotelDetail(hotel.id)"
      >
        <div class="hotel-content">
          <div class="hotel-image-wrapper">
            <img
              :src="hotel.image"
              :alt="hotel.name"
              class="hotel-image"
            />
            <button
              @click.stop="toggleFavorite(hotel.id)"
              class="favorite-button"
            >
              <svg 
                class="heart-icon"
                :class="{ 'favorited': favorites.has(hotel.id) }"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
          </div>
          <div class="hotel-info">
            <div class="hotel-details">
              <h3 class="hotel-name">{{ hotel.name }}</h3>

              <div class="info-row">
                <!-- 왼쪽: 위치 + 리뷰(별/개수) 한 줄 묶음 -->
                <div class="meta-left">
                  <div class="hotel-location">
                    <svg class="location-icon" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    {{ hotel.location }}
                  </div>

                  <div class="rating-section">
                    <div class="stars">
                      <span 
                        v-for="(star, index) in renderStars(hotel.rating)" 
                        :key="index"
                        class="star"
                        :class="star.class"
                      >
                        ★
                      </span>
                    </div>
                    <span class="rating-text">{{ hotel.rating }}</span>
                    <span class="reviews-text">({{ hotel.reviews }})</span>
                  </div>
                </div>
                <!-- 오른쪽: 상세 정보 버튼 -->
                <div class="action-section">
                  <button 
                    class="detail-button"
                    @click.stop="goToHotelDetail(hotel.id)"
                  >
                    상세 정보
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- 검색 결과 없음 -->
    <div v-if="!isLoading && hotels.length === 0" class="no-results">
      <div class="no-results-content">
        <svg class="no-results-icon" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <h3 class="no-results-title">찜한 호텔이 없습니다</h3>
        <p class="no-results-subtitle">마음에 드는 호텔을 찜해보세요</p>
      </div>
    </div>
  </div>

  <!-- 스낵바 -->
  <div v-if="showSnackbar" class="snackbar show">
    <div class="snackbar-content">
      <span class="snackbar-message">{{ snackbarMessage }}</span>
      <button class="snackbar-close" @click="hideSnackbar">
        <svg viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'UserWishlistList',
  data() {
    return {
      isLoading: true,
      hotels: [],
      favorites: new Set(),
      wishlistHotelIds: [], // 찜한 호텔 ID 목록
      showSnackbar: false,
      snackbarMessage: ''
    };
  },
  async created() {
    await this.loadWishlist();
    await this.loadHotels();
  },
  mounted() {
    // 스크롤 이벤트 리스너 제거 (페이징 없음)
  },
  beforeUnmount() {
    // 스크롤 이벤트 리스너 제거 (페이징 없음)
  },
  methods: {
    // 찜 목록 불러오기
    async loadWishlist() {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        return;
      }

      try {
        const response = await fetch(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/wishlist/list`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (response.ok) {
          const wishlist = await response.json();
          // 찜 목록에서 hotelId만 추출하여 favorites에 추가
          this.favorites = new Set(wishlist.map(item => item.hotelId));
          this.wishlistHotelIds = wishlist.map(item => item.hotelId);
          console.log('찜 목록 로드됨:', this.favorites);
          console.log('찜한 호텔 ID 목록:', this.wishlistHotelIds);
        } else {
          console.error('찜 목록 로드 실패:', response.status);
        }
      } catch (error) {
        console.error('찜 목록 로드 중 오류:', error);
      }
    },

    // 찜 기능 토글
    async toggleFavorite(hotelId) {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        alert('찜 기능은 로그인 후 이용 가능합니다.');
        this.$router.push('/user/login');
        return;
      }

      try {
        const isCurrentlyFavorited = this.favorites.has(hotelId);
        const apiUrl = isCurrentlyFavorited 
          ? `${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/wishlist/dislike` 
          : `${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/wishlist/like`;
        
        const requestOptions = {
          method: isCurrentlyFavorited ? 'DELETE' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            hotelId: hotelId
          })
        };
        
        const response = await fetch(apiUrl, requestOptions);

        if (response.ok) {
          if (!this.favorites) {
            this.favorites = new Set();
          }
          
          if (isCurrentlyFavorited) {
            this.favorites.delete(hotelId);
            // 찜 목록에서도 제거
            this.wishlistHotelIds = this.wishlistHotelIds.filter(id => id !== hotelId);
            // 호텔 목록에서도 제거
            this.hotels = this.hotels.filter(hotel => hotel.id !== hotelId);
            this.showSnackbarMessage('찜 목록에서 취소되었습니다.');
            console.log(`호텔 ${hotelId} 좋아요 취소`);
          } else {
            this.favorites.add(hotelId);
            // 찜 목록에 추가
            this.wishlistHotelIds.push(hotelId);
            this.showSnackbarMessage('찜 목록에 추가되었습니다.');
            console.log(`호텔 ${hotelId} 좋아요 추가`);
            // 찜 목록이 업데이트되었으므로 호텔 목록 새로고침
            this.refreshHotels();
          }
          this.favorites = new Set(this.favorites);
        } else {
          const errorData = await response.json();
          console.error('좋아요 API 호출 실패:', errorData);
          this.showSnackbarMessage('좋아요 처리에 실패했습니다.');
        }
      } catch (error) {
        console.error('좋아요 API 호출 중 오류:', error);
        this.showSnackbarMessage('네트워크 오류가 발생했습니다.');
      }
    },

    // 찜한 호텔 목록 불러오기 (모든 데이터 한 번에)
    async loadHotels() {
      try {
        this.isLoading = true;
        this.hotels = [];
        
        // 찜한 호텔 ID 목록이 없으면 빈 배열 반환
        if (this.wishlistHotelIds.length === 0) {
          this.hotels = [];
          return;
        }

        // 모든 페이지의 데이터를 가져오기 위해 큰 사이즈로 요청
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/hotel/wishlist`, {
          params: {
            page: 0,
            size: 1000 // 큰 사이즈로 모든 데이터 요청
          }
        });
        
        console.log('찜한 호텔 목록 API 응답:', response.data);
        
        if (response.data && response.data.result && response.data.result.content) {
          const result = response.data.result;
          
          // 전체 호텔 목록을 가져와서 찜한 호텔들만 필터링
          let allHotels = result.content.map(hotel => ({
            id: hotel.id,
            name: hotel.hotelName,
            location: hotel.address,
            rating: hotel.rating || 0.0,
            reviews: hotel.reviewCount || 0,
            price: hotel.price || 0,
            image: hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop&crop=center'
          }));

          console.log('가져온 전체 호텔 목록:', allHotels);
          console.log('찜한 호텔 ID 목록:', this.wishlistHotelIds);

          // 찜한 호텔들만 필터링 (ID 타입 변환 고려)
          this.hotels = allHotels.filter(hotel => {
            const hotelId = Number(hotel.id);
            const isInWishlist = this.wishlistHotelIds.includes(hotelId);
            console.log(`호텔 ${hotelId} (${typeof hotelId}) 찜 목록 포함 여부:`, isInWishlist);
            return isInWishlist;
          });
          
          console.log('필터링된 찜한 호텔 목록:', this.hotels);
          console.log('최종 찜한 호텔 수:', this.hotels.length);
        } else {
          console.log('찜한 호텔 목록 API 응답 구조가 예상과 다름:', response.data);
        }
      } catch (error) {
        console.error('찜한 호텔 목록 로드 중 오류:', error);
        this.hotels = [];
      } finally {
        this.isLoading = false;
      }
    },

    // 호텔 목록 새로고침 (찜 목록 변경 시)
    async refreshHotels() {
      this.hotels = [];
      await this.loadHotels();
    },

    // 호텔 상세 페이지로 이동
    goToHotelDetail(hotelId) {
      this.$router.push(`/hotel/detail/${hotelId}`);
    },


    // 별점 렌더링
    renderStars(rating) {
      const stars = [];
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 !== 0;

      for (let i = 0; i < fullStars; i++) {
        stars.push({ class: 'filled' });
      }

      if (hasHalfStar) {
        stars.push({ class: 'half' });
      }

      const emptyStars = 5 - Math.ceil(rating);
      for (let i = 0; i < emptyStars; i++) {
        stars.push({ class: 'empty' });
      }

      return stars;
    },

    // 스낵바 메시지 표시
    showSnackbarMessage(message) {
      this.snackbarMessage = message;
      this.showSnackbar = true;
      setTimeout(() => {
        this.hideSnackbar();
      }, 3000);
    },

    // 스낵바 숨기기
    hideSnackbar() {
      this.showSnackbar = false;
    }
  }
};
</script>

<style scoped>
.wishlist-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 페이지 헤더 */
.page-header {
  margin-bottom: 32px;
  text-align: center;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

/* 로딩 컨테이너 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  background: white;
}

.loading-content {
  text-align: center;
  padding: 40px;
}

.loading-spinner-large {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.spinner-large {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-title {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.loading-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}


/* 검색 결과 없음 */
.no-results {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.no-results-content {
  text-align: center;
  padding: 40px;
}

.no-results-icon {
  width: 64px;
  height: 64px;
  fill: #d1d5db;
  margin: 0 auto 24px;
}

.no-results-title {
  font-size: 20px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.no-results-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

/* 호텔 그리드 */
.hotel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

/* 호텔 카드 */
.hotel-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.hotel-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.hotel-content {
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 12px;
}

/* 호텔 이미지 */
.hotel-image-wrapper {
  position: relative;
  width: calc(100% + 32px);
  height: 200px;
  flex-shrink: 0;
  margin: -16px -16px 0 -16px;
}

.hotel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0;
}

.favorite-button {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.favorite-button:hover {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.heart-icon {
  width: 18px;
  height: 18px;
  fill: #d1d5db;
  transition: fill 0.2s;
}

.heart-icon.favorited {
  fill: #ef4444;
}

/* 호텔 정보 */
.hotel-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hotel-details {
  flex: 1;
}

.info-row {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

/* 왼쪽 묶음: 위치 + 리뷰를 세로로 배치 */
.meta-left {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.hotel-name {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.hotel-location {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.location-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.rating-section {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  margin: 0;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 16px;
  line-height: 1;
}

.star.filled {
  color: #fbbf24;
}

.star.half {
  color: #fbbf24;
  position: relative;
}

.star.empty {
  color: #d1d5db;
}

.rating-text {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.reviews-text {
  color: #6b7280;
  font-size: 14px;
}

.action-section {
  text-align: right;
  margin: 0;
  align-self: center;
}

.detail-button {
  background: #111827;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.detail-button:hover {
  background: #374151;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 스낵바 스타일 */
.snackbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #6b7280;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.snackbar.show {
  opacity: 1;
}

.snackbar-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.snackbar-message {
  font-size: 14px;
  font-weight: 500;
}

.snackbar-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.snackbar-close:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.snackbar-close svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .wishlist-page {
    padding: 0 16px;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .page-subtitle {
    font-size: 1.125rem;
  }
  
  .hotel-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .hotel-content {
    padding: 12px;
  }
  
  .hotel-image-wrapper {
    width: calc(100% + 24px);
    height: 180px;
    margin: -12px -12px 0 -12px;
  }
  
  .info-row {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .meta-left {
    gap: 6px;
  }

  .action-section {
    text-align: left;
    margin-top: 6px;
  }
  
  .detail-button {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>
