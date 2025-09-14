<template>
  <div class="hotel-detail">
    <!-- 이미지 갤러리 섹션 -->
    <div class="image-gallery-section">
      <div class="gallery-container">
        <img
          :src="currentGalleryImage"
          :alt="hotel.hotelName"
          class="gallery-main-image"
          @click="openGalleryModal"
        />

        <!-- 이전/다음 버튼 -->
        <button
          v-if="galleryImages.length > 1"
          class="gallery-nav-btn gallery-prev"
          @click="previousGalleryImage"
          aria-label="이전 이미지"
        >
          <span class="arrow-icon">‹</span>
        </button>

        <button
          v-if="galleryImages.length > 1"
          class="gallery-nav-btn gallery-next"
          @click="nextGalleryImage"
          aria-label="다음 이미지"
        >
          <span class="arrow-icon">›</span>
        </button>

        <!-- 이미지 인디케이터 -->
        <div v-if="galleryImages.length > 1" class="gallery-page-indicator">
          <span class="page-text"
            >{{ currentGalleryIndex + 1 }} / {{ galleryImages.length }}</span
          >
        </div>
      </div>

      <!-- 호텔 기본 정보 -->
      <div class="hotel-basic-info">
        <div class="hotel-header-row">
          <h1 class="hotel-name-large">
            {{ hotel.hotelName || "오션뷰 디럭스 호텔" }}
          </h1>
          <div class="hotel-actions">
            <button class="action-btn wish-btn" @click="toggleWish">
              <v-icon :color="isWished ? '#ef4444' : '#9ca3af'" size="20">
                {{ isWished ? "mdi-heart" : "mdi-heart-outline" }}
              </v-icon>
            </button>
            <div class="share-dropdown">
              <button class="action-btn share-btn" @click="toggleShareDropdown">
                <v-icon color="#9ca3af" size="20">mdi-share-variant</v-icon>
              </button>
              <div v-if="showShareDropdown" class="share-options">
                <div class="share-option" @click="copyLink">
                  <v-icon color="#6B7280" size="18">mdi-content-copy</v-icon>
                  <span>링크 복사</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="hotel-details">
          <div class="detail-item">
            <v-icon size="16" color="#9ca3af" class="detail-icon"
              >mdi-map-marker</v-icon
            >
            <span class="hotel-address-small">{{
              hotel.address || "부산 해운대구 해운대해변로 264"
            }}</span>
          </div>
          <span class="hotel-separator">/</span>
          <div class="detail-item">
            <v-icon size="16" color="#9ca3af" class="detail-icon"
              >mdi-phone</v-icon
            >
            <span class="hotel-phone-small">{{
              formatPhone(hotel.phoneNumber) || "051-123-4567" }}
            </span>
          </div>
        </div>

        <!-- 숙소 설명 -->
        <div class="hotel-description-section">
          <p class="hotel-description-text">
            {{
              hotel.description ||
              "해운대 해변에 위치한 프리미엄 호텔로, 모든 객실에서 바다 전망을 즐길 수 있습니다. 최고급 시설과 서비스로 편안한 휴식을 제공합니다."
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- 리뷰 섹션 -->
    <div class="review-section">
      <HotelSimpleReviewListCard
        :hotel-id="Number($route.params.id)"
        :reservation-id="null"
      />
    </div>

    <!-- 객실 예약 타이틀 -->
    <div class="booking-title">
      <h2>객실 예약</h2>
    </div>

    <!-- 예약 정보 입력 -->
    <div class="booking-section">
      <div class="date-inputs">
        <div class="input-group">
          <label>체크인</label>
          <input
            type="date"
            v-model="checkInDate"
            :min="getTodayDate()"
            @click="$event.target.showPicker()"
            @change="onCheckInDateChange"
          />
        </div>
        <div class="input-group">
          <label>체크아웃</label>
          <input
            type="date"
            v-model="checkOutDate"
            :min="minCheckOutDate"
            @click="$event.target.showPicker()"
            @change="onCheckOutDateChange"
          />
        </div>
        <div class="input-group">
          <label>인원</label>
          <input
            v-model.number="guestCount"
            type="number"
            min="1"
            max="10"
            placeholder="성인 인원수"
          />
        </div>
        <button class="search-btn" @click="searchRooms">객실 검색</button>
      </div>
    </div>

    <!-- 객실 목록 -->
    <div class="rooms-section">
      <h2>예약 가능한 객실</h2>
      <p class="rooms-subtitle">
        {{ formatDate(checkInDate) }} ~ {{ formatDate(checkOutDate) }} / 성인
        {{ guestCount }}명
      </p>
      
      <div v-if="displayRooms.length > 0" class="room-list">
        <div v-for="room in displayRooms" :key="room.id" class="room-item">
          <div class="room-image" @click="openImageModal(room)">
            <img
              :src="room.image || '/api/placeholder/200/150'"
              :alt="room.type"
            />
            <div
              class="image-overlay"
              v-if="room.roomImages && room.roomImages.length > 1"
            >
              <span class="image-count">+{{ room.roomImages.length - 1 }}</span>
            </div>
          </div>

          <div class="room-details">
            <h3 class="room-type">{{ room.type }}</h3>
            <div class="room-specs">
              <span>기준 {{ room.standardPeople }}명 • 최대 {{ room.maximumPeople }}명</span>
            </div>
            <div class="room-specs">
              <span>체크인 : {{ formatTime(room.checkIn) }} • 체크아웃 : {{ formatTime(room.checkOut) }}</span>
            </div>
            <div
              class="room-options"
              v-if="room.roomOption1 || room.roomOption2"
            >
              <span v-if="room.roomOption1" class="option-tag">{{ getOptionName(room.roomOption1) }}</span>
              <span v-if="room.roomOption2" class="option-tag">{{ getOptionName(room.roomOption2) }}</span>
            </div>
            <div class="room-description" v-if="room.description">
              {{ room.description }}
            </div>
          </div>

          <div class="room-booking">
            <div class="room-price">
              <span class="price">₩{{ (room.price || 120000).toLocaleString() }}</span>
              <span class="price-unit">/박</span>
            </div>
            <div class="remaining-rooms" v-if="room.remainRoomCount">
              {{ room.remainRoomCount }}개 객실 남음
            </div>
            <button
              class="book-btn"
              :class="{ unavailable: room.remainRoomCount === 0 }"
              :disabled="room.remainRoomCount === 0"
              @click="bookRoom(room)"
            >
              {{ room.remainRoomCount === 0 ? "예약 불가" : "객실 예약" }}
            </button>
          </div>
        </div>
      </div>
      <div v-else class="no-rooms-message">
        <p>선택하신 조건에 맞는 객실이 없습니다.</p>
        <p>다른 날짜나 인원수로 다시 검색해 보세요.</p>
      </div>
    </div>

    <!-- 이미지 모달 -->
    <div v-if="showImageModal" class="modal-overlay" @click="closeImageModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedRoom.type }} 이미지</h3>
          <button class="close-btn" @click="closeImageModal">×</button>
        </div>

        <div class="image-gallery">
          <div class="main-image-container">
            <!-- 이전 버튼 -->
            <button
              v-if="roomImages.length > 1"
              class="nav-btn nav-btn-left"
              @click="previousImage"
              :disabled="currentImageIndex === 0"
            >
              <span class="arrow-icon">&#8249;</span>
            </button>

            <!-- 메인 이미지 -->
            <div class="main-image">
              <img :src="currentImage" :alt="selectedRoom.type" />
            </div>

            <!-- 다음 버튼 -->
            <button
              v-if="roomImages.length > 1"
              class="nav-btn nav-btn-right"
              @click="nextImage"
              :disabled="currentImageIndex === roomImages.length - 1"
            >
              <span class="arrow-icon">&#8250;</span>
            </button>
          </div>

          <!-- 이미지 카운터 -->
          <div class="image-counter" v-if="roomImages.length > 1">
            {{ currentImageIndex + 1 }} / {{ roomImages.length }}
          </div>

          <!-- 썸네일 리스트 -->
          <div class="thumbnail-list" v-if="roomImages.length > 1">
            <div
              v-for="(image, index) in roomImages"
              :key="index"
              class="thumbnail"
              :class="{ active: currentImageIndex === index }"
              @click="setCurrentImage(index)"
            >
              <img
                :src="image.imageUrl || image"
                :alt="`${selectedRoom.type} ${index + 1}`"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 위치 타이틀 -->
    <div class="booking-title">
      <h2>위치</h2>
    </div>

    <!-- 지도 섹션 -->
    <div class="map-section">
      <div class="map-container">
        <KakaoMapComponent
          ref="mapComponent"
          :lat="hotelLocation.latitude"
          :lng="hotelLocation.longitude"
          :level="3"
          :hotels="[currentHotelMarker]"
          :disable-zoom="true"
          :disable-hotel-click="true"
          :disable-panning="true"
        />
        <!-- 지도 확대/축소 컨트롤 -->
        <div class="map-controls">
          <button class="map-control-btn zoom-in" @click="zoomIn" title="확대">
            <span>+</span>
          </button>
          <button
            class="map-control-btn zoom-out"
            @click="zoomOut"
            title="축소"
          >
            <span>−</span>
          </button>
        </div>
      </div>
      <div class="hotel-address-full">
        <v-icon size="16" color="#6b7280" class="address-icon"
          >mdi-map-marker</v-icon
        >
        <span>{{ hotel.address || "부산 해운대구 해운대해변로 264" }}</span>
      </div>
    </div>

    <!-- 갤러리 모달 -->
    <div
      v-if="showGalleryModal"
      class="modal-overlay"
      @click="closeGalleryModal"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>호텔 이미지 갤러리</h3>
          <button class="close-btn" @click="closeGalleryModal">×</button>
        </div>

        <div class="image-gallery">
          <div class="main-image-container">
            <!-- 이전 버튼 -->
            <button
              v-if="galleryImages.length > 1"
              class="nav-btn nav-btn-left"
              @click="previousGalleryModalImage"
              :disabled="currentGalleryModalIndex === 0"
            >
              <span class="arrow-icon">&#8249;</span>
            </button>

            <!-- 메인 이미지 -->
            <div class="main-image">
              <img :src="currentGalleryModalImage" :alt="hotel.hotelName" />
            </div>

            <!-- 다음 버튼 -->
            <button
              v-if="galleryImages.length > 1"
              class="nav-btn nav-btn-right"
              @click="nextGalleryModalImage"
              :disabled="currentGalleryModalIndex === galleryImages.length - 1"
            >
              <span class="arrow-icon">&#8250;</span>
            </button>
          </div>

          <!-- 이미지 카운터 -->
          <div class="image-counter" v-if="galleryImages.length > 1">
            {{ currentGalleryModalIndex + 1 }} / {{ galleryImages.length }}
          </div>

          <!-- 썸네일 리스트 -->
          <div class="thumbnail-list" v-if="galleryImages.length > 1">
            <div
              v-for="(image, index) in galleryImages"
              :key="index"
              class="thumbnail"
              :class="{ active: currentGalleryModalIndex === index }"
              @click="goToGalleryModalImage(index)"
            >
              <img :src="image" :alt="`${hotel.hotelName} ${index + 1}`" />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 스낵바 -->
    <v-snackbar
      v-model="showSnackbar"
      timeout="4000"
      :color="snackbarType === 'success' ? 'success' : 'error'"
      location="top"
      variant="flat"
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script>
import axios from "axios";
import HotelSimpleReviewListCard from "@/views/Review/HotelSimpleReviewListCard.vue";
import KakaoMapComponent from "./KakaoMapComponent.vue"; // 카카오맵 컴포넌트 import

export default {
  name: "HotelDetail",
  components: {
    HotelSimpleReviewListCard,
    KakaoMapComponent, // 컴포넌트 등록
  },
  data() {
    return {
      hotel: {
        id: "",
        hotelName: "",
        address: "",
        phoneNumber: "",
        image: "",
        description: "",
        rating: 0,
        reviewCount: 0,
        roomDetailResponseDtoList: [],
        latitude: 35.1595, // 부산 해운대 기본 좌표
        longitude: 129.16,
      },
      checkInDate: "",
      checkOutDate: "",
      guestCount: 2,
      displayRooms: [],

      // 이미지 모달 관련
      showImageModal: false,
      selectedRoom: {},
      roomImages: [],
      currentImageIndex: 0,

      // 갤러리 모달 관련
      showGalleryModal: false,
      currentGalleryModalIndex: 0,

      // 이미지 갤러리 관련
      currentGalleryIndex: 0,

      // 호텔 액션 관련
      isWished: false,

      // 공유 드롭다운 관련
      showShareDropdown: false,
      
      // 스낵바 관련
      showSnackbar: false,
      snackbarMessage: '',
      snackbarType: 'error', // 'success' 또는 'error'
    };
  },
  computed: {
    // 호텔 위치 정보
    hotelLocation() {
      return {
        latitude: this.hotel.latitude || 35.1595, // 부산 해운대 기본 좌표
        longitude: this.hotel.longitude || 129.16,
      };
    },

    // 현재 호텔을 지도에 표시하기 위한 마커 데이터
    currentHotelMarker() {
      return {
        id: this.hotel.id || 1,
        name: this.hotel.hotelName || "오션뷰 디럭스 호텔",
        location: this.hotel.address || "부산 해운대구 해운대해변로 264",
        image: this.hotel.image || "/api/placeholder/200/150",
        lat: this.hotelLocation.latitude,
        lng: this.hotelLocation.longitude,
        price: null, // 호텔 상세에서는 가격 표시 안함
      };
    },

    // 갤러리용 전체 이미지 배열
    galleryImages() {
      const images = [];

      // 호텔 메인 이미지 추가
      if (this.hotel.image) {
        images.push(this.hotel.image);
      }

      // 객실 이미지들 추가
      if (this.displayRooms && this.displayRooms.length > 0) {
        this.displayRooms.forEach((room) => {
          if (room.roomImages && room.roomImages.length > 0) {
            room.roomImages.forEach((img) => {
              const imageUrl = img.imageUrl || img;
              if (imageUrl && !images.includes(imageUrl)) {
                images.push(imageUrl);
              }
            });
          }
        });
      }

      // 이미지가 없으면 기본 이미지 반환
      if (images.length === 0) {
        images.push("/api/placeholder/400/300");
      }

      return images;
    },

    // 현재 갤러리에 표시할 이미지
    currentGalleryImage() {
      return (
        this.galleryImages[this.currentGalleryIndex] ||
        "/api/placeholder/400/300"
      );
    },

    currentImage() {
      if (this.roomImages.length === 0) return "/api/placeholder/400/300";
      const image = this.roomImages[this.currentImageIndex];
      return image?.imageUrl || image || "/api/placeholder/400/300";
    },

    currentGalleryModalImage() {
      return (
        this.galleryImages[this.currentGalleryModalIndex] ||
        "/api/placeholder/400/300"
      );
    },
    minCheckOutDate() {
      // 체크인 날짜가 있으면 체크인 날짜 다음날을 최소값으로 설정
      if (this.checkInDate) {
        const checkIn = new Date(this.checkInDate);
        checkIn.setDate(checkIn.getDate() + 1);
        return checkIn.toISOString().split("T")[0];
      }
      // 체크인 날짜가 없으면 오늘 다음날을 최소값으로 설정
      return this.getTomorrowDate();
    },
  },
  async created() {
    // URL에서 날짜 정보 가져오기
    const { checkIn, checkOut, people } = this.$route.query;
    this.checkInDate = checkIn || this.getTodayDate();
    this.checkOutDate = checkOut || this.getTomorrowDate();
    this.guestCount = people || 2;

    // 찜 목록 불러오기
    await this.loadWishlist();
    
    await this.fetchHotelDetail();
    this.setupDisplayRooms();
  },

  mounted() {
    // 외부 클릭 시 공유 드롭다운 닫기
    document.addEventListener("click", this.handleClickOutside);
  },

  beforeUnmount() {
    // 이벤트 리스너 제거
    document.removeEventListener("click", this.handleClickOutside);
  },
  methods: {
    // 지도 확대/축소 메서드
    zoomIn() {
      if (this.$refs.mapComponent) {
        this.$refs.mapComponent.zoomIn();
      }
    },

    zoomOut() {
      if (this.$refs.mapComponent) {
        this.$refs.mapComponent.zoomOut();
      }
    },

    async fetchHotelDetail() {
      const hotelId = this.$route.params.id;

      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/hotel/detail/${hotelId}`,
          {
            params: {
              checkIn: this.checkInDate,
              checkOut: this.checkOutDate,
              people: this.guestCount,
            },
          }
        );

        if (response.data && response.data.result) {
          this.hotel = response.data.result;
          console.log(this.hotel);
          // API에서 받은 좌표 정보가 없으면 기본값 유지
          if (!this.hotel.latitude) this.hotel.latitude = 35.1595;
          if (!this.hotel.longitude) this.hotel.longitude = 129.16;
        }
      } catch (error) {
        console.error("호텔 정보를 불러오는 중 오류 발생:", error);
      }
    },

    // 이미지 갤러리 관련 메서드
    previousGalleryImage() {
      if (this.galleryImages.length > 1) {
        this.currentGalleryIndex =
          this.currentGalleryIndex > 0
            ? this.currentGalleryIndex - 1
            : this.galleryImages.length - 1;
      }
    },

    nextGalleryImage() {
      if (this.galleryImages.length > 1) {
        this.currentGalleryIndex =
          this.currentGalleryIndex < this.galleryImages.length - 1
            ? this.currentGalleryIndex + 1
            : 0;
      }
    },

    goToGalleryImage(index) {
      if (index >= 0 && index < this.galleryImages.length) {
        this.currentGalleryIndex = index;
      }
    },

    // 갤러리 모달 관련 메서드
    openGalleryModal() {
      this.showGalleryModal = true;
      this.currentGalleryModalIndex = this.currentGalleryIndex;
    },

    closeGalleryModal() {
      this.showGalleryModal = false;
    },

    previousGalleryModalImage() {
      if (this.galleryImages.length > 1) {
        this.currentGalleryModalIndex =
          this.currentGalleryModalIndex > 0
            ? this.currentGalleryModalIndex - 1
            : this.galleryImages.length - 1;
      }
    },

    nextGalleryModalImage() {
      if (this.galleryImages.length > 1) {
        this.currentGalleryModalIndex =
          this.currentGalleryModalIndex < this.galleryImages.length - 1
            ? this.currentGalleryModalIndex + 1
            : 0;
      }
    },

    goToGalleryModalImage(index) {
      if (index >= 0 && index < this.galleryImages.length) {
        this.currentGalleryModalIndex = index;
      }
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
          // 현재 호텔이 찜 목록에 있는지 확인
          const hotelId = Number(this.$route.params.id);
          this.isWished = wishlist.some(item => item.hotelId === hotelId);
          console.log('찜 목록 로드됨, 현재 호텔 찜 상태:', this.isWished);
        } else {
          console.error('찜 목록 로드 실패:', response.status);
        }
      } catch (error) {
        console.error('찜 목록 로드 중 오류:', error);
      }
    },

    // 스낵바 메시지 표시
    showSnackbarMessage(message, type = 'error') {
      this.snackbarMessage = message;
      this.snackbarType = type;
      this.showSnackbar = true;
    },

    // 호텔 액션 관련 메서드
    async toggleWish() {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        this.showSnackbarMessage('찜 기능은 로그인 후 이용 가능합니다.');
        return;
      }

      try {
        const hotelId = Number(this.$route.params.id);
        const isCurrentlyFavorited = this.isWished;
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
          this.isWished = !this.isWished;
          if (isCurrentlyFavorited) {
            this.showSnackbarMessage('찜 목록에서 취소되었습니다.');
            console.log(`호텔 ${hotelId} 좋아요 취소`);
          } else {
            this.showSnackbarMessage('찜 목록에 추가되었습니다.');
            console.log(`호텔 ${hotelId} 좋아요 추가`);
          }
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

    toggleShareDropdown() {
      this.showShareDropdown = !this.showShareDropdown;
    },


    copyLink() {
      // 링크 복사
      const url = window.location.href;

      // 클립보드 API 지원 여부 확인
      if (navigator.clipboard && window.isSecureContext) {
        // HTTPS 환경에서 클립보드 API 사용
        navigator.clipboard
          .writeText(url)
          .then(() => {
            this.showSnackbarMessage("링크가 복사되었습니다!", 'success');
          })
          .catch(() => {
            this.fallbackCopyTextToClipboard(url);
          });
      } else {
        // fallback 방식 사용
        this.fallbackCopyTextToClipboard(url);
      }

      this.showShareDropdown = false;
    },

    fallbackCopyTextToClipboard(text) {
      // fallback 복사 방식 (구형 브라우저 지원)
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        this.showSnackbarMessage("링크가 복사되었습니다!", 'success');
      } catch (err) {
        this.showSnackbarMessage("링크 복사에 실패했습니다.");
      }

      document.body.removeChild(textArea);
    },


    handleClickOutside(event) {
      // 공유 드롭다운 외부 클릭 시 닫기
      if (!event.target.closest(".share-dropdown")) {
        this.showShareDropdown = false;
      }
    },

    setupDisplayRooms() {
      // API에서 받은 객실 정보가 있으면 사용, 없으면 목업 데이터
      if (
        this.hotel.roomDetailResponseDtoList &&
        this.hotel.roomDetailResponseDtoList.length > 0
      ) {
        this.displayRooms = this.hotel.roomDetailResponseDtoList.map(
          (room) => ({
            ...room,
            image: room.roomImages?.[0]?.imageUrl || "/api/placeholder/200/150",
            bedrooms: 1,
            bathrooms: 1,
            hasBalcony: true,
            hasOceanView: room.type?.includes("오션뷰") || false,
          })
        );
      }
      else {
        this.displayRooms = [];
      }
    },

    getOptionName(option) {
      const optionNames = {
        single: "싱글 침대",
        double: "더블 침대",
        queen: "퀸 침대",
        king: "킹 침대",
        bunk: "이층 침대",
        ondol: "온돌룸",
        ocean: "오션뷰",
        mountain: "마운틴뷰",
        city: "시티뷰",
        river: "리버뷰",
        garden: "가든뷰",
        lake: "레이크뷰",
      };
      return optionNames[option] || option;
    },

    async searchRooms() {
      // 새로운 날짜와 인원으로 객실 검색
      await this.fetchHotelDetail();
      this.setupDisplayRooms();
    },

    async bookRoom(room) {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/hotel/myhotelfind`);
          
        if(response.data && response.data.result) {
          if(String(response.data.result.hotelId) === this.$route.params.id) {
            this.showSnackbarMessage("본인 호텔은 예약할 수 없습니다.")
            return ;
          }
        }
      } catch(e) {
          console.log(e)
      }
      if (room.remainRoomCount > 0) {
        // 실제로는 예약 페이지로 라우팅
        if (localStorage.getItem("accessToken")) {
          this.$router.push({
            path: "/reservation",
            query: {
              hotelId: this.$route.params.id || 1,
              hotelImage: this.hotel.image,
              roomId: room.id,
              checkIn: this.checkInDate,
              checkOut: this.checkOutDate,
              guestCount: this.guestCount,
              roomName: room.type,
              bedType: this.getOptionName(room.roomOption1),
              standardPeople: room.standardPeople,
              maxOccupancy: room.maximumPeople,
              pricePerNight: room.price,
              hotelName: this.hotel.name,
              hotelAddress: this.hotel.address,
              roomImageUrl: room.roomImages?.[0]?.imageUrl,
            },
          });
        } else {
          this.$modalBus.showConfirm({
            title: "예약 확인",
            message: "예약은 로그인 후 가능합니다 로그인을 하시겠습니까?",
            confirmColor: "#3b82f6",
            resolve: (result) => {
              if (result) {
                // 사용자가 "예"를 클릭한 경우
                console.log("예약을 진행합니다.");
                this.$router.push("/user/login");
              } else {
                // 사용자가 "아니오"를 클릭한 경우
                console.log("예약이 취소되었습니다.");
              }
            },
          });
        }
      }
    },

    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    },

    formatTime(timeStr) {
      // timeStr이 유효한지 먼저 확인합니다.
      if (!timeStr) {
        return "정보 없음"; // 또는 다른 적절한 기본값
      }
      // '14:00:00' 에서 시간, 분, 초를 분리합니다.
      const [hourStr, minuteStr] = timeStr.split(':');
      let hour = parseInt(hourStr, 10);
      let period = '오전';

      // 오후인지 판단
      if (hour >= 12) {
        period = '오후';
      }

      // 12시간제로 변환
      if (hour > 12) {
        hour -= 12;
      } else if (hour === 0) {
        hour = 12; // 자정 12시로 표시
      }

      // '오전/오후 [시간]시' 형식으로 조합하여 반환
      // 분이 0이 아닐 경우 '30분'을 추가할 수도 있습니다.
      if (parseInt(minuteStr, 10) > 0) {
        return `${period} ${hour}시 ${parseInt(minuteStr, 10)}분`;
      } else {
        return `${period} ${hour}시`;
      }
    },

    formatPhone(p) {
      const s = (p || "").replace(/\D/g, "");
      if (s.length === 11) return `${s.slice(0,3)}-${s.slice(3,7)}-${s.slice(7)}`;
      if (s.length === 10) return `${s.slice(0,3)}-${s.slice(3,6)}-${s.slice(6)}`;
      return p || "-";
    },

    getTodayDate() {
      return new Date().toISOString().split("T")[0];
    },

    getTomorrowDate() {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split("T")[0];
    },

    // 이미지 모달 관련 메서드
    openImageModal(room) {
      this.selectedRoom = room;
      this.roomImages =
        room.roomImages && room.roomImages.length > 0
          ? room.roomImages
          : [{ imageUrl: room.image || "/api/placeholder/400/300" }];
      this.currentImageIndex = 0;
      this.showImageModal = true;
      document.body.style.overflow = "hidden"; // 스크롤 방지
    },

    closeImageModal() {
      this.showImageModal = false;
      this.selectedRoom = {};
      this.roomImages = [];
      this.currentImageIndex = 0;
      document.body.style.overflow = "auto"; // 스크롤 복원
    },

    setCurrentImage(index) {
      this.currentImageIndex = index;
    },

    previousImage() {
      if (this.currentImageIndex > 0) {
        this.currentImageIndex--;
      }
    },

    nextImage() {
      if (this.currentImageIndex < this.roomImages.length - 1) {
        this.currentImageIndex++;
      }
    },

    // 날짜 유효성 검사 메서드
    onCheckInDateChange() {
      // 체크인 날짜가 오늘보다 이전인 경우 오늘로 설정
      const today = this.getTodayDate();
      if (this.checkInDate < today) {
        this.checkInDate = today;
        this.showDateWarning("체크인 날짜는 오늘 이후로만 선택 가능합니다.");
        return;
      }

      // 체크아웃 날짜가 체크인 날짜보다 이전이거나 같은 경우 체크인 다음날로 자동 설정
      if (this.checkOutDate && this.checkOutDate <= this.checkInDate) {
        const checkInDate = new Date(this.checkInDate);
        checkInDate.setDate(checkInDate.getDate() + 1);
        this.checkOutDate = checkInDate.toISOString().split("T")[0];
        // this.showDateWarning("체크아웃 날짜가 체크인 다음날로 자동 조정되었습니다.");
      }
    },

    onCheckOutDateChange() {
      // 체크아웃 날짜가 체크인 날짜보다 이전이거나 같은 경우
      if (this.checkInDate && this.checkOutDate <= this.checkInDate) {
        const checkInDate = new Date(this.checkInDate);
        checkInDate.setDate(checkInDate.getDate() + 1);
        this.checkOutDate = checkInDate.toISOString().split("T")[0];
        this.showDateWarning(
          "체크아웃 날짜는 체크인 날짜 다음날부터 선택 가능합니다."
        );
      }
    },

    showDateWarning(message) {
      // 간단한 알림 표시 (실제로는 toast 알림이나 더 나은 UI를 사용할 수 있습니다)
      this.showSnackbarMessage(message);
    },
  },
};
</script>

