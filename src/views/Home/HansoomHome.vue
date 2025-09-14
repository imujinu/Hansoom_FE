<template>
  <div id="wrap" class="main tht">
    <!-- Header -->
    <!-- 
    <header class="header">
      <a href="#" class="logo" aria-label="HANSOOM">
        <span class="thtBi">HANSOOM</span>
      </a>
      <nav class="gnb" aria-label="global">
        <a href="#" class="menu-item">숙소</a>
        <a href="#" class="menu-item">인기지역</a>
        <a href="#" class="menu-item">예약내역</a>
        <a href="#" class="menu-item">내 주변</a>
        <a href="#" class="menu-item">마이페이지</a>
      </nav>
      <div class="utill">
        <div class="btn">
          <a href="#" class="notification icon" aria-label="알림">
            <i class="fas fa-bell"></i>
            <span class="notification-badge">3</span>
          </a>
          <a href="#" class="wishlist icon" aria-label="찜">
            <i class="fas fa-heart"></i>
          </a>
          <a href="#" class="mypage icon" aria-label="마이페이지">
            <i class="fas fa-user"></i>
          </a>
        </div>
      </div>
    </header>
    -->

    <!-- Main Visual (Video Background) -->
    <section class="mainVisual">
      <div class="visualArea">
        <div class="visual">
          <div class="roll video on">
            <video ref="bgVideo" autoplay muted playsinline preload="auto" class="bgVideo" poster="">
              <source :src="currentVideoSrc" type="video/mp4" />
              <p>비디오를 지원하지 않는 브라우저입니다.</p>
            </video>
          </div>
          
          <!-- 호텔 검색창 (동영상 위에 오버레이) -->
          <div class="searchOverlay">
            <div class="searchTagline">
              <span>Discover Your Perfect Stay</span>
            </div>
            <div class="searchContainer">
              <div class="searchForm">
                <!-- 검색 조건 섹션 -->
                <div class="search-section">
                  <div class="search-filters">
                    <!-- 검색 타입 선택 -->
                    <div class="filter-item">
                      <select v-model="searchType" class="search-select">
                        <option value="hotelName">호텔명</option>
                        <option value="address">지역명</option>
                      </select>
                    </div>

                    <!-- 검색어 입력 -->
                    <div class="filter-item search-input-container">
                      <input 
                        v-model="searchQuery" 
                        :placeholder="searchType === 'hotelName' ? '호텔명 입력' : '지역명 입력'"
                        class="search-input"
                        @input="onSearchInput"
                        @keydown="onSearchKeydown"
                        @focus="onSearchFocus"
                        @blur="onSearchBlur"
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

                    <!-- 체크인 날짜 -->
                    <div class="filter-item">
                      <input
                        type="date"
                        class="date-input"
                        placeholder="체크인"
                        :min="getTodayDate()"
                        v-model="checkIn"
                        @click="$event.target.showPicker()"
                        @change="onCheckInDateChange"
                      />
                    </div>

                    <!-- 체크아웃 날짜 -->
                    <div class="filter-item">
                      <input 
                        type="date" 
                        class="date-input"
                        placeholder="체크아웃"
                        v-model="checkOut" 
                        :min="minCheckOutDate()"
                        @click="$event.target.showPicker()"
                        @change="onCheckOutDateChange"
                      />
                    </div>

                    <!-- 인원수 -->
                    <div class="filter-item">
                      <input 
                        type="number"
                        min="1"
                        max="10"
                        v-model.number="people"
                        placeholder="인원"
                        class="people-input"
                      />
                    </div>

                    <!-- 검색 버튼 -->
                    <div class="filter-item search-btn-container">
                      <button class="search-btn" @click="searchHotel">
                        검색
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- decorative frame & indicator (static) -->
          <div class="frame">
            <p class="rec" aria-hidden="true" />
            
            <!-- 액자 프레임 오버레이 -->
            <div class="videoFrame">
              <!-- 모서리 장식 -->
              <div class="corner corner-topLeft"></div>
              <div class="corner corner-topRight"></div>
              <div class="corner corner-bottomLeft"></div>
              <div class="corner corner-bottomRight"></div>
              
              <!-- REC 녹화 표시 (오른쪽 위) -->
              <div class="recIndicator">
                <div class="recDot"></div>
                <span class="recText">REC</span>
              </div>
            </div>
            
            <div class="indiBox" aria-hidden="true">
              <div class="pageIndi">
                <span class="current">{{ String(currentVideoIndex + 1).padStart(2, '0') }}</span>
                <span class="separator">/</span>
                <span class="all">06</span>
              </div>
              <div class="control">
                <button class="prev" aria-label="이전" @click="playPreviousVideo">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button class="pause" aria-label="일시정지" @click="togglePlayPause">
                  <i :class="isPlaying ? 'fas fa-pause' : 'fas fa-play'"></i>
                </button>
                <button class="next" aria-label="다음" @click="playNextVideo">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
              <div class="progressBar">
                <div class="progressFill" :style="{ width: videoProgress + '%' }"></div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </section>

    <!-- 이벤트 & 호텔 섹션 -->
    <section class="contentSection">
      <!-- 이벤트 배너 -->
      <div class="eventBanner">
        <div class="eventContent">
          <h2>Special Offers</h2>
          <p>한정 시간 특가 할인</p>
          <div class="eventGrid">
            <div class="eventCard">
              <div class="eventImage">
                <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop" alt="호텔 특가" />
              </div>
              <div class="eventInfo">
                <h3>프리미엄 호텔 30% 할인</h3>
                <p>2025.01.01 - 2025.01.31</p>
                <span class="discount">30% OFF</span>
              </div>
            </div>
            <div class="eventCard">
              <div class="eventImage">
                <img src="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop" alt="리조트 특가" />
              </div>
              <div class="eventInfo">
                <h3>리조트 패키지 20% 할인</h3>
                <p>2025.01.01 - 2025.01.31</p>
                <span class="discount">20% OFF</span>
              </div>
            </div>
            <div class="eventCard">
              <div class="eventImage">
                <img src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop" alt="펜션 특가" />
              </div>
              <div class="eventInfo">
                <h3>펜션 예약 15% 할인</h3>
                <p>2025.01.01 - 2025.01.31</p>
                <span class="discount">15% OFF</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 인기 호텔 섹션 -->
              <div class="popularHotels">
          <div class="sectionHeader">
            <h2>Popular Hotels</h2>
            <p>고객들이 가장 많이 찾는 프리미엄 호텔</p>
          </div>
        <div class="hotelScrollWrapper">
          <button class="scroll-btn scroll-left" @click="scrollLeft" aria-label="이전 호텔">
            <i class="fas fa-chevron-left"></i>
          </button>
          <div class="hotelScrollContainer" ref="scrollContainer">
            <!-- 로딩 상태 -->
            <div v-if="loadingHotels" class="loading-hotels">
              <div class="loading-spinner"></div>
              <p>인기 호텔을 불러오는 중...</p>
            </div>
            <!-- 호텔 카드들 -->
            <PopularHotelCard
              v-for="(h, i) in hotels"
              :key="h.id"
              :rank="i + 1"
              :img="h.img"
              :title="h.title"
              :price="h.price"
              :rating="h.rating"
              :reviews="h.reviews"
              @click="() => router.push(`/hotel/detail/${h.id}`)"
            />
            <!-- 호텔이 없는 경우 -->
            <div v-if="!loadingHotels && hotels.length === 0" class="no-hotels">
              <p>인기 호텔이 없습니다.</p>
            </div>
          </div>
          <button class="scroll-btn scroll-right" @click="scrollRight" aria-label="다음 호텔">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- 추천 지역 섹션 -->
              <div class="recommendedAreas">
          <div class="sectionHeader">
            <h2>Travel Spots</h2>
            <p>여행하기 좋은 인기 지역을 만나보세요</p>
          </div>
        <div class="areaGrid">
          <div class="areaCard" @click="recommend('제주도')">
            <img src="https://eunduk-board-bucket.s3.ap-northeast-2.amazonaws.com/spot/spot_jeju.jpg" alt="제주도" />
            <div class="areaOverlay">
              <h3>제주도</h3>
              <p>자연과 문화가 공존하는 아름다운 섬</p>
            </div>
          </div>
          <div class="areaCard busan-card" @click="recommend('부산')">
            <img src="https://eunduk-board-bucket.s3.ap-northeast-2.amazonaws.com/spot/spot_busan.jpg" alt="부산" />
            <div class="areaOverlay">
              <h3>부산</h3>
              <p>바다와 도시가 만나는 활기찬 항구도시</p>
            </div>
          </div>
          <div class="areaCard" @click="recommend('경주')">
            <img src="https://eunduk-board-bucket.s3.ap-northeast-2.amazonaws.com/spot/spot_kuengju.jpg" alt="경주" />
            <div class="areaOverlay">
              <h3>경주</h3>
              <p>천년의 역사가 살아있는 문화도시</p>
            </div>
          </div>
          <div class="areaCard" @click="recommend('전주')">
            <img src="https://eunduk-board-bucket.s3.ap-northeast-2.amazonaws.com/spot/spot_jeonju.jpg" alt="전주" />
            <div class="areaOverlay">
              <h3>전주</h3>
              <p>한옥과 전통음식의 고장</p>
            </div>
          </div>
          <div class="areaCard" @click="recommend('서울')">
            <img src="https://eunduk-board-bucket.s3.ap-northeast-2.amazonaws.com/spot/spot_seoul.jpg" alt="서울" />
            <div class="areaOverlay">
              <h3>서울</h3>
              <p>대한민국의 수도</p>
            </div>
          </div>
          <div class="areaCard" @click="recommend('강원도')">
            <img src="https://eunduk-board-bucket.s3.ap-northeast-2.amazonaws.com/spot/spot_kangwon.jpg" alt="강원도" />
            <div class="areaOverlay">
              <h3>강원도</h3>
              <p>산과 바다가 어우러진 자연의 보고</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 스낵바 -->
    <div v-if="showSnackbar" class="snackbar" :class="{ 'show': showSnackbar }">
      <div class="snackbar-content">
        <span class="snackbar-message">{{ snackbarMessage }}</span>
        <button @click="hideSnackbar" class="snackbar-close">×</button>
      </div>
    </div>

    <!-- Scroll to Top Button -->
    <button class="scrollToTop" @click="scrollToTop" aria-label="맨 위로 가기">
      <i class="fas fa-chevron-up"></i>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router';
