<template>
  <div class="hotel-search-container">
    <div class="left-panel">
      <!-- 검색창 카드 -->
      <div class="search-card">
        <div class="search-section">
          <div class="search-form">
          <div class="form-row">
            <div class="form-group flex-1">
              <div class="location-input-group">
                <select v-model="searchType" @change="onSearchTypeChange" class="form-select inline-select">
                  <option value="location">내 위치</option>
                  <option value="subway">지하철역</option>
                </select>
                <div class="input-wrapper">
                  <input
                    type="text"
                    :placeholder="searchType === 'location' ? '현재 위치 사용' : '지하철역을 입력하세요 (예: 강남역)'"
                    v-model="searchInput"
                    @input="onSubwayInputChange"
                    :disabled="searchType === 'location'"
                    :class="['form-input inline-input', { 'disabled': searchType === 'location' }]"
                  />
                  <div v-if="isSearching" class="loading-spinner">
                    <div class="spinner"></div>
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
                v-model.number="guests"
                class="form-input guests-input-compact"
                @change="onGuestsChange"
                placeholder="인원"
              />
            </div>
            <div class="search-button-group">
              <button @click="handleSearch" class="search-button" :disabled="isSearching">
                {{ isSearching ? '검색중...' : '검색' }}
              </button>
            </div>
          </div>
          
          <div v-if="searchMessage" class="search-message" :class="searchMessageType">
            {{ searchMessage }}
          </div>
        </div>
      </div>
      </div>

      <!-- 호텔리스트 카드 -->
      <div class="hotel-list-card">
        <div class="hotel-list-section" ref="hotelListContainer">
        <div v-if="isInitialLoading || isSearching" class="loading-container">
          <div class="loading-content">
            <div class="loading-spinner-large">
              <div class="spinner-large"></div>
            </div>
            <h3 class="loading-title">호텔을 검색하고 있습니다</h3>
            <p class="loading-subtitle">잠시만 기다려주세요...</p>
          </div>
        </div>

        <div v-else class="hotel-grid">
          <div 
            v-for="hotel in hotels" 
            :key="hotel.id"
            class="hotel-card"
            @click="onHotelCardClick(hotel)"
            @mouseenter="onHotelCardHover(hotel)"
            @mouseleave="onHotelCardLeave(hotel)"
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
                        <span class="reviews-text">({{ hotel.reviews }})</span>
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
                
                <!-- 상세정보 버튼 (호버 시에만 표시) -->
                <div class="detail-button-wrapper">
                  <button 
                    class="detail-button" 
                    @click="goToHotelDetail(hotel.id)"
                    title="상세정보 보기"
                  >
                    <span class="detail-text">상세정보</span>
                    <svg class="arrow-icon" viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                  </button>
                </div>
                
                <div class="hotel-actions">
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="isLoadingMore && hasMoreHotels" class="loading-more">
            <div class="spinner-small"></div>
            <p>호텔을 더 불러오는 중...</p>
          </div>
          
          <div v-if="!hasMoreHotels && !isInitialLoading && hotels.length > 0" class="end-of-list">
            <p>더 이상 호텔이 없습니다.</p>
          </div>
        </div>

        <div v-if="!isInitialLoading && !isSearching && hotels.length === 0" class="no-results">
          <div class="no-results-content">
            <svg class="no-results-icon" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <h3 class="no-results-title">검색 결과가 없습니다</h3>
            <p class="no-results-subtitle">다른 조건으로 다시 검색해보세요</p>
          </div>
        </div>
      </div>
      </div>
    </div>

    <div class="right-panel">
      <KakaoMapComponent
        :lat="mapLat"
        :lng="mapLng"
        :level="4"
        :hotels="mapHotels"
        class="kakao-map"
        ref="kakaoMap"
        @hotel-marker-click="onMapHotelClick"
      />
    </div>
    
    <!-- 스낵바 -->
    <div v-if="showSnackbar" class="snackbar" :class="{ 'show': showSnackbar }">
      <div class="snackbar-content">
        <span class="snackbar-message">{{ snackbarMessage }}</span>
        <button @click="hideSnackbar" class="snackbar-close">×</button>
      </div>
    </div>
  </div>
