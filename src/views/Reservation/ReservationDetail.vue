<template>
  <div class="booking-detail-container">
    <!-- 상단 네비 -->
    <div class="nav-header">
      <h1 class="page-title">예약 상세</h1>
    </div>

    <!-- 메인 카드 -->
    <div class="booking-card">
      <!-- 호텔 정보 섹션 -->
      <section class="hotel-section">
        <div class="hotel-content">
          <div class="hotel-image-wrapper">
            <img
              :src="booking.hotelDto.image"
              :alt="booking.hotelDto.name"
              class="hotel-image"
            />
          </div>
          <div class="hotel-info">
            <h2 class="hotel-name">{{ booking.hotelDto.name }}</h2>
            <div class="hotel-rating">
              <div class="stars">
                <span v-for="n in fullStars" :key="n" class="star filled"
                  >★</span
                >
                <span v-if="hasHalfStar" class="star half">★</span>
                <span v-for="n in emptyStars" :key="'empty-' + n" class="star"
                  >★</span
                >
              </div>
              <span class="rating-text"
                >{{ booking.hotelRating }} ({{ booking.hotelReviewCount }}개
                리뷰)</span
              >
            </div>
            <div class="hotel-details">
              <div class="detail-item">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                  />
                </svg>
                <span>{{ booking.hotelDto.address }}</span>
              </div>
              <div class="detail-item">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
                  />
                </svg>
                <span>{{ booking.hotelDto.phone }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 예약 정보 그리드 -->
      <div class="info-grid">
        <!-- 객실 정보 -->
        <section class="info-card">
          <h3 class="section-title">객실 정보</h3>
          <p class="section-content">{{ booking.roomType }}</p>
        </section>

        <!-- 투숙객 정보 -->
        <section class="info-card">
          <h3 class="section-title">투숙객 정보</h3>
          <div class="guest-info">
            <div class="info-row">
              <span class="label">예약자명</span>
              <span class="value">{{ booking.userDto.name }}</span>
            </div>
            <div class="info-row">
              <span class="label">이메일</span>
              <span class="value">{{ booking.userDto.email }}</span>
            </div>
            <div class="info-row">
              <span class="label">전화번호</span>
              <span class="value">{{ booking.userDto.phone }}</span>
            </div>
          </div>
        </section>

        <!-- 예약 상세 -->
        <section class="info-card">
          <h3 class="section-title">예약 상세</h3>
          <div class="booking-details">
            <div class="detail-row">
              <span class="label">체크인</span>
              <span class="value">{{
                formatDateTime(booking.reservationDto.checkIn)
              }}</span>
            </div>
            <div class="detail-row">
              <span class="label">체크아웃</span>
              <span class="value">{{
                formatDateTime(booking.reservationDto.checkOut)
              }}</span>
            </div>
            <div class="detail-row">
              <span class="label">투숙객</span>
              <span class="value">{{ booking.reservationDto.guests }}명</span>
            </div>
            <div class="status-wrapper">
              <span class="status-chip" :class="statusColor">{{
                statusText
              }}</span>
            </div>
          </div>
        </section>

        <!-- 결제 정보 -->
        <section class="info-card payment-card">
          <h3 class="section-title">결제 금액</h3>
          <div class="total-price">
            <span class="price-label">총 결제 금액</span>
            <span class="price-value"
              >₩{{ booking.reservationDto.price?.toLocaleString() }}</span
            >
          </div>
        </section>
      </div>

      <!-- 액션 버튼 -->
      <div v-if="booking.status === 'upcoming'" class="action-section">
        <button class="contact-btn" @click="contactHost">
          호스트에게 연락하기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const props = defineProps({
  id: {
    type: String,
    required: true,
  },
});

const booking = ref({
  hotelDto: {},
  userDto: {},
  reservationDto: {},
  status: "",
  hotelRating: 0,
  hotelReviewCount: 0,
  roomType: "",
  chatRoomId: "",
});

onMounted(async () => {
  try {
    console.log("렌더링시작");
    console.log(props.id);
    const response = await axios.post(
      `${process.env.VUE_APP_API_BASE_URL}/reservation/find/${props.id}`
    );
    console.log(response);
    booking.value = response.data;
  } catch (e) {
    console.log(e);
  }
});

const statusColor = computed(() => {
  switch (booking.value.status) {
    case "ongoing":
      return "status-ongoing";
    case "upcoming":
      return "status-upcoming";
    case "completed":
      return "status-completed";
    case "cancelled":
      return "status-cancelled";
    default:
      return "status-default";
  }
});

const statusText = computed(() => {
  switch (booking.value.status) {
    case "ongoing":
      return "투숙 중";
    case "upcoming":
      return "예약 확정";
    case "completed":
      return "투숙 완료";
    case "cancelled":
      return "예약 취소";
    default:
      return booking.value.status;
  }
});

const fullStars = computed(() => Math.floor(booking.value.hotelRating ?? 0));
const hasHalfStar = computed(() => booking.value.hotelRating % 1 !== 0 ?? 0);
const emptyStars = computed(
  () => 5 - Math.ceil(booking.value.hotelRating ?? 0)
);

const contactHost = (chatRoomId) => {
  router.push({ path: "/chat", query: { roomId: chatRoomId } });
};
const formatDateTime = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.booking-detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "SF Pro Text",
    Helvetica, Arial, sans-serif;
  background: #f8fafc;
  min-height: 80vh;
}