<style scoped>
.hotel-detail {
  max-width: 1100px;
  margin: 0 auto;
  padding: 30px 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter",
    sans-serif;
  background: #f8fafc;
  min-height: 100vh;
}

/* 이미지 갤러리 섹션 */
.image-gallery-section {
  margin: 8px 0 40px 0;
  padding: 0 20px;
}

/* 호텔 기본 정보 */
.hotel-basic-info {
  margin-top: 24px;
  text-align: left;
}

.hotel-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.hotel-name-large {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.2;
  text-align: right;
}

.hotel-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: #e5e7eb;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #d1d5db;
  transform: scale(1.05);
}

.wish-btn:hover {
  background: #fef2f2;
}

/* 공유 드롭다운 스타일 */
.share-dropdown {
  position: relative;
}

.share-options {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  min-width: 180px;
  z-index: 1000;
  overflow: hidden;
}

.share-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #f3f4f6;
}

.share-option:last-child {
  border-bottom: none;
}

.share-option:hover {
  background-color: #f9fafb;
}

.share-option span {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.hotel-details {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.detail-icon {
  flex-shrink: 0;
}

.hotel-address-small {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.hotel-separator {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
  font-weight: 400;
}

.hotel-phone-small {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

/* 숙소 설명 */
.hotel-description-section {
  margin-top: 16px;
}

.hotel-description-text {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
  text-align: justify;
}

.gallery-container {
  position: relative;
  width: 100%;
  height: 500px;
  border-radius: 16px;
  overflow: hidden;
  background: #f8fafc;
}

.gallery-main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
  cursor: pointer;
}

.gallery-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.gallery-nav-btn:hover {
  background: rgba(0, 0, 0, 0.5);
}

/* 갤러리 네비게이션 버튼의 화살표 아이콘 */
.gallery-nav-btn .arrow-icon {
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transform: translateY(-2px); /* 폰트 baseline 조정으로 정확한 중앙 정렬 */
  position: relative;
  top: 1px; /* 추가 미세 조정 */
}

.gallery-prev {
  left: 20px;
}

.gallery-next {
  right: 20px;
}

.gallery-page-indicator {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.gallery-page-indicator .page-text {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 지도 섹션 */
.map-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  margin: 20px 20px 40px 20px;
}

.map-section h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #111827;
}

.map-container {
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.map-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 10;
}

.map-control-btn {
  width: 40px;
  height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: #374151;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.map-control-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.map-control-btn:active {
  transform: scale(0.95);
}

.zoom-in {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: none;
}

.zoom-out {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.hotel-address-full {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #6b7280;
  padding: 8px 0;
}

.address-icon {
  flex-shrink: 0;
}

/* 객실 예약 타이틀 */
.booking-title {
  margin: 32px 0 16px 0;
  padding: 0 20px;
}

.booking-title h2 {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 1.2;
}

/* 예약 섹션 */
.booking-section {
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;
  margin-left: 20px;
  margin-right: 20px;
}

.booking-section h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 20px 0;
  color: #4f46e5;
  display: flex;
  align-items: center;
  gap: 8px;
}

.booking-section h2::before {
  content: "📅";
  font-size: 18px;
}

.date-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr 0.7fr auto;
  gap: 16px;
  align-items: end;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
  color: #6b7280;
}

.input-group input {
  padding: 12px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  height: 44px;
  box-sizing: border-box;
  transition: all 0.2s ease;
  background: white;
}

.input-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  transform: none;
}

.input-group input:hover {
  border-color: #9ca3af;
  background: #f9fafb;
}

.search-btn {
  background: #111827;
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.search-btn:hover {
  background: #374151;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.search-btn:active {
  transform: translateY(0);
}

/* 객실 섹션 */
.rooms-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  margin-left: 20px;
  margin-right: 20px;
}

.rooms-section h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #111827;
}