import PopularHotelCard from '@/components/PopularHotelCard.vue';
import axios from 'axios';

const router = useRouter();

// 날짜 관련 함수들
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
}

const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
}

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

// 검색 관련 변수들
const today = new Date();
const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 1);

const searchType = ref('address');
const searchQuery = ref('');
const checkIn = ref(formatDate(today));      // 오늘 날짜
const checkOut = ref(formatDate(tomorrow));  // 내일 날짜
const people = ref(2);

// 체크아웃 최소 날짜 계산 함수
const minCheckOutDate = () => {
  if (checkIn.value) {
    const checkInDate = new Date(checkIn.value);
    checkInDate.setDate(checkInDate.getDate() + 1);
    return checkInDate.toISOString().split('T')[0];
  }
  return getTomorrowDate();
};

// 날짜 유효성 검사 메서드
const onCheckInDateChange = () => {
  // 체크인 날짜가 오늘보다 이전인 경우 오늘로 설정
  const today = getTodayDate();
  if (checkIn.value < today) {
    checkIn.value = today;
    showDateWarning('체크인 날짜는 오늘 이후로만 선택 가능합니다.');
    return;
  }
  
  // 체크아웃 날짜가 체크인 날짜보다 이전이거나 같은 경우 체크인 다음날로 자동 설정
  if (checkOut.value && checkOut.value <= checkIn.value) {
    const checkInDate = new Date(checkIn.value);
    checkInDate.setDate(checkInDate.getDate() + 1);
    checkOut.value = checkInDate.toISOString().split('T')[0];
    //showDateWarning('체크아웃 날짜가 체크인 다음날로 자동 조정되었습니다.');
  }
};

