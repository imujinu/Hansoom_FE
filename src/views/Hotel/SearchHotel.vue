<template>
  <div class="hotel-search-container">
    <!-- 검색창 카드 -->
    <div class="search-card">
      <div class="search-section">
        <div class="search-form">
          <div class="form-row">
            <div class="form-group flex-1">
              <div class="location-input-group">
                <select v-model="searchType" @change="onSearchTypeChange" class="form-select inline-select">
                  <option value="address">지역명</option>
                  <option value="hotelName">호텔명</option>
                </select>
                <div class="input-wrappers">
                  <input
                    type="text"
                    :placeholder="searchType === 'hotelName' ? '호텔명을 입력하세요' : '지역명을 입력하세요'"
                    v-model="searchQuery"
                    @input="onSearchInput($event)"
                    @keydown="onSearchKeydown"
                    @focus="onSearchFocus"
                    @blur="onSearchBlur"
                    class="form-input inline-input"
                    autocomplete="off"
                  >
                  
                  <!-- 자동완성 드롭다운 -->
                  <div v-if="showSuggestions" class="suggestions-dropdown">
                    <!-- 닫기 버튼 헤더 -->
                    <div class="suggestions-header">
                      <span class="suggestions-title">검색 제안</span>
                      <button @click="closeSuggestions" class="close-suggestions-btn" type="button">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                        </svg>
                      </button>
                    </div>
                    
                    <!-- 제안 목록 -->
                    <div class="suggestions-content">
                      <div
                        v-for="(suggestion, index) in suggestions"
                        :key="index"
                        :class="['suggestion-item', { 'selected': selectedSuggestionIndex === index }]"
                        @mousedown="selectSuggestion(suggestion)"
                        @mouseenter="selectedSuggestionIndex = index"
                      >
                        <div v-html="suggestion.highlightedText || suggestion.text" class="suggestion-text"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="form-group date-group">
              <input
                type="date"
                v-model="checkIn"
                :min="getTodayDate()"
                class="form-input date-input-compact"
                @change="onCheckInDateChange"
              />
            </div>
            <div class="form-group date-group">
              <input
                type="date"
                v-model="checkOut"
                :min="minCheckOutDate"
                class="form-input date-input-compact"
                @change="onCheckOutDateChange"
              />
            </div>
            <div class="form-group guests-group">
              <input
                type="number"
                min="1"
                max="10"
                v-model.number="people"
                class="form-input guests-input-compact"
                placeholder="인원"
              />
            </div>
            <div class="search-button-group">
              <button @click="searchHotels" class="search-button" :disabled="loading">
                {{ loading ? '검색중...' : '검색' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <div class="main-content">
      <!-- 사이드바 필터 -->
      <div class="sidebar">
        <div class="filter-section">
          <h3>필터</h3>
          
          <!-- 가격대 -->
          <div class="filter-group">
            <h4>가격</h4>
            <div class="price-range-container">
              <div class="price-slider-wrapper">
                <div class="slider-track">
                  <div class="slider-range" :style="sliderRangeStyle"></div>
                </div>
                <input 
                  type="range" 
                  v-model="minPrice" 
                  :min="0" 
                  :max="maxPriceLimit" 
                  :step="10000"
                  class="price-slider min-slider"
                  @input="updatePriceRange"
                >
                <input 
                  type="range" 
                  v-model="maxPrice" 
                  :min="0" 
                  :max="maxPriceLimit" 
                  :step="10000"
                  class="price-slider max-slider"
                  @input="updatePriceRange"
                >
              </div>
              
              <!-- 가격 입력 필드 -->
              <div class="price-inputs">
                <div class="price-input-group">
                  <input 
                    v-model.number="minPrice" 
                    type="number" 
                    :min="0" 
                    :max="maxPrice"
                    :step="10000"
                    class="price-input"
                    @change="validatePriceRange"
                  >
                  <span class="price-unit">원</span>
                </div>
                <span class="price-separator">~</span>
                <div class="price-input-group">
                  <input 
                    v-model.number="maxPrice" 
                    type="number" 
                    :min="minPrice" 
                    :max="maxPriceLimit"
                    :step="10000"
                    class="price-input"
                    @change="validatePriceRange"
                  >
                  <span class="price-unit">원</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 숙소 유형 -->
          <div class="filter-group">
            <h4>숙소 유형</h4>
            <div class="checkbox-group">
              <label><input type="checkbox" v-model="hotelTypes" value="HOTEL" @change="onHotelTypeChange"> 호텔</label>
              <label><input type="checkbox" v-model="hotelTypes" value="MOTEL" @change="onHotelTypeChange"> 모텔</label>
              <label><input type="checkbox" v-model="hotelTypes" value="PENSION" @change="onHotelTypeChange"> 펜션</label>
            </div>
          </div>

          <!-- 평점 -->
          <div class="filter-group">
            <h4>평점</h4>
            <div class="checkbox-group">
              <label v-for="score in [4, 3, 2, 1]" :key="score" class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  :value="score"
                  :checked="rating === score"
                  @change="ratingChange(score)"
                >
                ★ {{ score }}점 이상
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- 호텔 목록 -->
      <div class="hotel-list">
        <!-- 검색 결과 정보 및 정렬 옵션 -->
        <div v-if="!loading && hotels.length > 0" class="results-header">
          <div class="search-info">
            총 {{ totalElements }}개의 호텔
            <span v-if="minPrice > 0 || maxPrice < maxPriceLimit || hotelTypes.length > 0">(필터 적용됨)</span>
          </div>
          
          <!-- 정렬 옵션 -->
          <div class="sort-section">
            <select v-model="sortOption" @change="onSortChange" class="sort-select">
              <option value="">추천순</option>
              <option value="price,asc">가격 낮은순</option>
              <option value="price,desc">가격 높은순</option>
              <option value="rating,desc">평점 높은순</option>
              <option value="rating,asc">평점 낮은순</option>
            </select>
          </div>
        </div>
        
        <div v-if="loading && hotels.length === 0" class="loading">
          검색 중입니다...
        </div>
        
        <div v-else-if="hotels.length === 0 && !loading" class="no-results">
          검색 결과가 없습니다.
        </div>
        
        <div v-else class="hotel-grid">
          <div 
            v-for="hotel in hotels" 
            :key="hotel.id"
            class="hotel-card"
            @click="onHotelCardClick(hotel)"
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
                          <i 
                            v-for="n in 5" 
                            :key="n" 
                            class="fas fa-star star"
                            :class="{ 'filled': n <= Math.round(hotel.rating) }"
                          ></i>
                        </div>
                        <span class="rating-text">{{ hotel.rating }}</span>
                        <span class="reviews-text">({{ hotel.reviewCount }})</span>
                      </div>
                    </div>
                    <!-- 오른쪽: 가격/박 -->
                    <div class="price-section">
                      <span class="price">{{ formatPrice(hotel.price) }}</span>
                      <span class="price-unit">/박</span>
                    </div>
                  </div>
                  <div v-if="hotel.distance" class="distance-info">
                    <svg class="distance-icon" viewBox="0 0 24 24">
                      <path d="M12 2A7 7 0 0 0 5 9c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 11.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
                    </svg>
                    {{ hotel.distance }}km
                  </div>
                </div>
                

                
                <div class="hotel-actions">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 무한 스크롤 로딩 표시 -->
        <div v-if="loadingMore" class="loading-more">
          더 많은 호텔을 불러오는 중...
        </div>

        <!-- 더 이상 로드할 데이터가 없을 때 -->
        <div v-if="!hasMoreData && hotels.length > 0 && !loading" class="no-more-data">
          모든 호텔을 확인했습니다.
        </div>
      </div>
    </div>
  </div>
  
  <!-- 스낵바 -->
  <div v-if="showSnackbar" class="snackbar" :class="{ 'show': showSnackbar }">
    <div class="snackbar-content">
      <span class="snackbar-message">{{ snackbarMessage }}</span>
      <button @click="hideSnackbar" class="snackbar-close">×</button>
    </div>
  </div>
  
  <button class="scrollToTop" @click="scrollToTop" aria-label="맨 위로 가기">
      <i class="fas fa-chevron-up"></i>
  </button>
</template>

<script>
export default {
  name: 'HotelSearchPage',
  // 뒤로가기 감지
  beforeRouteLeave(to, from, next) {
    // 호텔 상세 페이지가 아닌 곳으로 가면 저장된 데이터 삭제
    if (!to.path.includes('/hotel/detail')) {
      this.clearStorage();
    }
    next();
  },
  data() {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    // 날짜 포맷 (YYYY-MM-DD)으로 변환
    const formatDate = (date) => {
      return date.toISOString().split('T')[0];
    };
    return {
      // 검색 조건
      searchType: 'address',
      searchQuery: '서울',
      checkIn: formatDate(today),      // 오늘 날짜
      checkOut: formatDate(tomorrow),  // 내일 날짜
      people: 2,
      
      // 필터
      minPrice: 0,
      maxPrice: 500000,
      maxPriceLimit: 500000,
      hotelTypes: [],
      rating: 0.0,
      
      // 정렬 옵션
      sortOption: '', // 기본값: 추천순
      
      // 데이터
      hotels: [],
      loading: false,
      loadingMore: false, // 추가 로딩 상태
      currentPage: 0, // 0부터 시작
      totalPages: 1,
      hasMoreData: true, // 더 많은 데이터가 있는지 확인
      
      // 페이지네이션 정보
      totalElements: 0,
      pageSize: 6, // 페이지 크기 명확하게 정의

      // API 기본 URL
      apiBaseUrl: process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080',

      // 즐겨찾기
      favorites: new Set(),
      
      // 스낵바
      showSnackbar: false,
      snackbarMessage: '',

      // 자동완성 관련 추가
      suggestions: [],
      showSuggestions: false,
      selectedSuggestionIndex: -1,
      suggestionTimeout: null,
      persistSuggestions: false, // 지속 표시 모드
      searchInProgress: false,
      manuallyDisabled: false, // 수동으로 비활성화된 상태
    }
  },
  computed: {
    sliderRangeStyle() {
      const minPercent = (this.minPrice / this.maxPriceLimit) * 100;
      const maxPercent = (this.maxPrice / this.maxPriceLimit) * 100;
      
      return {
        left: `${minPercent}%`,
        width: `${maxPercent - minPercent}%`
      };
    },

    minCheckOutDate() {
      // 체크인 날짜가 있으면 체크인 날짜 다음날을 최소값으로 설정
      if (this.checkIn) {
        const checkIn = new Date(this.checkIn);
        checkIn.setDate(checkIn.getDate() + 1);
        return checkIn.toISOString().split('T')[0];
      }
      // 체크인 날짜가 없으면 오늘 다음날을 최소값으로 설정
      return this.getTomorrowDate();
    }
  },
  async mounted() {
    // URL 쿼리 파라미터에서 검색 조건 로드
    this.loadFromQueryParams();
    // SessionStorage에서 검색 조건 복원
    this.loadFromStorage();
    
    // 찜 목록 불러오기 (완료 후 호텔 검색)
    await this.loadWishlist();
    
    // 페이지 로드 시 기본 검색 실행
    this.searchHotels();
    // 스크롤 이벤트 리스너 추가
    this.setupScrollListeners();
  },
  beforeUnmount() {
    // 컴포넌트 파괴 시 스크롤 이벤트 리스너 제거
    this.removeScrollListeners();
  },
  methods: {
    // 스크롤 이벤트 설정
    setupScrollListeners() {
      window.addEventListener('scroll', this.handleScroll, { passive: true });
    },

    // 스크롤 이벤트 제거
    removeScrollListeners() {
      window.removeEventListener('scroll', this.handleScroll);
    },

    // 자동완성 검색 (디바운싱)
    async onSearchInput(event) {
      if (this.searchInProgress || this.manuallyDisabled) return;

      // IME 조합 중인 값도 바로 가져오기
      const rawValue = event.target.value;
      console.log("현재 입력(원본):", rawValue);

      if (this.suggestionTimeout) {
        clearTimeout(this.suggestionTimeout);
      }

      this.suggestionTimeout = setTimeout(async () => {
        const query = rawValue.trim(); // API 호출 직전만 trim
        console.log("API 쿼리:", query);

        if (query.length === 0) {
          this.closeSuggestions();
          return;
        }
        await this.fetchSuggestions(query);
      }, 150);
    },

    // 자동완성 API 호출
    async fetchSuggestions(query) {
      try {
        const searchType = this.searchType === 'hotelName' ? 'hotel_name' : 'address';
        console.log('실제 API로 보내는 쿼리:', query); // <-- 여기에 로그 추가
        const response = await fetch(
          `${this.apiBaseUrl}/hotel/suggest?query=${encodeURIComponent(query)}&type=${searchType}&size=10`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // API 응답 구조에 맞게 수정
        if (data.status_code === 200 && data.result) {
          this.suggestions = data.result;
          this.showSuggestions = this.suggestions.length > 0;
          this.persistSuggestions = this.suggestions.length > 0; // 지속 표시 모드 활성화
          this.selectedSuggestionIndex = -1;
        } else {
          this.suggestions = [];
          this.showSuggestions = false;
          this.persistSuggestions = false;
        }
        
      } catch (error) {
        console.error('자동완성 요청 실패:', error);
        this.suggestions = [];
        this.showSuggestions = false;
        this.persistSuggestions = false;
      }
    },

    // 자동완성 항목 선택
    selectSuggestion(suggestion) {
      this.searchQuery = suggestion.text;
      this.closeSuggestions(); // 선택 후 닫기
    },

    // 자동완성 닫기 (버튼 클릭시)
    closeSuggestions() {
      this.showSuggestions = false;
      this.suggestions = [];
      this.selectedSuggestionIndex = -1;
      this.persistSuggestions = false;
      this.manuallyDisabled = true; // 수동으로 닫았을 때도 비활성화

      // 3초 후 재활성화
      setTimeout(() => {
        this.manuallyDisabled = false;
      }, 100);
    },

    // 자동완성 숨기기
    hideSuggestions() {
      this.showSuggestions = false;
      this.suggestions = [];
      this.selectedSuggestionIndex = -1;
    },

    // 키보드 네비게이션 (ESC 키 동작 변경)
    onSearchKeydown(event) {
      if (!this.showSuggestions || this.suggestions.length === 0) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          this.selectedSuggestionIndex = Math.min(
            this.selectedSuggestionIndex + 1,
            this.suggestions.length - 1
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          this.selectedSuggestionIndex = Math.max(this.selectedSuggestionIndex - 1, -1);
          break;
        case 'Enter':
          event.preventDefault();
          if (this.selectedSuggestionIndex >= 0) {
            this.selectSuggestion(this.suggestions[this.selectedSuggestionIndex]);
          } else {
            this.closeSuggestions();
            this.searchHotels();
          }
          break;
        case 'Escape':
          this.closeSuggestions(); // ESC로 닫기
          break;
      }
    },

    // 검색 타입 변경 시 자동완성 숨기기
    onSearchTypeChange() {
      this.closeSuggestions();
    },

    // input 포커스 시
    onSearchFocus() {
      if (this.manuallyDisabled) {
        return;
      }
      if (this.searchQuery.trim().length > 0 && this.suggestions.length > 0) {
        this.showSuggestions = true;
        this.persistSuggestions = true;
      }
    },

    // input blur 시 (약간의 딜레이를 두어 클릭 이벤트가 먼저 실행되도록)
    onSearchBlur() {
      if (!this.persistSuggestions) {
        setTimeout(() => {
          this.closeSuggestions();
        }, 200);
      }
    },

    // 호텔 카드 클릭 이벤트
    onHotelCardClick(hotel) {
      // 호텔 상세 페이지로 이동
      this.$router.push({
        path: `/hotel/detail/${hotel.id}`,
        query: {
          checkIn: this.checkIn,
          checkOut: this.checkOut,
          people: this.people
        }
      });
    },

    // 즐겨찾기 토글
    async toggleFavorite(hotelId) {
      // 로그인 상태 확인
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        this.showSnackbarMessage('찜 기능은 로그인 후 이용 가능합니다.');
        return;
      }

      try {
        // 현재 상태에 따라 다른 API 호출
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
          // API 호출 성공 시 로컬 상태 업데이트
          if (!this.favorites) {
            this.favorites = new Set();
          }
          
          if (isCurrentlyFavorited) {
            this.favorites.delete(hotelId);
            this.showSnackbarMessage('찜 목록에서 취소되었습니다.');
            console.log(`호텔 ${hotelId} 좋아요 취소`);
          } else {
            this.favorites.add(hotelId);
            this.showSnackbarMessage('찜 목록에 추가되었습니다.');
            console.log(`호텔 ${hotelId} 좋아요 추가`);
          }
          this.favorites = new Set(this.favorites);
        } else {
          // API 호출 실패 시 에러 처리
          const errorData = await response.json();
          console.error('좋아요 API 호출 실패:', errorData);
          this.showSnackbarMessage('좋아요 처리에 실패했습니다.');
        }
      } catch (error) {
        console.error('좋아요 API 호출 중 오류:', error);
        this.showSnackbarMessage('네트워크 오류가 발생했습니다.');
      }
    },



    // 가격 포맷
    formatPrice(price) {
      return `₩${price?.toLocaleString() || '0'}`;
    },


    // 무한 스크롤 처리
    handleScroll() {
      // 페이지 하단에 도달했는지 확인
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // 하단에서 200px 정도 전에 다음 페이지 로드
      if (scrollTop + windowHeight >= documentHeight - 200) {
        this.loadMoreHotels();
      }
    },

    // 더 많은 호텔 로드
    async loadMoreHotels() {
      // 이미 로딩 중이거나 더 이상 데이터가 없으면 리턴
      if (this.loadingMore || !this.hasMoreData || this.currentPage >= this.totalPages - 1) {
        console.log('로드 중단:', { 
          loadingMore: this.loadingMore, 
          hasMoreData: this.hasMoreData, 
          currentPage: this.currentPage, 
          totalPages: this.totalPages 
        });
        return;
      }

      console.log('더 많은 호텔 로드 시작, 현재 페이지:', this.currentPage);
      this.loadingMore = true;
      
      try {
        const nextPage = this.currentPage + 1;
        await this.loadHotelsPage(nextPage, false); // append 모드
      } catch (error) {
        console.error('추가 호텔 로딩 실패:', error);
      } finally {
        this.loadingMore = false;
      }
    },

    // 호텔 검색 (새로운 검색)
    async searchHotels() {
      console.log('새로운 검색 시작');
      this.manuallyDisabled = true; // 수동 비활성화 플래그 설정
      this.closeSuggestions();
      this.searchInProgress = true; // 검색 중 플래그 설정
      this.loading = true;

      // 새 검색 시 기존 데이터 초기화
      this.hotels = [];
      this.currentPage = 0;
      this.hasMoreData = true;
      
      try {
        await this.loadHotelsPage(0, true); // replace 모드
        this.saveToStorage(); // 검색 조건 저장
      } catch (error) {
        console.error('호텔 검색 실패:', error);
        this.hotels = [];
        this.totalPages = 1;
        this.totalElements = 0;
        this.hasMoreData = false;
      } finally {
        this.loading = false;
        this.searchInProgress = false; // 검색 완료 후 플래그 해제

        // 검색 완료 후 1초 뒤에 자동완성 재활성화
        setTimeout(() => {
          this.manuallyDisabled = false;
        }, 1000);
      }
    },

    // 특정 페이지의 호텔 로드
    async loadHotelsPage(pageNum, isReplace = false) {
      console.log('페이지 로드:', pageNum, 'replace:', isReplace);
      
      try {
        // API 호출 파라미터 구성
        const params = new URLSearchParams();
        
        // 기본 검색 파라미터 설정
        if (this.searchType === 'hotelName') {
          params.append('hotelName', this.searchQuery);
        } else {
          params.append('address', this.searchQuery);
        }
        params.append('checkIn', this.checkIn);
        params.append('checkOut', this.checkOut);
        params.append('people', this.people);
        params.append('page', pageNum); // 페이지 번호
        params.append('size', this.pageSize); // 페이지 크기
        
        // 필터 파라미터 추가
        params.append('minPrice', this.minPrice);
        params.append('maxPrice', this.maxPrice);
        
        // 숙소 유형 필터 (선택된 것들만 추가)
        if (this.hotelTypes.length > 0) {
          this.hotelTypes.forEach(type => {
            params.append('type', type);
          });
        }
        
        // 평점 필터
        if(this.rating != 0.0){
          params.append('rating', this.rating);
        }
        
        // 정렬 파라미터 추가
        if (this.sortOption) {
          params.append('sortOption', this.sortOption);
        }

        console.log('API 호출 파라미터:', params.toString());
        
        const url = `${this.apiBaseUrl}/hotel/list?${params.toString()}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // 필요한 경우 인증 헤더 추가
            // 'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API 응답 데이터:', data);
        
        if (data.result && data.result.content) {
          // API 응답 구조에 맞춰 데이터 매핑
          const newHotels = data.result.content.map(hotel => ({
            id: hotel.id,
            name: hotel.hotelName,
            location: hotel.address,
            rating: hotel.rating || 0.0,
            reviewCount: hotel.reviewCount || 0,
            price: hotel.price,
            image: hotel.image || '/api/placeholder/300/200',
            type: hotel.type
          }));
          
          console.log(`페이지 ${pageNum}: ${newHotels.length}개 호텔 로드됨`);
          
          // 데이터 업데이트
          if (isReplace || pageNum === 0) {
            this.hotels = newHotels;
          } else {
            // 중복 제거하고 추가
            const existingIds = new Set(this.hotels.map(hotel => hotel.id));
            const uniqueNewHotels = newHotels.filter(hotel => !existingIds.has(hotel.id));
            this.hotels = [...this.hotels, ...uniqueNewHotels];
            console.log(`중복 제거 후 ${uniqueNewHotels.length}개 호텔 추가됨`);
          }
          
          // 페이지네이션 정보 업데이트 - API 응답에서 받은 정보 사용
          this.currentPage = pageNum;
          this.totalPages = data.result.totalPages;
          // 새로운 검색(replace 모드)일 때는 totalElements를 교체, 무한스크롤일 때는 유지
          if (isReplace || pageNum === 0) {
            this.totalElements = data.result.totalElements;
          }
          this.hasMoreData = pageNum < data.result.totalPages - 1;
          
          console.log('업데이트 후 상태:', {
            currentPage: this.currentPage,
            totalPages: this.totalPages,
            totalElements: this.totalElements,
            hasMoreData: this.hasMoreData,
            현재호텔수: this.hotels.length
          });
          
        } else {
          throw new Error('API 응답 데이터 형식 오류');
        }
        
      } catch (error) {
        console.error('API 호출 실패:', error);
        
        // 에러 처리
        if (isReplace || pageNum === 0) {
          this.hotels = [];
          this.totalPages = 1;
          this.totalElements = 0;
          this.hasMoreData = false;
        }
        
        // 사용자에게 에러 메시지 표시 (선택사항)
        this.showErrorMessage('호텔 정보를 불러오는데 실패했습니다. 잠시 후 다시 시도해주세요.');
        
        throw error; // 에러를 다시 throw하여 상위에서 처리할 수 있도록 함
      }
    },

    // 에러 메시지 표시 메서드 (선택사항)
    showErrorMessage(message) {
      // 실제 프로젝트에서는 toast 알림이나 더 나은 UI를 사용
      console.error(message);
      // alert(message); // 간단한 알림
    },

    // URL 쿼리 파라미터 확인
    hasQueryParams() {
      const query = this.$route.query;
      return query.searchType || query.searchQuery || query.checkIn || query.checkOut || query.people;
    },

    // URL 쿼리 파라미터에서 검색 조건 로드
    loadFromQueryParams() {
      const query = this.$route.query;
      
      console.log('쿼리 파라미터:', query);
      
      // 쿼리 파라미터가 있으면 해당 값으로 설정
      if (query.searchType) {
        this.searchType = query.searchType;
      }
      
      if (query.searchQuery) {
        this.searchQuery = query.searchQuery;
      }
      
      if (query.checkIn) {
        // 날짜 유효성 검사
        const checkInDate = new Date(query.checkIn);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (checkInDate >= today) {
          this.checkIn = query.checkIn;
        }
      }
      
      if (query.checkOut) {
        // 날짜 유효성 검사
        const checkOutDate = new Date(query.checkOut);
        const checkInDate = new Date(this.checkIn);
        
        if (checkOutDate > checkInDate) {
          this.checkOut = query.checkOut;
        }
      }
      
      if (query.people) {
        const peopleNum = parseInt(query.people);
        if (peopleNum >= 1 && peopleNum <= 10) {
          this.people = peopleNum;
        }
      }
    },

    // SessionStorage에서 검색 조건 로드
    loadFromStorage() {
      try {
        const saved = sessionStorage.getItem('hotelSearch');
        if (saved) {
          const data = JSON.parse(saved);
          
          // 쿼리 파라미터가 없을 때만 저장된 값 사용
          if (!this.hasQueryParams()) {
            this.searchType = data.searchType || this.searchType;
            this.searchQuery = data.searchQuery || this.searchQuery;
            this.checkIn = data.checkIn || this.checkIn;
            this.checkOut = data.checkOut || this.checkOut;
            this.people = data.people || this.people;
          }
          
          // 필터는 항상 복원
          this.minPrice = data.minPrice || this.minPrice;
          this.maxPrice = data.maxPrice || this.maxPrice;
          this.hotelTypes = data.hotelTypes || [];
          this.rating = data.rating || 0;
          this.sortOption = data.sortOption || '';
        }
      } catch (error) {
        console.log('저장된 검색 조건이 없습니다.');
      }
    },

    // 데이터 저장하기
    saveToStorage() {
      try {
        const data = {
          searchType: this.searchType,
          searchQuery: this.searchQuery,
          checkIn: this.checkIn,
          checkOut: this.checkOut,
          people: this.people,
          minPrice: this.minPrice,
          maxPrice: this.maxPrice,
          hotelTypes: this.hotelTypes,
          rating: this.rating,
          sortOption: this.sortOption
        };
        
        sessionStorage.setItem('hotelSearch', JSON.stringify(data));
        console.log('검색 조건 저장됨');
      } catch (error) {
        console.log('검색 조건 저장 실패');
      }
    },

    // sessionStorage 삭제
    clearStorage() {
      sessionStorage.removeItem('hotelSearch');
    },

    getTodayDate() {
      return new Date().toISOString().split('T')[0];
    },
    
    getTomorrowDate() {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    },

     // 날짜 유효성 검사 메서드
    onCheckInDateChange() {
      // 체크인 날짜가 오늘보다 이전인 경우 오늘로 설정
      const today = this.getTodayDate();
      if (this.checkIn < today) {
        this.checkIn = today;
        this.showDateWarning('체크인 날짜는 오늘 이후로만 선택 가능합니다.');
        return;
      }
      
      // 체크아웃 날짜가 체크인 날짜보다 이전이거나 같은 경우 체크인 다음날로 자동 설정
      if (this.checkOut && this.checkOut <= this.checkIn) {
        const checkInDate = new Date(this.checkIn);
        checkInDate.setDate(checkInDate.getDate() + 1);
        this.checkOut = checkInDate.toISOString().split('T')[0];
        // this.showDateWarning('체크아웃 날짜가 체크인 다음날로 자동 조정되었습니다.');
      }
    },
    
    onCheckOutDateChange() {
      // 체크아웃 날짜가 체크인 날짜보다 이전이거나 같은 경우
      if (this.checkIn && this.checkOut <= this.checkIn) {
        const checkInDate = new Date(this.checkIn);
        checkInDate.setDate(checkInDate.getDate() + 1);
        this.checkOut = checkInDate.toISOString().split('T')[0];
        this.showDateWarning('체크아웃 날짜는 체크인 날짜 다음날부터 선택 가능합니다.');
      }
    },
    
    showDateWarning(message) {
      // 간단한 알림 표시 (실제로는 toast 알림이나 더 나은 UI를 사용할 수 있습니다)
      alert(message);
    },
    
    // 가격 범위 업데이트
    updatePriceRange() {
      // min이 max보다 큰 경우 조정
      if (this.minPrice > this.maxPrice) {
        this.minPrice = this.maxPrice;
      }
      // 필터 변경 시 새로운 검색 실행 (디바운싱 적용 고려)
      this.debouncedSearch();
    },
    
    // 가격 범위 유효성 검사
    validatePriceRange() {
      if (this.minPrice < 0) this.minPrice = 0;
      if (this.maxPrice > this.maxPriceLimit) this.maxPrice = this.maxPriceLimit;
      if (this.minPrice > this.maxPrice) this.minPrice = this.maxPrice;
      // 입력값 변경 시 새로운 검색 실행
      this.debouncedSearch();
    },

    // 디바운싱된 검색 (너무 많은 API 호출 방지)
    debouncedSearch() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.searchHotels();
      }, 300); // 300ms 후 검색 실행
    },
    
    // 숙소 유형 변경 시 재검색
    onHotelTypeChange() {
      this.searchHotels();
    },

    // 평점 변경 시 재검색
    ratingChange(score) {
      this.rating = this.rating === score ? 0 : score;
      this.searchHotels();
    },
    
    // 정렬 옵션 변경 시 재검색
    onSortChange() {
      this.searchHotels();
    },
    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    },

    // 스낵바 메시지 표시
    showSnackbarMessage(message) {
      this.snackbarMessage = message;
      this.showSnackbar = true;
      
      // 3초 후 자동으로 숨김
      setTimeout(() => {
        this.hideSnackbar();
      }, 3000);
    },

    // 스낵바 숨김
    hideSnackbar() {
      this.showSnackbar = false;
    },

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
          console.log('찜 목록 로드됨:', this.favorites);
        } else {
          console.error('찜 목록 로드 실패:', response.status);
        }
      } catch (error) {
        console.error('찜 목록 로드 중 오류:', error);
      }
    },

    // 찜 목록 불러오기 (비동기)
    async loadWishlistAsync() {
      await this.loadWishlist();
    }
  }
}
</script>

<style scoped>
.hotel-search-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 검색창 카드 */
.search-card {
  background: white;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 20px 0 24px 0;  /* 상단 여백 20px 추가 */
  overflow: hidden;
}

/* 검색 영역 */
.search-section {
  background: white;
  padding: 20px 24px;  /* 상하 패딩을 20px로 줄임 */
  border-radius: 12px;
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 12px;  /* 16px에서 12px로 줄임 */
}

.form-row {
  display: flex;
  gap: 12px;  /* 16px에서 12px로 줄임 */
  align-items: center;  /* end에서 center로 변경하여 높이 통일 */
}

.form-group {
  display: flex;
  flex-direction: column;
}

.flex-1 {
  flex: 1;
}

.guests-group {
  width: 80px;
}

.date-group {
  width: 140px;
}

/* 컴팩트한 날짜 입력 필드 */
.date-input-compact {
  padding: 8px 10px;
  height: 40px;
  font-size: 14px;
}

/* 컴팩트한 인원 입력 필드 */
.guests-input-compact {
  padding: 8px 10px;
  height: 40px;
  font-size: 14px;
  text-align: center;
}

.location-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.inline-select {
  width: 120px;
  flex-shrink: 0;
}

.inline-input {
  flex: 1;
}

.form-select {
  padding: 8px 30px 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 14px;
  cursor: pointer;
  position: relative;
  appearance: none; /* 기본 브라우저 스타일 제거 */
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 8px center;
  background-repeat: no-repeat;
  background-size: 16px;
}

.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.search-button-group {
  display: flex;
  align-items: end;
}

.search-button {
  padding: 8px 32px;
  background-color: #111827;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-button:hover {
  background-color: #374151;
}

.search-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.main-content {
  display: flex;
  gap: 30px;
  align-items: flex-start;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
}

.filter-section {
  background: white;
  padding: 20px;
  border-radius: 2px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
}

.filter-section h3 {
  margin: 0 0 25px 0;
  font-size: 20px;
  color: #333;
  font-weight: 600;
}

.filter-group {
  margin-bottom: 30px;
}

.filter-group h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: #495057;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  cursor: pointer;
  padding: 5px 0;
  transition: color 0.2s ease;
}

.checkbox-group label:hover {
  color: #111827;
  font-weight: 600;
}

.checkbox-group input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #111827;  /* 체크박스 체크 시 검정색 */
}

.hotel-list {
  flex: 1;
  min-width: 0;
}

.loading, .no-results {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  color: #666;
  font-size: 16px;
}

/* 무한 스크롤 관련 스타일 */
.loading-more {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.no-more-data {
  text-align: center;
  padding: 20px;
  margin-top: 20px;
  color: #999;
  font-size: 14px;
  border-top: 1px solid #e5e5e5;
}

/* 검색 결과 헤더 스타일 */
.results-header {
  display: flex;
  justify-content: space-between;  /* 좌우 양쪽 끝에 배치 */
  align-items: center;     /* 핵심: 같은 라인에 딱 맞춤 */
  padding: 8px 20px 10px;  /* 아래 패딩 줄여서 구분선 ↑ */
  margin-bottom: 10px;     /* 구분선과 리스트 간 간격도 살짝 줄임 */
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.search-info {
  font-size: 15px;
  line-height: 32px;       /* 셀렉트 높이와 맞춤 */
  color: #666;
  font-weight: 500;
  margin: 0;               /* 혹시 모를 마진 제거 */
}

.sort-section {
  display: flex;
  align-items: center;
  gap: 10px;
}



.sort-select {
  height: 32px;
  line-height: 32px;
  padding: 0 28px 0 10px;   /* 오른쪽 패딩 늘려서 화살표와 겹치지 않게 */
  border: none;
  border-radius: 0;
  background-color: transparent;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-size: 14px;
  background-position: right 8px center; /* 화살표 위치 조정 */
  font-size: 14px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  width: auto;               /* 고정 너비 제거 */
  min-width: auto;           /* 최소 너비 제거 */
  transition: all 0.2s ease;
}

.sort-select:focus {
  outline: none;
}

/* 호텔 그리드 - 2열로 수정 */
.hotel-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 25px;
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

.hotel-card .hotel-image-wrapper {
  border-radius: 12px 12px 0 0;  /* 위쪽만 radius 적용, 아래쪽은 0 */
  overflow: hidden;
}

.hotel-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.hotel-content {
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 12px;  /* 16px에서 12px로 줄여서 여백 감소 */
}

/* 호텔 이미지 */
.hotel-image-wrapper {
  position: relative;
  width: calc(100% + 32px);
  height: 250px;
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
  gap: 8px;  /* 12px에서 8px로 줄여서 여백 감소 */
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
  font-size: 20px;
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
  white-space: nowrap;        /* 1라인으로 제한 */
  overflow: hidden;           /* 넘치는 텍스트 숨김 */
  text-overflow: ellipsis;    /* 넘치는 텍스트를 ...으로 표시 */
  max-width: 100%;            /* 최대 너비 제한 */
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
  margin: 0;  /* 위아래 여백 제거 */
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 16px;
  color: #d1d5db;
}

.star.filled {
  color: #facc15;
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

.price-section {
  text-align: right;
  margin: 0;
  align-self: center;
}

.price {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.price-unit {
  font-size: 14px;
  color: #6b7280;
}

.distance-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #10b981;
  font-size: 14px;
  font-weight: 500;
}

.distance-icon {
  width: 14px;
  height: 14px;
  fill: currentColor;
}



/* 호텔 액션 */
.hotel-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0;  /* 8px에서 0으로 변경하여 아래 여백 제거 */
}



/* 가격 슬라이더 스타일 */
.price-slider-wrapper {
  position: relative;
  height: 40px;
  margin: 20px 0;
}

.slider-track {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 4px;
  background-color: #e9ecef;
  border-radius: 2px;
  transform: translateY(-50%);
}

.slider-range {
  position: absolute;
  height: 100%;
  background: #111827;
  border-radius: 2px;
  transition: all 0.15s ease;
}

.price-slider {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  width: 100%;
  height: 40px;
  background: transparent;
  pointer-events: none;
  transform: translateY(-50%);
  -webkit-appearance: none;
  appearance: none;
}

.price-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #ffffff;
  border: 2px solid #111827;
  border-radius: 50%;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.3);
  transition: all 0.15s ease;
}

.price-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(17, 24, 39, 0.4);
}

.price-slider::-webkit-slider-thumb:active {
  transform: scale(0.95);
}

.max-slider::-webkit-slider-thumb {
  border-color: #111827;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.3);
}

.max-slider::-webkit-slider-thumb:hover {
  box-shadow: 0 4px 12px rgba(17, 24, 39, 0.4);
}

/* Firefox 슬라이더 스타일 */
.price-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #ffffff;
  border: 2px solid #111827;
  border-radius: 50%;
  cursor: pointer;
  pointer-events: auto;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.3);
  transition: all 0.15s ease;
}

.price-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.price-input-group {
  display: flex;
  align-items: center;
  gap: 5px;
}

.price-input {
  width: 80px;
  padding: 5px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}

.price-input:focus {
  outline: none;
  border-color: #007bff;
}

.price-unit {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.price-separator {
  color: #666;
  font-size: 12px;
}

/* 반응형 디자인 */
@media (max-width: 1200px) {
  .hotel-search-container {
    max-width: 100%;
    padding: 15px;
  }
  
  .sidebar {
    width: 250px;
  }
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
    gap: 20px;
  }
  
  .sidebar {
    width: 100%;
    position: static;
    max-height: none;
  }
  
  .search-container {
    flex-direction: column;
    height: auto;
  }
  
  .search-input-container,
  .date-container,
  .people-container {
    border-right: none;
    border-bottom: 1px solid #e5e5e5;
  }
  
  .search-input-container {
    height: 50px;
  }
  
  .date-container {
    flex-direction: column;
  }
  
  .date-input-wrapper {
    border-right: none;
    border-bottom: 1px solid #e5e5e5;
  }
  
  .date-input-wrapper:last-child {
    border-bottom: 1px solid #e5e5e5;
    border-right: none;
  }
  
  .date-input {
    height: 50px;
    width: 100%;
  }
  
  .people-input {
    height: 50px;
    width: 100%;
    text-align: left;
  }
  
  .search-button {
    height: 50px;
    width: 100%;
  }
  
  .hotel-grid {
    grid-template-columns: 1fr;
  }
  
  .info-row {
    grid-template-columns: 1fr;
    align-items: start;
  }
  
  .price-section {
    text-align: left;
    margin-top: 6px;
  }
  
  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 16px;    /* 살짝 줄인 패딩 */
    margin-bottom: 12px;
  }
  
  .search-info {
    line-height: 24px;     /* 모바일은 줄높이 조정 */
  }
  
  .sort-section {
    align-self: flex-start;
    margin-top: 0;
  }
  
  .sort-select {
    height: 28px;
    line-height: 28px;
  }
}

@media (max-width: 480px) {
  .hotel-search-container {
    padding: 10px;
  }
  
  .filter-section {
    padding: 15px;
  }
  
  .results-header {
    padding: 15px;
  }
  
  .sort-select {
    min-width: 100px;
    font-size: 13px;
    padding: 6px 10px;
  }
  
  .search-type-select {
    min-width: 80px;
    padding-right: 30px;
  }
  
  .date-input {
    font-size: 14px;
  }
  
  .people-input {
    font-size: 14px;
  }
  
  .search-button {
    font-size: 14px;
  }
}

/* 추가 개선 사항 */
.search-input-container:hover,
.date-input-wrapper:hover,
.people-container:hover {
  background-color: #f8f9fa;
}

.search-input-container:focus-within,
.date-input-wrapper:focus-within,
.people-container:focus-within {
  background-color: #f0f7ff;
  box-shadow: inset 0 0 0 1px #007bff;
}

.main-search-input:focus,
.date-input:focus,
.people-input:focus {
  outline: none;
}

/* 접근성 개선 */
@media (prefers-reduced-motion: reduce) {
  .hotel-card,
  .search-button,
  .price-slider::-webkit-slider-thumb,
  .slider-range {
    transition: none;
  }
}

.scrollToTop{ 
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: #111;
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
  z-index: 100;
}
.scrollToTop:hover{ 
  background: #333;
  transform: translateY(-3px);
  box-shadow: 0 6px 25px rgba(0,0,0,0.2);
}

/* 스낵바 스타일 */
.snackbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: #6b7280;
  color: white;
  padding: 0;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  opacity: 0;
  transition: all 0.3s ease;
}

.snackbar.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.snackbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  min-width: 300px;
}

.snackbar-message {
  font-size: 14px;
  font-weight: 500;
  margin: 0;
}

.snackbar-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  margin-left: 12px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.snackbar-close:hover {
  background: rgba(255, 255, 255, 0.1);
}

/* 자동완성 드롭다운 스타일 - <style scoped> 안에 추가 */
.input-wrappers {
  position: relative;
  flex: 1;
  z-index: 100;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  overflow: hidden; /* 헤더와 콘텐츠 영역 분리를 위해 */
}

/* 자동완성 헤더 (닫기 버튼 포함) */
.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.suggestions-title {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

.close-suggestions-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.15s ease;
}

.close-suggestions-btn:hover {
  background-color: #e5e7eb;
  color: #374151;
}

/* 자동완성 콘텐츠 영역 */
.suggestions-content {
  max-height: 180px; /* 헤더 공간 고려해서 줄임 */
  overflow-y: auto;
}

.suggestion-item {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.15s ease;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.selected {
  background-color: #f0f9ff;
}

.suggestion-text {
  font-size: 14px;
  color: #374151;
}

.suggestion-text mark {
  background-color: #fef3c7;
  color: #92400e;
  padding: 1px 2px;
  border-radius: 2px;
  font-weight: 500;
}

/* 검색창 컨테이너의 overflow 설정 */
.search-card {
  background: white;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin: 20px 0 24px 0;
  overflow: visible;
  position: relative;
}

.search-section {
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  overflow: visible;
  position: relative;
}

.form-row {
  display: flex;
  gap: 12px;
  align-items: center;
  overflow: visible;
  position: relative;
}

.location-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
  position: relative;
  z-index: 50;
}

/* input focus 시 border-radius 조정 */
.form-input.inline-input:focus {
  border-radius: 6px 6px 0 0;
  position: relative;
  z-index: 100;
}

.form-input.inline-input:focus + .suggestions-dropdown {
  border-top: 1px solid #3b82f6;
}

/* 자동완성이 표시될 때 input의 하단 border radius 제거 */
.input-wrapper:has(.suggestions-dropdown) .form-input.inline-input {
  border-radius: 6px 6px 0 0;
}

/* 스크롤바 스타일링 */
.suggestions-content::-webkit-scrollbar {
  width: 6px;
}

.suggestions-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.suggestions-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.suggestions-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>