</template>

<script>
import KakaoMapComponent from './KakaoMapComponent.vue';
import axios from 'axios';

export default {
  name: 'HotelSearchSystem',
  components: {
    KakaoMapComponent
  },
  
  // Vue Router 가드 - 다른 페이지로 이동할 때 실행
  beforeRouteLeave(to, from, next) {
    // HotelDetail 페이지가 아닌 곳으로 이동하면 sessionStorage에서 검색 조건 삭제
    if (!to.path.includes('/hotel/detail')) {
      this.clearSearchStorage();
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
      searchType: 'location',
      searchInput: '',
      checkIn: formatDate(today),      // 오늘 날짜
      checkOut: formatDate(tomorrow),  // 내일 날짜
      guests: 2,
      favorites: new Set(),
      mapLat: 37.5665,
      mapLng: 126.9780,
      currentLocation: null,
      
      // 스낵바 관련
      showSnackbar: false,
      snackbarMessage: '',
      
      // 검색 관련 상태
      isSearching: false,
      isInitialLoading: true,  // 초기 로딩 상태 추가
      searchMessage: '',
      searchMessageType: 'info',
      searchTimer: null,
      
      // 페이지네이션 관련
      currentPage: 0,
      totalPages: 0,
      totalElements: 0,
      hasMoreHotels: false,
      
      // API 로딩 상태
      isLoadingMore: false,
      
      // 더미 데이터 제거 - 빈 배열로 시작
      hotels: []
    };
  },

  computed: {
    // 지도에 전달할 호텔 데이터 (좌표 정보가 있는 것만)
    mapHotels() {
      return this.hotels.filter(hotel => 
        hotel.lat !== null && 
        hotel.lng !== null && 
        !isNaN(hotel.lat) && 
        !isNaN(hotel.lng) &&
        hotel.lat !== 0 &&
        hotel.lng !== 0
      );
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
    // 페이지 로드 시 저장된 검색 조건 복원
    this.loadSearchFromStorage();
    
    this.getCurrentLocation();
    
    // 찜 목록 불러오기
    await this.loadWishlist();
    
    // axios 기본 설정
    axios.defaults.timeout = 10000;
    axios.defaults.headers.common['Accept'] = 'application/json';
    
    // 페이지 로드 시 자동 검색 실행
    this.performInitialSearch();
    
    // 무한 스크롤 이벤트 리스너 추가
    if (this.$refs.hotelListContainer) {
      this.$refs.hotelListContainer.addEventListener('scroll', this.handleScroll);
    }
  },
  
  // 컴포넌트가 파괴될 때 이벤트 리스너 제거
  beforeUnmount() {
    if (this.$refs.hotelListContainer) {
      this.$refs.hotelListContainer.removeEventListener('scroll', this.handleScroll);
    }
    
    // 검색 타이머 정리
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  },
  
  methods: {
    // ========== 메시지 표시 관련 메서드 ==========
    
    // 검색 메시지 표시
    showSearchMessage(message, type = 'info', duration = 3000) {
      this.searchMessage = message;
      this.searchMessageType = type;
      
      if (duration > 0) {
        setTimeout(() => {
          this.searchMessage = '';
        }, duration);
      }
    },

    // 날짜 관련 경고 메시지
    showDateWarning(message) {
      this.showSearchMessage(message, 'warning', 5000);
    },

    // ========== 무한 스크롤 관련 메서드 ==========
    handleScroll() {
      const container = this.$refs.hotelListContainer;
      if (!container) return;
      
      // 스크롤이 컨테이너 하단에 도달했는지 확인
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 1; // 1px 여유
      
      if (isAtBottom && !this.isLoadingMore && this.hasMoreHotels) {
        this.loadMoreHotels();
      }
    },
    
    async loadMoreHotels() {
      this.isLoadingMore = true;
      try {
        let searchLat = this.mapLat;
        let searchLng = this.mapLng;
        
        const params = {
          latitude: searchLat,
          longitude: searchLng,
          checkIn: this.checkIn,
          checkOut: this.checkOut,
          people: this.guests,
          // 다음 페이지를 요청하도록 currentPage를 증가시킵니다.
          page: this.currentPage + 1,
          size: 4
        };

        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/hotel/nearby`, { params });
        
        if (response.data && response.data.result && response.data.result.content) {
          const newHotels = response.data.result.content;
          // 기존 호텔 리스트에 새로운 호텔들을 추가
          this.hotels = this.hotels.concat(newHotels.map(hotel => ({
            id: hotel.id,
            name: hotel.hotelName,
            location: hotel.address,
            rating: hotel.rating || 0.0,
            reviews: hotel.reviewCount || 0,
            price: hotel.price,
            lat: parseFloat(hotel.latitude) || null,
            lng: parseFloat(hotel.longitude) || null,
            image: hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop&crop=center',
            distance: hotel.distance
          })));

          // API 응답의 페이지 번호로 현재 페이지를 업데이트합니다.
          this.currentPage = response.data.result.number;
          this.totalPages = response.data.result.totalPages || 0;
          this.totalElements = response.data.result.totalElements || 0;
          this.hasMoreHotels = !response.data.result.last;
        }

      } catch (error) {
        console.error('호텔 추가 로드 API 오류:', error);
        this.showSearchMessage('호텔 추가 로드 중 오류가 발생했습니다.', 'error');
      } finally {
        this.isLoadingMore = false;
      }
    },
    
    // ========== 호텔 상세 페이지 이동 ==========
    
    // 호텔 상세 페이지로 이동
    goToHotelDetail(hotelId) {
      this.saveSearchToStorage();
      this.$router.push({
        path: `/hotel/detail/${hotelId}`,
        query: {
          checkIn: this.checkIn,
          checkOut: this.checkOut,
          people: this.guests
        }
      });
    },
    
    // ========== SessionStorage 관련 메서드 ==========
    
    // SessionStorage에서 검색 조건 로드
    loadSearchFromStorage() {
      try {
        const saved = sessionStorage.getItem('hotelSearchConditions');
        if (saved) {
          const data = JSON.parse(saved);
          
          // 저장된 데이터로 검색 조건 복원
          this.searchType = data.searchType || this.searchType;
          this.searchInput = data.searchInput || this.searchInput;
          this.checkIn = data.checkIn || this.checkIn;
          this.checkOut = data.checkOut || this.checkOut;
          this.guests = data.guests || this.guests;
          this.mapLat = data.mapLat || this.mapLat;
          this.mapLng = data.mapLng || this.mapLng;
          
          console.log('저장된 검색 조건을 복원했습니다:', data);
        }
      } catch (error) {
        console.log('저장된 검색 조건이 없습니다:', error);
      }
    },

    // SessionStorage에 검색 조건 저장
    saveSearchToStorage() {
      try {
        const searchData = {
          searchType: this.searchType,
          searchInput: this.searchInput,
          checkIn: this.checkIn,
          checkOut: this.checkOut,
          guests: this.guests,
          mapLat: this.mapLat,
          mapLng: this.mapLng,
          timestamp: new Date().getTime() // 저장 시간 기록
        };
        
        sessionStorage.setItem('hotelSearchConditions', JSON.stringify(searchData));
        console.log('검색 조건을 저장했습니다:', searchData);
      } catch (error) {
        console.error('검색 조건 저장 실패:', error);
      }
    },

    // SessionStorage에서 검색 조건 삭제
    clearSearchStorage() {
      try {
        sessionStorage.removeItem('hotelSearchConditions');
        console.log('검색 조건을 삭제했습니다.');
      } catch (error) {
        console.error('검색 조건 삭제 실패:', error);
      }
    },
    
    // ========== 검색 조건 변경 감지 메서드 ==========
    
    // 체크인 날짜 변경 시
    onCheckInDateChange() {
      // 날짜 유효성 검사
      const today = this.getTodayDate();
      if (this.checkIn < today) {
        this.checkIn = today;
        this.showDateWarning('체크인 날짜는 오늘 이후로만 선택 가능합니다.');
        return;
      }
      
      // 체크아웃 날짜 자동 조정
      if (this.checkOut && this.checkOut <= this.checkIn) {
        const checkInDate = new Date(this.checkIn);
        checkInDate.setDate(checkInDate.getDate() + 1);
        this.checkOut = checkInDate.toISOString().split('T')[0];
        this.showDateWarning('체크아웃 날짜가 체크인 다음날로 자동 조정되었습니다.');
      }
      
      // 변경된 조건 저장
      this.saveSearchToStorage();
    },
    
    // 체크아웃 날짜 변경 시
    onCheckOutDateChange() {
      if (this.checkIn && this.checkOut <= this.checkIn) {
        const checkInDate = new Date(this.checkIn);
        checkInDate.setDate(checkInDate.getDate() + 1);
        this.checkOut = checkInDate.toISOString().split('T')[0];
        this.showDateWarning('체크아웃 날짜는 체크인 날짜 다음날부터 선택 가능합니다.');
      }
      
      // 변경된 조건 저장
      this.saveSearchToStorage();
    },
    
    // 인원수 변경 시
    onGuestsChange() {
      if (this.guests < 1) {
        this.guests = 1;
      }
      // 변경된 조건 저장
      this.saveSearchToStorage();
    },
    
    // 검색 타입 변경 시
    onSearchTypeChange() {
      if (this.searchType === 'location') {
        this.searchInput = '';
        this.searchMessage = '';
      } else if (this.searchType === 'subway') {
        this.searchMessage = '';
      }
      
      // 변경된 조건 저장
      this.saveSearchToStorage();
    },

    // ========== 기본 유틸리티 메서드 ==========
    
    // 현재 위치 가져오기
    getCurrentLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.currentLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            if (this.searchType === 'location') {
              this.mapLat = this.currentLocation.lat;
              this.mapLng = this.currentLocation.lng;
            }
            console.log('현재 위치:', this.currentLocation);
          },
          (error) => {
            console.error('위치 정보를 가져올 수 없습니다:', error);
            this.currentLocation = {
              lat: 37.5665,
              lng: 126.9780
            };
            if (this.searchType === 'location') {
              this.mapLat = 37.5665;
              this.mapLng = 126.9780;
            }
          }
        );
      }
    },

    getTodayDate() {
      return new Date().toISOString().split('T')[0];
    },
    
    getTomorrowDate() {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    },

    // ========== 검색 관련 메서드 ==========

    async performInitialSearch() {
      let attempts = 0;
      const maxAttempts = 2; 
      
      while (attempts < maxAttempts && !this.currentLocation) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (this.currentLocation) {
        setTimeout(() => {
          this.handleSearch();
        }, 500);
      } else {
        setTimeout(() => {
          this.handleSearch();
        }, 1000);
      }
    },

    // 지하철역 검색
    async searchSubwayStation() {
      if (this.searchType !== 'subway' || !this.searchInput.trim()) {
        return;
      }

      const query = this.searchInput.trim();
      this.isSearching = true;
      this.showSearchMessage('지하철역을 검색중입니다...', 'info', 0);
      
      try {
        const coordinates = await this.geocodeSubwayStation(query);
        if (coordinates) {
          this.mapLat = coordinates.lat;
          this.mapLng = coordinates.lng;
          this.showSearchMessage(`${query} 위치를 찾았습니다!`, 'success');
          // 지도 위치 변경 시 저장
          this.saveSearchToStorage();
          
          // 지도 컴포넌트에 위치 업데이트 알림
          if (this.$refs.kakaoMap) {
            this.$nextTick(() => {
              this.$refs.kakaoMap.focusTo(this.mapLat, this.mapLng, 4);
            });
          }
        } else {
          this.showSearchMessage('해당 지하철역을 찾을 수 없습니다. 정확한 역명을 입력해주세요.', 'error');
        }
      } catch (error) {
        console.error('지하철역 검색 중 오류 발생:', error);
        this.showSearchMessage('지하철역 검색 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
      } finally {
        this.isSearching = false;
      }
    },

    async geocodeSubwayStation(stationName) {
      return new Promise((resolve, reject) => {
        // 카카오맵 API 로드 확인
        if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
          console.error('카카오맵 API가 로드되지 않았습니다.');
          reject(new Error('카카오맵 API가 로드되지 않았습니다.'));
          return;
        }

        const geocoder = new window.kakao.maps.services.Places();
        const searchQueries = this.generateSearchQueries(stationName);
        
        console.log('검색 쿼리들:', searchQueries);
        this.tryGeocode(geocoder, searchQueries, 0, resolve, reject);
      });
    },

    generateSearchQueries(stationName) {
      const cleanName = stationName.replace(/역$/, '');
      return [
        `${cleanName}역`,
        `지하철 ${cleanName}역`,
        `서울지하철 ${cleanName}역`,
        `${cleanName}역 지하철`,
        `${cleanName} 지하철역`,
        `${cleanName}역 서울`,
        `수도권전철 ${cleanName}역`,
        cleanName // 역명만으로도 검색
      ];
    },

    tryGeocode(geocoder, queries, index, resolve, reject) {
      if (index >= queries.length) {
        console.log('모든 검색 쿼리 시도 완료, 결과 없음');
        resolve(null);
        return;
      }

      const query = queries[index];
      console.log(`검색 시도 [${index + 1}/${queries.length}]:`, query);
      
      geocoder.keywordSearch(query, (result, status) => {
        console.log(`검색 결과 [${query}]:`, { status, resultCount: result?.length });
        
        if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
          console.log('검색 결과 상세:', result.slice(0, 3)); // 처음 3개 결과만 로그
          
          const stationResult = this.filterSubwayStationResults(result);
          if (stationResult) {
            console.log('선택된 지하철역:', stationResult);
            resolve({
              lat: parseFloat(stationResult.y),
              lng: parseFloat(stationResult.x),
              name: stationResult.place_name,
              address: stationResult.address_name
            });
            return;
          }
        }
        
        // 다음 쿼리로 시도
        setTimeout(() => {
          this.tryGeocode(geocoder, queries, index + 1, resolve, reject);
        }, 100); // 100ms 지연으로 API 호출 제한 방지
      });
    },

    filterSubwayStationResults(results) {
      // 1순위: 지하철역 관련 카테고리나 키워드가 있는 결과
      const stationKeywords = ['지하철', '역', '전철', '철도', 'SW8', 'SW1']; // SW8, SW1은 카카오맵 지하철역 카테고리 코드
      
      // 카테고리 코드로 필터링
      let stationResults = results.filter(result => {
        const categoryCode = result.category_group_code;
        const categoryName = result.category_name || '';
        
        // 지하철역 카테고리 코드 확인
        if (categoryCode === 'SW8' || categoryName.includes('지하철')) {
          return true;
        }
        
        // 장소명이나 주소에 지하철 관련 키워드 포함 확인
        const placeName = (result.place_name || '').toLowerCase();
        const addressName = (result.address_name || '').toLowerCase();
        const fullText = `${placeName} ${addressName}`;
        
        return stationKeywords.some(keyword => fullText.includes(keyword.toLowerCase()));
      });

      // 지하철역 결과가 있으면 첫 번째 반환
      if (stationResults.length > 0) {
        return stationResults[0];
      }

      // 2순위: 이름에 '역'이 포함된 결과
      stationResults = results.filter(result => {
        const placeName = (result.place_name || '').toLowerCase();
        return placeName.includes('역');
      });

      if (stationResults.length > 0) {
        return stationResults[0];
      }

      // 3순위: 첫 번째 결과
      return results.length > 0 ? results[0] : null;
    },

    // API를 통해 근처 호텔 검색
    async handleSearch() {
      try {
        // 지하철역 검색 타입이고 입력값이 있으면 먼저 지하철역 검색
        if (this.searchType === 'subway' && this.searchInput.trim()) {
          await this.searchSubwayStation();
          // 지하철역 검색이 완료된 후 호텔 검색 진행
        }
        
        // 검색 시작 시 초기 페이지 번호와 기존 호텔 리스트 초기화
        this.currentPage = 0;
        this.hotels = [];
        
        this.isSearching = true;
        this.isInitialLoading = true; // 초기 로딩 상태로 변경
        this.showSearchMessage('근처 호텔을 검색중입니다...', 'info', 0);

        let searchLat = this.mapLat;
        let searchLng = this.mapLng;
        
        // 위치 타입이고 현재 위치가 있으면 현재 위치 사용
        if (this.searchType === 'location' && this.currentLocation) {
          searchLat = this.currentLocation.lat;
          searchLng = this.currentLocation.lng;
          this.mapLat = searchLat;
          this.mapLng = searchLng;
        }

        const params = {
          // 매개변수를 사용하지 않고, data 속성의 값을 직접 사용합니다.
          latitude: searchLat,
          longitude: searchLng,
          checkIn: this.checkIn,
          checkOut: this.checkOut,
          people: this.guests,
          page: 0,
          size: 4
        };

        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/hotel/nearby`, {
          params: params,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.data && response.data.result && response.data.result.content) {
          const hotelData = response.data.result.content;
          
          this.hotels = hotelData.map(hotel => ({
            id: hotel.id,
            name: hotel.hotelName,
            location: hotel.address,
            rating: hotel.rating || 0.0,
            reviews: hotel.reviewCount || 0,
            price: hotel.price,
            lat: parseFloat(hotel.latitude) || null,
            lng: parseFloat(hotel.longitude) || null,
            image: hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop&crop=center',
            distance: hotel.distance
          }));

          // API 응답의 페이지 번호로 현재 페이지를 업데이트합니다.
          this.currentPage = response.data.result.number || 0;
          this.totalPages = response.data.result.totalPages || 0;
          this.totalElements = response.data.result.totalElements || 0;
          this.hasMoreHotels = !response.data.result.last;

          this.showSearchMessage(`${this.totalElements}개의 호텔을 찾았습니다!`, 'success');
          
          // 검색 성공 시 조건 저장
          this.saveSearchToStorage();
        } else {
          this.showSearchMessage('검색 결과가 없습니다.', 'warning');
          this.hotels = [];
        }
      } catch (error) {
        console.error('호텔 검색 API 오류:', error);
        this.showSearchMessage('호텔 검색 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
        this.hotels = [];
      } finally {
        this.isSearching = false;
        this.isInitialLoading = false;
      }
    },

    // ========== 이벤트 핸들러 메서드 ==========

    // 호텔 카드 클릭 이벤트
    onHotelCardClick(hotel) {
      if (hotel.lat && hotel.lng) {
        this.mapLat = hotel.lat;
        this.mapLng = hotel.lng;
        // 지도 위치 변경 시 저장
        this.saveSearchToStorage();
        
        // ✅ 자식 메서드를 통해 "같은 좌표여도" 항상 이동
        this.$nextTick(() => {
          this.$refs.kakaoMap?.focusTo(hotel.lat, hotel.lng, 4);
        });
      }
      console.log('호텔 카드 클릭:', hotel);
    },

    // 지도에서 호텔 마커 클릭 이벤트
    onMapHotelClick(hotel) {
      console.log('지도 호텔 마커 클릭:', hotel);
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

    // 스낵바 메시지 표시
    showSnackbarMessage(message) {
      this.snackbarMessage = message;
      this.showSnackbar = true;
      setTimeout(() => {
        this.hideSnackbar();
      }, 3000);
    },

    // 스낵바 숨김
    hideSnackbar() {
      this.showSnackbar = false;
    },

    // 즐겨찾기 토글
    async toggleFavorite(hotelId) {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        this.showSnackbarMessage('찜 기능은 로그인 후 이용 가능합니다.');
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
            this.showSnackbarMessage('찜 목록에서 취소되었습니다.');
            console.log(`호텔 ${hotelId} 좋아요 취소`);
          } else {
            this.favorites.add(hotelId);
            this.showSnackbarMessage('찜 목록에 추가되었습니다.');
            console.log(`호텔 ${hotelId} 좋아요 추가`);
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

    // ========== 유틸리티 메서드 ==========

    // 가격 포맷
    formatPrice(price) {
      return `₩${price.toLocaleString()}`;
    },


    // 호텔 카드에 마우스 올렸을 때 - 해당 마커 크기 확대
    onHotelCardHover(hotel) {
      console.log('호텔 카드 호버:', hotel.name);
      if (this.$refs.kakaoMap && this.$refs.kakaoMap.highlightHotelMarker) {
        this.$refs.kakaoMap.highlightHotelMarker(hotel.id, true);
      }
    },

    // 호텔 카드에서 마우스 벗어났을 때 - 마커 크기 원래대로
    onHotelCardLeave(hotel) {
      console.log('호텔 카드 리브:', hotel.name);
      if (this.$refs.kakaoMap && this.$refs.kakaoMap.highlightHotelMarker) {
        this.$refs.kakaoMap.highlightHotelMarker(hotel.id, false);
      }
    }
  }
};
</script>

<style scoped>
.hotel-search-container {
  display: flex;
  height: 100vh;
  background-color: #f9fafb;
  padding: 0 20px;
  gap: 20px;
}

/* 좌측 패널 */
.left-panel {
  width: 60%;
  display: flex;
  flex-direction: column;
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

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
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

.input-wrapper {
  position: relative;
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

.form-input.disabled {
  background-color: #f3f4f6;
  color: #6b7280;
}

/* 날짜 입력 스타일 개선 */
.date-input-wrapper {
  position: relative;
  width: 100%;
}

.date-input {
  width: 100% !important;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  min-height: 40px;
}

.date-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

/* 달력 아이콘을 전체 영역으로 확장 */
.date-input::-webkit-calendar-picker-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

/* 날짜 텍스트 영역 스타일 */
.date-input::-webkit-datetime-edit {
  width: 100%;
  padding: 0;
  color: #374151;
}

.date-input::-webkit-datetime-edit-fields-wrapper {
  padding: 0;
}

/* 달력 아이콘을 우측에 표시 */
.date-input-wrapper::after {
  content: '📅';
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 14px;
  opacity: 0.7;
}

/* Firefox 브라우저 지원 */
@-moz-document url-prefix() {
  .date-input {
    padding-right: 40px;
  }
  
  .date-input-wrapper::after {
    content: '📅';
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }
}

.search-button-group {
  display: flex;
  align-items: end;
}

.search-button {
  padding: 8px 24px;
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

/* 로딩 스피너 */
.loading-spinner {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 검색 메시지 */
.search-message {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  margin-top: 8px;
}

.search-message.info {
  background-color: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.search-message.success {
  background-color: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.search-message.error {
  background-color: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.search-message.warning {
  background-color: #fef3c7;
  color: #d97706;
  border: 1px solid #fde68a;
}

/* 호텔리스트 카드 */
.hotel-list-card {
  background: white;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 200px); /* 화면 높이에서 검색창과 여백 제외 */
}

/* 호텔 리스트 영역 */
.hotel-list-section {
  flex: 1;
  overflow-y: auto;
  background: white;
  padding: 24px;
  position: relative;
  min-height: 0; /* flexbox 스크롤을 위한 필수 설정 */
}

/* 로딩 컨테이너 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
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
  border-top: 4px solid #000000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
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
  height: 100%;
  min-height: 400px;
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

.hotel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

/* 구분 점 스타일 */
.dot-sep {
  color: #9ca3af;
  line-height: 1;
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

/* 상세정보 버튼 (호버 시에만 표시) */
.detail-button-wrapper {
  position: absolute;
  bottom: 16px;  /* 가격/박 아래에 배치 */
  right: 16px;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
}

.detail-button {
  width: auto;
  height: 32px;
  padding: 0 12px;
  background: rgba(0, 0, 0, 0.8);
  border: none;
  border-radius: 16px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
  white-space: nowrap;
}

.detail-button:hover {
  background: rgba(0, 0, 0, 0.9);
  transform: scale(1.05);
}

.arrow-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.detail-text {
  font-size: 12px;
  color: white;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
}

/* 호텔 카드에 호버 시 상세정보 버튼 표시 */
.hotel-card:hover .detail-button-wrapper {
  opacity: 1;
}

/* 호텔 액션 */
.hotel-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 0;  /* 8px에서 0으로 변경하여 아래 여백 제거 */
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

.book-button {
  padding: 12px 20px;
  background-color: #111827;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
}

.book-button:hover {
  background-color: #374151;
}

/* 우측 패널 (지도) */
.right-panel {
  width: 40%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.kakao-map {
  width: 100%;
  height: 100%;
}

/* 반응형 디자인 */
@media (max-width: 1200px) {
  .hotel-search-container {
    flex-direction: column;
    height: auto;
  }
  
  .left-panel {
    width: 100%;
  }
  
  .right-panel {
    width: 100%;
    height: 400px;
  }
}

@media (max-width: 768px) {
  .hotel-search-container {
    padding: 0 16px;
    gap: 16px;
  }
  
  .search-card {
    margin-bottom: 16px;
  }
  
  .search-section {
    padding: 16px 20px;  /* 상하 패딩을 16px로 줄임 */
  }
  
  .form-row {
    flex-direction: column;
    gap: 10px;  /* 12px에서 10px로 줄임 */
  }
  
  .location-input-group {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .inline-select {
    width: 100%;
  }
  
  .hotel-grid {
    grid-template-columns: 1fr;
  }
  
  .hotel-list-card {
    margin-bottom: 16px;
  }
  
  .hotel-content {
    flex-direction: column;
    padding: 12px;
  }
  
  .hotel-image-wrapper {
    width: calc(100% + 24px);
    height: 250px;
    margin: -12px -12px 0 -12px;
  }

  .detail-button-wrapper {
    bottom: 12px;
    right: 12px;
  }

  .detail-button {
    width: auto;
    height: 28px;
    padding: 0 10px;
  }

  .arrow-icon {
    width: 14px;
    height: 14px;
  }

  .detail-text {
    font-size: 11px;
  }
  
  .hotel-actions {
    justify-content: flex-start;
  }

  .info-row {
    grid-template-columns: 1fr; /* 모바일에서는 줄바꿈 */
    align-items: start;
  }

  .meta-left {
    gap: 6px;  /* 모바일에서는 간격을 더 줄임 */
  }

  .price-section {
    text-align: left;
    margin-top: 6px;
  }

  .loading-container {
    min-height: 300px;
  }

  .no-results {
    min-height: 300px;
  }
}

@media (max-width: 480px) {
  .hotel-name {
    font-size: 18px;
  }
  
  .price {
    font-size: 20px;
  }
  
  .book-button {
    padding: 8px 16px;
    font-size: 14px;
  }

  .loading-title {
    font-size: 18px;
  }

  .loading-subtitle {
    font-size: 14px;
  }

  .no-results-title {
    font-size: 18px;
  }

  .no-results-subtitle {
    font-size: 14px;
  }
}

.loading-more, .end-of-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #6b7280;
  font-size: 14px;
  text-align: center;
}

.spinner-small {
  width: 24px;
  height: 24px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

/* 스낵바 스타일 */
.snackbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: #6b7280; /* 옅은 회색 */
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
  padding: 12px 16px;
  gap: 8px;
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
  background-color: rgba(255, 255, 255, 0.1);
}

</style>