const onCheckOutDateChange = () => {
  // 체크아웃 날짜가 체크인 날짜보다 이전이거나 같은 경우
  if (checkIn.value && checkOut.value <= checkIn.value) {
    const checkInDate = new Date(checkIn.value);
    checkInDate.setDate(checkInDate.getDate() + 1);
    checkOut.value = checkInDate.toISOString().split('T')[0];
    showDateWarning('체크아웃 날짜는 체크인 날짜 다음날부터 선택 가능합니다.');
  }
};

const showDateWarning = (message) => {
  // 간단한 알림 표시 (실제로는 toast 알림이나 더 나은 UI를 사용할 수 있습니다)
  alert(message);
};

// --- 자동완성 기능 관련 변수 추가 ---
const suggestions = ref([]);
const showSuggestions = ref(false);
const selectedSuggestionIndex = ref(-1);
const suggestionTimeout = ref(null);
const persistSuggestions = ref(false);
const searchInProgress = ref(false);
const manuallyDisabled = ref(false);
const apiBaseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080';

// --- 자동완성 기능 관련 함수 추가 ---

// 자동완성 검색 (디바운싱)
const onSearchInput = (event) => {
  if (searchInProgress.value || manuallyDisabled.value) return;

  const rawValue = event.target.value;

  if (suggestionTimeout.value) {
    clearTimeout(suggestionTimeout.value);
  }
  console.log(rawValue);

  suggestionTimeout.value = setTimeout(async () => {
    const query = rawValue.trim();

    if (query.length === 0) {
      closeSuggestions();
      return;
    }
    await fetchSuggestions(query);
  }, 150);
};

// 자동완성 API 호출
const fetchSuggestions = async (query) => {
  try {
    const searchTypeForApi = searchType.value === 'hotelName' ? 'hotel_name' : 'address';
    const response = await fetch(
      `${apiBaseUrl}/hotel/suggest?query=${encodeURIComponent(query)}&type=${searchTypeForApi}&size=10`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
    
    if (data.status_code === 200 && data.result) {
      suggestions.value = data.result;
      showSuggestions.value = suggestions.value.length > 0;
      persistSuggestions.value = suggestions.value.length > 0;
      selectedSuggestionIndex.value = -1;
    } else {
      suggestions.value = [];
      showSuggestions.value = false;
      persistSuggestions.value = false;
    }
    console.log(suggestions.value)
    console.log(showSuggestions.value)
  } catch (error) {
    console.error('자동완성 요청 실패:', error);
    suggestions.value = [];
    showSuggestions.value = false;
    persistSuggestions.value = false;
  }
};

// 자동완성 항목 선택
const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion.text;
  closeSuggestions();
};

// 자동완성 닫기
const closeSuggestions = () => {
  showSuggestions.value = false;
  suggestions.value = [];
  selectedSuggestionIndex.value = -1;
  persistSuggestions.value = false;
  manuallyDisabled.value = true;
  setTimeout(() => {
    manuallyDisabled.value = false;
  }, 100);
};