.rooms-subtitle {
  color: #6b7280;
  font-size: 15px;
  margin: 0 0 30px 0;
  font-weight: 500;
}

/* 객실 목록 */
.room-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.room-item {
  display: flex;
  gap: 20px;
  padding: 24px 0;
  border: none;
  border-radius: 0;
  transition: all 0.2s ease;
  background: transparent;
  box-shadow: none;
}

.room-item:not(:last-child) {
  border-bottom: 1px solid #e5e7eb;
}

.room-item:hover {
  background: #f9fafb;
  transform: none;
}

.room-image {
  flex: 0 0 160px;
  cursor: pointer;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  height: 120px;
}

.room-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.room-image:hover img {
  transform: scale(1.02);
}

.image-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.room-details {
  flex: 1;
}

.room-type {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: #1f2937;
}

.room-specs {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
  font-weight: 500;
}

.room-options {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.option-tag {
  font-size: 12px;
  color: #ffffff;
  background: #374151;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  border: 1px solid #4b5563;
}

.room-description {
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 0;
  line-height: 1.5;
  font-weight: 400;
}

.room-booking {
  flex: 0 0 150px;
  text-align: right;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
}

.room-price {
  margin-bottom: 8px;
}

.price {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.price-unit {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.remaining-rooms {
  font-size: 12px;
  color: #dc2626;
  margin-bottom: 12px;
  font-weight: 600;
  background: #fef2f2;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid #fecaca;
}

.book-btn {
  background: #111827;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.book-btn:hover:not(:disabled) {
  background: #374151;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.book-btn.unavailable {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 이미지 모달 스타일 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 800px;
  height: 600px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.image-gallery {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
}

.main-image-container {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  min-height: 0; /* flexbox에서 overflow를 위해 필요 */
}

.main-image {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  overflow: hidden;
}

.main-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.thumbnail-list {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 15px;
  overflow-x: auto;
  padding: 5px 0;
}

.thumbnail {
  flex: 0 0 60px;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.thumbnail:hover {
  border-color: #007bff;
}

.thumbnail.active {
  border-color: #007bff;
}

.thumbnail img {
  width: 100%;
  height: 45px;
  object-fit: cover;
}

.image-navigation {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
}

.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.nav-btn .arrow-icon {
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transform: translateY(-1.5px);
  position: relative;
  top: 1px;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.5);
}

.nav-btn:disabled {
  background: rgba(0, 0, 0, 0.2);
  cursor: not-allowed;
}

.nav-btn-left {
  left: 20px;
}

.nav-btn-right {
  right: 20px;
}

.image-counter {
  text-align: center;
  font-size: 14px;
  color: #666;
  font-weight: 500;
  margin-bottom: 15px;
  flex-shrink: 0;
}

/* 리뷰 섹션 */
.review-section {
  margin: 40px 0;
  padding: 0 20px;
}

/* 반응형 */
@media (max-width: 768px) {
  .hotel-detail {
    padding: 20px 15px;
  }

  .image-gallery-section {
    margin: 6px 0 30px 0;
    padding: 0 15px;
  }

  .hotel-basic-info {
    margin-top: 20px;
  }

  .hotel-header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .hotel-name-large {
    font-size: 24px;
    margin: 0;
    text-align: left;
  }

  .hotel-actions {
    gap: 6px;
  }

  .action-btn {
    width: 36px;
    height: 36px;
  }

  .hotel-description-section {
    margin-top: 14px;
  }

  .hotel-description-text {
    font-size: 13px;
  }

  .hotel-address-small,
  .hotel-phone-small {
    font-size: 13px;
  }

  .map-section {
    margin: 0 15px 30px 15px;
  }

  .map-container {
    height: 250px;
  }

  .map-controls {
    top: 8px;
    right: 8px;
  }

  .map-control-btn {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .booking-title {
    margin: 24px 0 12px 0;
    padding: 0 15px;
  }

  .booking-title h2 {
    font-size: 20px;
  }

  .gallery-container {
    height: 350px;
  }

  .gallery-nav-btn {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }

  .gallery-nav-btn .arrow-icon {
    font-size: 16px;
  }

  .gallery-prev {
    left: 10px;
  }

  .gallery-next {
    right: 10px;
  }

  .gallery-page-indicator .page-text {
    font-size: 12px;
    padding: 6px 12px;
  }

  .date-inputs {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .search-btn {
    width: 100%;
    margin-top: 8px;
  }

  .rooms-section {
    margin-left: 15px;
    margin-right: 15px;
  }

  .room-item {
    flex-direction: column;
    gap: 16px;
    padding: 20px 0;
  }

  .room-image {
    flex: none;
    align-self: center;
    width: 100%;
    max-width: 240px;
    height: 140px;
  }

  .room-booking {
    flex: none;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    text-align: left;
  }

  .modal-content {
    width: 95vw;
    height: 85vh;
    margin: 10px;
  }

  .nav-btn {
    width: 35px;
    height: 35px;
    font-size: 24px;
    font-weight: bold;
    line-height: 1;
  }

  .nav-btn-left {
    left: 5px;
  }

  .nav-btn-right {
    right: 5px;
  }

  .thumbnail-list {
    flex-wrap: wrap;
    gap: 6px;
  }

  .thumbnail {
    flex: 0 0 50px;
  }

  .thumbnail img {
    height: 38px;
  }
}

</style>