/* 상단 네비게이션 */
.nav-header {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  justify-content: center;
}

.page-title {
  font-size: 28px;
  font-weight: 800;
  color: #111827;
  margin: 0;
  letter-spacing: -0.025em;
}

/* 메인 카드 */
.booking-card {
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

/* 호텔 섹션 */
.hotel-section {
  padding: 32px;
  border-bottom: 1px solid #f3f4f6;
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
}

.hotel-content {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.hotel-image-wrapper {
  flex-shrink: 0;
}

.hotel-image {
  width: 120px;
  height: 90px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid #000000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.hotel-info {
  flex: 1;
  min-width: 0;
}

.hotel-name {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 12px 0;
  letter-spacing: -0.025em;
}

.hotel-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  color: #d1d5db;
  font-size: 16px;
}

.star.filled {
  color: #fbbf24;
}

.star.half {
  background: linear-gradient(90deg, #fbbf24 50%, #d1d5db 50%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.rating-text {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.hotel-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

.detail-item svg {
  flex-shrink: 0;
}

/* 정보 그리드 */
.info-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1px;
  background: #f3f4f6;
}

.info-card {
  background: #ffffff;
  padding: 28px;
  position: relative;
}

/* .info-card:hover {
  background: #fafbfc;
} */

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0 0 16px 0;
  letter-spacing: -0.025em;
  position: relative;
}

.section-title::after {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 30px;
  height: 2px;
  background: #000000;
}

.section-content {
  font-size: 16px;
  color: #374151;
  margin: 0;
  font-weight: 500;
}

/* 투숙객 정보 */
.guest-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.value {
  font-size: 14px;
  color: #111827;
  font-weight: 600;
  text-align: right;
}

/* 예약 상세 */
.booking-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-row:last-child {
  border-bottom: none;
}

.status-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.status-chip {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.status-ongoing {
  background: linear-gradient(135deg, gray 0%, gray 100%);
}
.status-upcoming {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #3b82f6;
}

.status-completed {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #10b981;
}

.status-cancelled {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #ef4444;
}

.status-default {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

/* 결제 카드 */
.payment-card {
  background: linear-gradient(135deg, #111827 0%, #374151 100%);
  color: #ffffff;
}

.payment-card .section-title {
  color: #ffffff;
}

.payment-card .section-title::after {
  background: #ffffff;
}

.total-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 8px;
}

.price-label {
  font-size: 16px;
  font-weight: 600;
  color: #d1d5db;
}

.price-value {
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.025em;
}

/* 액션 섹션 */
.action-section {
  padding: 32px;
  background: #f9fafb;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: center;
}

.contact-btn {
  background: #000000;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.025em;
}

.contact-btn:hover {
  background: #374151;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .booking-detail-container {
    padding: 16px;
  }

  .hotel-content {
    flex-direction: column;
    gap: 16px;
  }

  .hotel-image {
    width: 100px;
    height: 75px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-card {
    padding: 20px;
  }

  .page-title {
    font-size: 24px;
  }

  .hotel-name {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .booking-detail-container {
    padding: 12px;
  }

  .nav-header {
    margin-bottom: 24px;
  }

  .hotel-section {
    padding: 24px 20px;
  }

  .info-card {
    padding: 16px;
  }

  .action-section {
    padding: 24px 20px;
  }

  .hotel-image {
    width: 80px;
    height: 60px;
  }
}
</style>