// 키보드 네비게이션
const onSearchKeydown = (event) => {
  if (!showSuggestions.value || suggestions.value.length === 0) return;
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      selectedSuggestionIndex.value = Math.min(
        selectedSuggestionIndex.value + 1,
        suggestions.value.length - 1
      );
      break;
    case 'ArrowUp':
      event.preventDefault();
      selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, -1);
      break;
    case 'Enter':
      event.preventDefault();
      if (selectedSuggestionIndex.value >= 0) {
        selectSuggestion(suggestions.value[selectedSuggestionIndex.value]);
      } else {
        closeSuggestions();
        searchHotel();
      }
      break;
    case 'Escape':
      closeSuggestions();
      break;
  }
};

// input 포커스 시
const onSearchFocus = () => {
  if (manuallyDisabled.value) {
    return;
  }
  if (searchQuery.value.trim().length > 0 && suggestions.value.length > 0) {
    showSuggestions.value = true;
    persistSuggestions.value = true;
  }
};

// input blur 시 (약간의 딜레이를 두어 클릭 이벤트가 먼저 실행되도록)
const onSearchBlur = () => {
  if (!persistSuggestions.value) {
    setTimeout(() => {
      closeSuggestions();
    }, 200);
  }
};

// `searchType` 변경을 감지하고 자동완성 숨기기
watch(searchType, () => {
  closeSuggestions();
});

// 호텔 데이터
const hotels = ref([]);
const loadingHotels = ref(false);

// 인기 호텔 데이터 로드
const loadPopularHotels = async () => {
  loadingHotels.value = true;
  try {
    // 인기 호텔을 가져오기 위한 API 호출
    const params = new URLSearchParams();
    params.append('checkIn', formatDate(today));
    params.append('checkOut', formatDate(tomorrow));
    params.append('people', '2');
    
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/hotel/popular?${params.toString()}`);
    if (response.data && response.data.result) {
      const hotelData = response.data.result;
      
      // eslint-disable-next-line no-unused-vars
      hotels.value = hotelData.map((hotel, index) => ({
        id: hotel.id,
        img: hotel.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&h=1200&fit=crop',
        title: hotel.hotelName,
        price: `₩${hotel.price?.toLocaleString() || '0'}~`,
        rating: hotel.rating || 0.0,
        reviews: hotel.reviewCount || 0
      }));
    }
  } catch (error) {
    console.error('인기 호텔 로드 실패:', error);
    // 에러 시 빈 배열로 설정
    hotels.value = [];
  } finally {
    loadingHotels.value = false;
  }
};

const recommend = (alt) => {
  const query = {
    searchType: 'address',
    searchQuery: alt,
  };
  
  router.push({
    path: '/hotel/search',
    query: query
  });
};

const showSnackbar = ref(false);
const snackbarMessage = ref('');

// 스낵바 메시지 표시
const showSnackbarMessage = (message) => {
  snackbarMessage.value = message;
  showSnackbar.value = true;
  
  // 3초 후 자동으로 숨김
  setTimeout(() => {
    hideSnackbar();
  }, 3000);
};

// 스낵바 숨김
const hideSnackbar = () => {
  showSnackbar.value = false;
};

// 호텔 검색 함수
const searchHotel = () => {
  if(!searchQuery.value) {
    showSnackbarMessage("검색어를 입력해주세요");
    return ;
  }
  console.log('호텔 검색 실행:', {
    searchType: searchType.value,
    searchQuery: searchQuery.value,
    checkIn: checkIn.value,
    checkOut: checkOut.value,
    people: people.value
  });
  // 여기에 실제 검색 로직을 구현할 수 있습니다
  const query = {
    searchType: searchType.value,
    searchQuery: searchQuery.value,
    checkIn: checkIn.value,
    checkOut: checkOut.value,
    people: people.value
  };
  
  router.push({
    path: '/hotel/search',
    query: query
  });
};

// 동영상 관련 변수들
const bgVideo = ref(null)
const currentVideoIndex = ref(0)
const videoList = [
  'https://eunduk-board-bucket.s3.ap-northeast-2.amazonaws.com/hansoom_home_videos/home_video_1.mp4',
  'https://eunduk-board-bucket.s3.ap-northeast-2.amazonaws.com/hansoom_home_videos/home_video_2.mp4',
  'https://eunduk-board-bucket.s3.ap-northeast-2.amazonaws.com/hansoom_home_videos/home_video_3.mp4',
  'https://eunduk-board-bucket.s3.ap-northeast-2.amazonaws.com/hansoom_home_videos/home_video_4.mp4',
  'https://eunduk-board-bucket.s3.ap-northeast-2.amazonaws.com/hansoom_home_videos/home_video_5.mp4',
  'https://eunduk-board-bucket.s3.ap-northeast-2.amazonaws.com/hansoom_home_videos/home_video_6.mp4',
]

// 현재 동영상 소스
const currentVideoSrc = ref(videoList[0])

// 비디오 진행도 (0-100%)
const videoProgress = ref(0)

// 재생/일시정지 상태
const isPlaying = ref(true)

// 이전 동영상으로 전환하는 함수
const playPreviousVideo = () => {
  console.log('이전 동영상 버튼 클릭됨')
  currentVideoIndex.value = (currentVideoIndex.value - 1 + videoList.length) % videoList.length
  currentVideoSrc.value = videoList[currentVideoIndex.value]
  videoProgress.value = 0
  
  console.log('이전 동영상 인덱스:', currentVideoIndex.value, '소스:', currentVideoSrc.value)
  
  // 비디오 로드 후 재생
  if (bgVideo.value) {
    bgVideo.value.load()
    bgVideo.value.play().catch(e => {
      console.log('이전 비디오 재생 실패:', e)
    })
    isPlaying.value = true
  } else {
    console.log('bgVideo.value가 null입니다')
  }
}

// 다음 동영상으로 전환하는 함수
const playNextVideo = () => {
  console.log('다음 동영상 버튼 클릭됨')
  currentVideoIndex.value = (currentVideoIndex.value + 1) % videoList.length
  currentVideoSrc.value = videoList[currentVideoIndex.value]
  videoProgress.value = 0
  
  console.log('다음 동영상 인덱스:', currentVideoIndex.value, '소스:', currentVideoSrc.value)
  
  // 비디오 로드 후 재생
  if (bgVideo.value) {
    bgVideo.value.load()
    bgVideo.value.play().catch(e => {
      console.log('다음 비디오 재생 실패:', e)
    })
    isPlaying.value = true
  } else {
    console.log('bgVideo.value가 null입니다')
  }
}

// 재생/일시정지 토글 함수
const togglePlayPause = () => {
  console.log('재생/일시정지 버튼 클릭됨, 현재 상태:', isPlaying.value)
  
  if (bgVideo.value) {
    if (isPlaying.value) {
      bgVideo.value.pause()
      isPlaying.value = false
      console.log('비디오 일시정지됨')
    } else {
      bgVideo.value.play()
      isPlaying.value = true
      console.log('비디오 재생됨')
    }
  } else {
    console.log('bgVideo.value가 null입니다')
  }
}

// 비디오 진행도 업데이트 함수 (동적 기준)
const updateVideoProgress = () => {
  if (bgVideo.value) {
    // 영상이 10초보다 짧으면 전체 길이 기준, 길면 10초 기준으로 진행도 계산
    const maxDuration = bgVideo.value.duration > 10 ? 10 : bgVideo.value.duration
    const progress = (bgVideo.value.currentTime / maxDuration) * 100
    videoProgress.value = Math.min(Math.round(progress), 100)
  }
}

onMounted(() => {
  // 인기 호텔 데이터 로드
  loadPopularHotels();
  
  // nextTick을 사용하여 DOM이 완전히 렌더링된 후 실행
  nextTick(() => {
    const video = bgVideo.value
    
    console.log('현재 비디오 소스:', currentVideoSrc.value)
    console.log('비디오 요소:', video)
    
    if (video) {
      // 비디오 로드 이벤트 리스너 추가
      video.addEventListener('loadeddata', () => {
        console.log('비디오 로드 완료:', video.src)
        video.play().catch(e => {
          console.log('비디오 자동재생 실패:', e)
        })
      })
      
      // 비디오 오류 이벤트 리스너 추가
      video.addEventListener('error', (e) => {
        console.log('비디오 로드 오류:', e)
      })
      
      // 비디오 종료 시 다음 동영상 재생
      video.addEventListener('ended', playNextVideo)
      
      // 10초마다 다음 동영상으로 전환하는 이벤트 리스너 (긴 영상만)
      video.addEventListener('timeupdate', () => {
        // 영상이 10초보다 길고, 현재 시간이 10초 이상일 때만 전환
        if (video.duration > 10 && video.currentTime >= 10) {
          console.log('10초 경과, 다음 동영상으로 전환')
          playNextVideo()
        }
      })
      
      // 비디오 진행도 업데이트 (100ms마다)
      setInterval(updateVideoProgress, 100)
    }
  })
  
  // 스크롤 이벤트 리스너 추가
  window.addEventListener('scroll', handleScroll)
})

// 스크롤 이벤트 핸들러
const handleScroll = () => {
  const header = document.querySelector('.header')
  if (header) {
    const scrollY = window.scrollY
    const videoHeight = window.innerHeight // 동영상 높이
    
    if (scrollY > videoHeight * 0.3) {
      // 동영상 영역을 벗어나면 헤더를 진하게
      header.classList.add('scrolled')
    } else {
      // 동영상 영역에 있으면 헤더를 투명하게
      header.classList.remove('scrolled')
    }
  }
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// 스크롤 컨테이너 참조
const scrollContainer = ref(null)

// 왼쪽으로 스크롤
const scrollLeft = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({
      left: -300,
      behavior: 'smooth'
    })
  }
}

// 오른쪽으로 스크롤
const scrollRight = () => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollBy({
      left: 300,
      behavior: 'smooth'
    })
  }
}
</script>

<style scoped>
/* ----- Base / Reset-ish ----- */
.tht, .tht * { box-sizing: border-box; }
img { max-width: 100%; display: block; }
a { text-decoration: none; color: inherit; }
button { background: none; border: 0; cursor: pointer; }
:root {
  --max: 1180px;
  --black: #111;
  --text: #222;
  --mute: #666;
  --line: #e9e9ec;
  --brand: #111;
}

/* ----- Header ----- */
.header{ 
  position:fixed; 
  inset:0 0 auto 0; 
  height:72px; 
  display:flex; 
  align-items:center; 
  justify-content: space-between;
  padding:0 28px; 
  z-index:10; 
  color:#fff; 
}
.header::before{ 
  content:""; 
  position:absolute; 
  inset:0; 
  background:linear-gradient(180deg,rgba(0,0,0,.55),rgba(0,0,0,0)); 
  pointer-events:none; 
  transition: background 0.3s ease;
}

/* 스크롤된 상태의 헤더 */
.header.scrolled::before {
  background: rgba(0, 0, 0, 0.95);
}
.header .logo{ 
  position:relative; 
  display:flex; 
  align-items:center; 
  z-index:1; 
  font-weight: 700;
  font-size: 1.2rem;
}
.thtBi{ 
  color: #fff;
  font-weight: 700;
  font-style: italic;
  font-family: 'Georgia', serif;
}
.gnb{ 
  position:absolute; 
  left: 50%;
  transform: translateX(-50%);
  display:flex; 
  gap:28px; 
  z-index:1; 
}
.gnb a{ 
  font-size:.95rem; 
  letter-spacing:-.02em; 
  opacity:.85; 
  padding:8px 12px; 
  cursor: pointer;
  color: #fff;
  min-width: 80px;
  text-align: center;
  transition: none;
}
.gnb a:hover{ 
  opacity: 1; 
}
.gnb a.on{ 
  opacity:1; 
  font-weight:700; 
  border-bottom:2px solid #fff; 
  transition: none;
}
.utill{ 
  margin-left:auto; 
  position:relative; 
  z-index:1; 
}
.utill .btn{ 
  display:flex; 
  gap:12px; 
  align-items:center; 
}
.utill .icon{ 
  width:28px; 
  height:28px; 
  background:rgba(255,255,255,.8); 
  border-radius:50%; 
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  transition: background 0.3s ease;
}
.utill .icon:hover{ 
  background: rgba(255,255,255,1);
}
.utill .wishlist{ 
  width:28px; 
  height:28px; 
  display:inline-flex;
  align-items: center;
  justify-content: center;
  background:rgba(255,255,255,.8); 
  border-radius:50%; 
  color: #333;
  transition: background 0.3s ease;
}
.utill .wishlist:hover{ 
  background: rgba(255,255,255,1);
}

/* 알림 배지 */
.notification {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* ----- Hero / Video ----- */
.mainVisual{ 
  position:relative; 
  min-height:100vh; 
  background:#000; 
  color:#fff; 
}
.visualArea{ 
  position:relative; 
  height:100vh; 
}
.visual{ 
  position:absolute; 
  inset:0; 
}
.bgVideo{ 
  position:absolute; 
  inset:0; 
  width:100%; 
  height:100%; 
  object-fit:cover; 
  filter:saturate(1.05); 
}
.frame{ 
  position:absolute; 
  inset:auto 0 34% 0; 
  height:360px; 
  display:flex; 
  align-items:flex-end; 
  justify-content:center; 
}

/* 액자 프레임 스타일 */
.videoFrame {
  position: absolute;
  top: -30%;
  left: 50%;
  transform: translateX(-50%);
  width: 50%;
  height: 110%;
  pointer-events: none;
  z-index: 5;
}

/* 프레임 선들 - 제거됨 */

/* 모서리 장식 */
.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.8);
}

.corner-topLeft {
  top: -10px;
  left: -10px;
  border-right: none;
  border-bottom: none;
}

.corner-topRight {
  top: -10px;
  right: -10px;
  border-left: none;
  border-bottom: none;
}

.corner-bottomLeft {
  bottom: -10px;
  left: -10px;
  border-right: none;
  border-top: none;
}

.corner-bottomRight {
  bottom: -10px;
  right: -10px;
  border-left: none;
  border-top: none;
}

/* REC 녹화 표시 */
.recIndicator {
  position: absolute;
  top: -2px;
  right: -2px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  padding: 3px 8px;
  border-radius: 12px;
  border: none;
}

.recDot {
  width: 4px;
  height: 4px;
  background: #ff0000;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.recText {
  color: #fff;
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  opacity: 0.8;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.rec{ 
  position:absolute; 
  inset:auto 0 0 0; 
  height:100%; 
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 100%); 
}
.indiBox{ 
  position:relative; 
  width:var(--max); 
  max-width:calc(100% - 48px); 
  display:flex; 
  align-items:center; 
  justify-content:space-between; 
  gap:16px; 
  padding: 0 20px;
}
.pageIndi{ 
  display:flex; 
  align-items:flex-end; 
  gap:4px; 
  font-weight:600; 
}
.pageIndi .current{ 
  font-size:1.1rem; 
  line-height:1; 
  color: #fff;
}
.pageIndi .all{ 
  font-size:0.8rem; 
  opacity:.7; 
  color: #fff;
}
.pageIndi .separator{ 
  font-size:0.8rem; 
  opacity:.7; 
  color: #fff;
  margin: 0 2px;
}
.control{ 
  display: flex; 
  gap: 6px; 
  align-items: center;
  pointer-events: auto;
  z-index: 10;
}
.control .prev,.control .next{ 
  width:14px; 
  height:14px; 
  border-radius:50%; 
  background:rgba(255,255,255,.15); 
  backdrop-filter: blur(2px); 
  position:relative; 
  border: 1px solid rgba(255,255,255,.2);
  transition: all 0.3s ease;
  cursor: pointer;
  pointer-events: auto;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
}
.control .prev:hover,.control .next:hover{ 
  background:rgba(255,255,255,.25); 
  transform: scale(1.05);
}
.control .prev i,.control .next i{ 
  font-size: 0.4rem;
  color: #fff;
  line-height: 1;
  display: block;
}
.control .pause{ 
  width:14px; 
  height:14px; 
  border-radius:50%; 
  background:rgba(255,255,255,.15); 
  position:relative; 
  border: 1px solid rgba(255,255,255,.2);
  transition: all 0.3s ease;
  cursor: pointer;
  pointer-events: auto;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
}
.control .pause:hover{ 
  background:rgba(255,255,255,.25); 
  transform: scale(1.05);
}
.control .pause i{ 
  font-size: 0.4rem;
  color: #fff;
  line-height: 1;
  display: block;
}
.progressBar{ 
  flex: 1;
  min-width: 200px;
  height: 3px; 
  background: rgba(255,255,255,.3); 
  border-radius: 2px; 
  overflow: hidden; 
  margin: 0 20px;
  position: relative;
  border: 1px solid rgba(255,255,255,.1);
}
.progressFill{ 
  height: 100%; 
  background: #fff; 
  border-radius: 1px;
  transition: width 0.3s ease;
  box-shadow: 0 0 4px rgba(255,255,255,0.5);
}





/* ----- Scroll to Top Button ----- */
.scrollToTop{ 
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 50px;
  height: 50px;
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

/* ----- Responsive ----- */
@media (max-width: 1024px){
  .frame{ 
    height:280px; 
  }
}

/* 세로 화면이 작을 때 액자 위치 조정 */
@media (max-height: 800px) {
  .videoFrame {
    top: -20%;
  }
}

@media (max-height: 600px) {
  .videoFrame {
    top: -10%;
  }
}

@media (max-height: 500px) {
  .videoFrame {
    top: 0%;
  }
}

/* 매우 작은 세로 화면에서 액자 크기도 조정 */
@media (max-height: 400px) {
  .videoFrame {
    top: 5%;
    height: 80%;
  }
}
@media (max-width: 768px){
  .header{ 
    gap:14px; 
    padding:0 16px; 
  }
  .gnb{ 
    display:none; 
  }
  .tripPlanCon .infoDiv{ 
    grid-template-columns: 1fr; 
  }
  .icon.find{ 
    width:100%; 
    height:48px; 
    border-radius:10px; 
    margin:10px 0 0; 
  }
  .listDiv{ 
    grid-template-columns: 1fr; 
  }
  

}

/* ----- 검색창 오버레이 스타일 ----- */
.searchOverlay {
  position: absolute;
  top: 80%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
  width: 90%;
  max-width: 1000px;
  text-align: center;
}

.searchTagline {
  margin-bottom: 20px;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.searchTagline span {
  font-family: 'Georgia', serif;
  font-style: italic;
  font-size: 1.4rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  opacity: 0.9;
}

.searchContainer {
  background: rgba(248, 249, 250, 0.98);
  backdrop-filter: blur(20px);
  padding: 0;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1px;
  overflow: visible; /* hidden에서 visible로 변경 */
  position: relative; /* 추가 */
}

.searchForm {
  width: 100%;
}

/* ----- 호텔 검색창 스타일 ----- */
.search-section {
  background: transparent;
  padding: 0;
  margin-bottom: 0;
}

.search-filters {
  display: flex;
  gap: 0;
  align-items: stretch;
  flex-wrap: nowrap;
  width: 100%;
  background: transparent;
  height: 80px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 120px;
  position: relative;
  background: rgba(248, 249, 250, 0.95);
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.filter-item:hover {
  background: rgba(255, 255, 255, 0.98);
}

.filter-item:first-child {
  flex: 0 0 120px;
  min-width: 120px;
}

.filter-item:nth-child(2) {
  flex: 2;
  min-width: 200px;
}

.filter-item:nth-child(3),
.filter-item:nth-child(4),
.filter-item:nth-child(5) {
  flex: 1;
  min-width: 140px;
}

.search-btn-container {
  flex: 0 0 auto;
  min-width: auto;
  border-right: none;
  background: transparent;
  padding: 8px;
}

.search-select {
  padding: 0 16px;
  border: none;
  background-color: transparent;
  font-size: 14px;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23999' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 16px center;
  background-repeat: no-repeat;
  background-size: 16px;
  font-weight: 500;
  color: #333;
  transition: all 0.2s ease;
  height: 100%;
}

.search-select:focus {
  outline: none;
  background-color: rgba(0, 0, 0, 0.02);
}

.search-input, .date-input, .people-input {
  padding: 0 16px;
  border: none;
  font-size: 14px;
  height: 100%;
  box-sizing: border-box;
  width: 100%;
  background: transparent;
  font-weight: 500;
  color: #333;
  transition: all 0.2s ease;
}

.search-input:focus, .date-input:focus, .people-input:focus {
  outline: none;
  background-color: rgba(0, 0, 0, 0.02);
}

.search-input::placeholder,
.date-input::placeholder,
.people-input::placeholder {
  color: #999;
  font-weight: 400;
}

.search-btn {
  background: #111;
  color: white;
  border: none;
  padding: 0 32px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  height: 64px;
  transition: all 0.3s ease;
  min-width: 100px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: 0.5px;
  border-radius: 1px;
}

.search-btn:hover {
  background: #000;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* ----- 콘텐츠 섹션 스타일 ----- */
.contentSection {
  background: #f8f9fa;
  padding: 80px 0;
}

/* 이벤트 배너 */
.eventBanner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60px 0;
  margin-bottom: 80px;
}

.eventContent {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: center;
}

.eventContent h2 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  font-family: 'Georgia', serif;
  font-style: italic;
}

.eventContent > p {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 40px;
}

.eventGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

.eventCard {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease;
}

.eventCard:hover {
  transform: translateY(-5px);
}

.eventImage img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 20px;
}

.eventInfo h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.eventInfo p {
  opacity: 0.8;
  margin-bottom: 16px;
}

.discount {
  background: #ff6b6b;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

/* 섹션 헤더 */
.sectionHeader {
  text-align: center;
  margin-bottom: 50px;
}

.sectionHeader h2 {
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 16px;
  font-family: 'Georgia', serif;
  font-style: italic;
  letter-spacing: -0.02em;
  text-transform: capitalize;
}

.sectionHeader p {
  font-size: 1.2rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: 0.01em;
}

/* 인기 호텔 */
.popularHotels {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
  margin-bottom: 80px;
}

.hotelScrollWrapper {
  position: relative;
  padding: 20px;
}

.hotelScrollContainer {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding: 10px 0;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.hotelScrollContainer::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 스크롤 버튼 */
.scroll-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  opacity: 0;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.scroll-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: translateY(-50%) scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.scroll-btn i {
  font-size: 14px;
  color: #333;
}

.scroll-left {
  left: 30px;
}

.scroll-right {
  right: 30px;
}

/* 호버 시 버튼 표시 */
.hotelScrollWrapper:hover .scroll-btn {
  opacity: 1;
}

/* 로딩 상태 */
.loading-hotels {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #333;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-hotels p {
  color: #666;
  font-size: 14px;
}

/* 빈 상태 */
.no-hotels {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.no-hotels p {
  color: #666;
  font-size: 16px;
}

/* 추천 지역 */
.recommendedAreas {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.areaGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.areaCard {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  height: 200px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.areaCard:hover {
  transform: scale(1.02);
}

.areaCard img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 부산 카드 이미지 위치 조정 */
.busan-card img {
  object-position: center 70%;
}

.areaOverlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 24px;
  text-align: center;
}

.areaOverlay h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.areaOverlay p {
  opacity: 0.9;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* 반응형 */
@media (max-width: 768px) {
  .contentSection {
    padding: 40px 0;
  }
  
  .eventContent h2 {
    font-size: 2rem;
  }
  
  .eventGrid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .hotelScrollContainer {
    gap: 16px;
    padding: 8px 0;
  }
  
  .scroll-btn {
    width: 36px;
    height: 36px;
  }
  
  .scroll-btn i {
    font-size: 12px;
  }
  
  .scroll-left {
    left: 25px;
  }
  
  .scroll-right {
    right: 25px;
  }
  
  .areaGrid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }
  
  .sectionHeader h2 {
    font-size: 2rem;
  }
  
  .sectionHeader p {
    font-size: 1.1rem;
  }
}
/* 검색어 입력 필드에 적용 */
.filter-item:nth-child(2) {
  flex: 2;
  min-width: 200px;
  /* 자동완성 드롭다운의 부모 요소로 설정 */
  position: relative; 
  /* 자동완성 창이 다른 필터 위로 나오도록 z-index 추가 */
  z-index: 10; 
}

/* 자동완성 드롭다운 스타일 */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1000; /* 더 높은 z-index 값 */
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  max-height: 300px;
  overflow: hidden;
  margin-top: 0;
  font-family: inherit;
}

.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
  background-color: #f8f9fa;
}

.suggestions-title {
  font-weight: 500;
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.close-suggestions-btn {
  border: none;
  background: none;
  cursor: pointer;
  color: #9ca3af;
  padding: 2px;
  border-radius: 2px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-suggestions-btn:hover {
  color: #4b5563;
  background-color: #e5e7eb;
}

.suggestions-content {
  max-height: 240px;
  overflow-y: auto;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  border-bottom: 1px solid #f3f4f6;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item.selected,
.suggestion-item:hover {
  background-color: #f0f9ff;
}

.suggestion-text {
  flex-grow: 1;
  font-size: 0.875rem;
  color: #374151;
  font-weight: 400;
}

.suggestion-text mark {
  background-color: #fef3c7;
  color: #92400e;
  padding: 1px 2px;
  border-radius: 2px;
  font-weight: 500;
}

/* 검색 입력 컨테이너의 z-index 조정 */
.search-input-container {
  position: relative;
  z-index: 50;
}

/* 자동완성이 있을 때 input 스타일 조정 */
.search-input-container:has(.suggestions-dropdown) .search-input {
  border-radius: 0;
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

</style>
