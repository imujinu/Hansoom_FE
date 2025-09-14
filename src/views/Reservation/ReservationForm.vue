<template>
  <v-app>
    <v-main>
      <!-- Hero Section -->
      <section class="hero-section">
        <img class="hero-image" :src="booking.hotelImage" alt="호텔 이미지" />
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <h1>예약을 완료해주세요</h1>
          <p>프리미엄 서비스를 경험하며 최상의 호스피탈리티를 누리세요</p>
        </div>
      </section>

      <!-- Booking Section -->
      <section class="booking-section">
        <!-- 왼쪽: 예약자 정보 + 결제 -->
        <div class="booking-left">
          <div class="info-payment-wrapper">
            <div class="info-card">
              <h3>예약자 정보</h3>
              <div class="info-field">
                <label>이름 :</label>
                <input
                  type="text"
                  v-model="guestInfo.name"
                  placeholder="이름을 입력하세요"
                  class="styled-input"
                  :class="{ error: validationErrors.name }"
                  @blur="validateName"
                  @focus="clearError('name')"
                />
                <div v-if="validationErrors.name" class="error-message">
                  {{ validationErrors.name }}
                </div>
              </div>
              <div class="info-field">
                <label>전화번호 :</label>
                <input
                  type="text"
                  v-model="guestInfo.phone"
                  placeholder="전화번호를 입력하세요"
                  class="styled-input"
                  :class="{ error: validationErrors.phone }"
                  @blur="validatePhone"
                  @focus="clearError('phone')"
                />
                <div v-if="validationErrors.phone" class="error-message">
                  {{ validationErrors.phone }}
                </div>
              </div>
              <div class="info-field">
                <label>이메일 :</label>
                <input
                  type="text"
                  v-model="guestInfo.email"
                  placeholder="이메일을 입력하세요"
                  class="styled-input"
                  :class="{ error: validationErrors.email }"
                  @blur="validateEmail"
                  @focus="clearError('email')"
                />
                <div v-if="validationErrors.email" class="error-message">
                  {{ validationErrors.email }}
                </div>
              </div>
            </div>
            <div class="payment-widget">
              <PaymentCheckout
                v-if="totalPrice > 0"
                :guestInfo="guestInfo"
                :booking="booking"
                :disabled="waiting"
                :totalPrice="totalPrice"
              />
            </div>
          </div>
        </div>

        <!-- 오른쪽: 예약 요약 -->
        <div class="booking-summary-wrapper">
          <div class="booking-summary">
            <h3>예약 내역</h3>
            <div class="hotel-name">{{ booking.hotelName }}</div>
            <img
              class="room-image"
              :src="booking.room.imageUrl || 'https://picsum.photos/400/200'"
              alt="룸 이미지"
            />
            <div>
              <strong>{{ booking.room.name }}</strong>
            </div>
            <div>
              {{ booking.checkIn }} ~ {{ booking.checkOut }} ({{
                booking.dates.nights
              }}박)
            </div>
            <div>
              예약 인원: {{ booking.room.guestCount }}명 / 최대:
              {{ booking.room.maxOccupancy }}명
            </div>
            <div>총 결제 금액: ₩{{ formatPrice(totalPrice) }}</div>
          </div>
        </div>
      </section>

      <!-- Loading Dialog -->
      <v-dialog class="queue-rank" v-model="waiting" persistent max-width="400">
        <div class="loading-dialog">
          <v-progress-circular indeterminate size="70" color="primary" />
          <h3>현재 대기 중입니다…</h3>
          <p>대기 순번: {{ queueRank }}</p>
        </div>
        <v-btn :style="{ backgroundColor: '#FFB3AB', color: '#FFF' }" to="/"
          >나가기</v-btn
        >
      </v-dialog>
    </v-main>
  </v-app>
</template>

<script setup>
import { reactive, computed, onMounted, ref, onBeforeUnmount } from "vue";
import { onBeforeRouteLeave, useRoute } from "vue-router";
import PaymentCheckout from "../Payment/PaymentCheckout.vue";
import axios from "axios";
import { EventSourcePolyfill } from "event-source-polyfill";

const route = useRoute();

const guestInfo = reactive({
  name: "",
  phone: "",
  email: "",
});

const booking = reactive({
  hotelId: "",
  hotelName: "",
  hotelAddress: "",
  checkIn: "",
  checkOut: "",
  hotelImage: "",
  room: {
    id: "",
    name: "",
    size: "",
    bedType: "",
    imageUrl: "",
    pricePerNight: 0,
    standardPeople: 0,
  },
  maxOccupancy: 0,
  dates: {
    nights: 0,
  },
});

// 유효성 검사 에러 상태
const validationErrors = reactive({
  name: "",
  phone: "",
  email: "",
});

// 유효성 검사 함수들
const validateName = () => {
  if (!guestInfo.name.trim()) {
    validationErrors.name = "이름은 필수 입력 정보입니다.";
  } else {
    validationErrors.name = "";
  }
};

const validatePhone = () => {
  const phoneRegex = /^010\d{7,8}$/;
  const cleanPhone = guestInfo.phone.replace(/-/g, "");

  if (!cleanPhone) {
    validationErrors.phone = "휴대폰 번호는 필수 입력 정보입니다.";
  } else if (!phoneRegex.test(cleanPhone)) {
    validationErrors.phone =
      "휴대폰번호는 010으로 시작하는 10~11자리의 숫자를 적어주세요.";
  } else {
    validationErrors.phone = "";
  }
};

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!guestInfo.email.trim()) {
    validationErrors.email = "이메일은 필수 입력 정보입니다.";
  } else if (!emailRegex.test(guestInfo.email)) {
    validationErrors.email = "올바른 이메일 형식을 입력해주세요.";
  } else {
    validationErrors.email = "";
  }
};

const clearError = (field) => {
  validationErrors[field] = "";
};

// 대기열 상태
const queueRank = ref(null);
const waiting = ref(false);
const userId = ref(null);
onMounted(() => {
  userId.value = localStorage.getItem("userId");

  const q = route.query;
  console.log("q=========");
  console.log(q);
  if (q.checkIn && q.roomName) {
    booking.checkIn = q.checkIn;
    booking.checkOut = q.checkOut;
    booking.hotelId = q.hotelId;
    booking.room.id = q.roomId;
    booking.hotelName = q.hotelName || "";
    booking.hotelAddress = q.hotelAddress || "";
    booking.hotelImage = q.hotelImage || "";
    booking.room.name = q.roomName;
    booking.room.size = q.roomSize || "";
    booking.room.bedType = q.bedType || "";
    booking.room.imageUrl = q.roomImageUrl || "";
    booking.room.pricePerNight = Number(q.pricePerNight) || 0;
    booking.room.guestCount = Number(q.guestCount) || 0;
    booking.room.maxOccupancy = Number(q.maxOccupancy) || 0;
    const checkInDate = new Date(q.checkIn);
    const checkOutDate = new Date(q.checkOut);
    booking.dates.nights =
      Math.floor((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)) || 0;
  }
  // enterQueue();
  subscribeQueue();
  window.addEventListener("beforeunload", exitQueue);
});
const data = computed(() => ({
  hotelId: booking.hotelId,
  roomId: booking.room.id,
  userId: userId.value,
  checkInDate: booking.checkIn,
}));
// const enterQueue = async () => {
//   await axios
//     .post(`${process.env.VUE_APP_API_BASE_URL}/reservation/enter`, data)
//     .then((res) => {
//       waiting.value = !res.data.entered;
//     });
// };
const sse = ref(null);
const subscribeQueue = () => {
  const handleBook = (event) => {
    console.log("[SSE] book:", event.data);
  };

  const handleQueueUpdate = (event) => {
    const payload = JSON.parse(event.data);
    // console.log(payload);
    queueRank.value = payload.myRank;
    waiting.value = !payload.inQueue && payload.myRank >= 3;
    // waiting.value = true;
  };

  const accessToken = localStorage.getItem("accessToken");
  console.log(data.value);
  sse.value = new EventSourcePolyfill(
    `${process.env.VUE_APP_API_BASE_URL}/reservation/connect?hotelId=${data.value.hotelId}&roomId=${data.value.roomId}&checkInDate=${data.value.checkInDate}&userId=${userId.value}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  sse.value.addEventListener("book", handleBook);
  sse.value.addEventListener("queue-update", handleQueueUpdate);
};

const cleanup = () => {
  if (sse.value) {
    sse.value.close();
    sse.value = null;
  }
  exitQueue();
};

onBeforeUnmount(() => {
  cleanup();
  window.removeEventListener("beforeunload", exitQueue);
});

onBeforeRouteLeave(() => {
  cleanup();
  window.removeEventListener("beforeunload", exitQueue);
});

const exitQueue = () => {
  axios.post(
    `${process.env.VUE_APP_API_BASE_URL}/reservation/leave`,
    data.value
  );
};

const totalPrice = computed(
  () => booking.room.pricePerNight * booking.dates.nights
);

// 가격 포맷 함수
const formatPrice = (price) => {
  return price ? price.toLocaleString() : 0;
};
</script>

<style scoped>
.hero-section {
  position: relative;
  text-align: center;
  height: 400px;
}
.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.5;
}
.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.hero-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #333;
}
.hero-content h1 {
  font-size: 48px;
  font-weight: bold;
}

.booking-section {
  display: flex;
  max-width: 1200px;
  margin: 40px auto;
  gap: 20px;
  padding: 0 20px;
  align-items: flex-start;
}

/* 왼쪽: 예약자 + 결제 */
.booking-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  justify-content: stretch;
}
.info-payment-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.info-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 2px solid #000;
}

.info-card h3 {
  margin-bottom: 15px;
  color: #000;
  font-weight: bold;
  font-size: 18px;
}

.info-field {
  margin-bottom: 20px;
}

.info-field label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #000;
  font-size: 14px;
}

/* 블랙앤화이트 스타일 입력 필드 */
.styled-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e5e7eb;
  background: #fff;
  border-radius: 0;
  font-size: 14px;
  transition: all 0.2s ease;
  color: #000;
}

.styled-input:focus {
  outline: none;
  border-color: #e2e8f0;
  box-shadow: inset 0 0 0 2px #e2e8f0;
}

.styled-input.error {
  border-color: #e74c3c;
  background-color: #fff5f5;
}

.styled-input.error:focus {
  border-color: #e74c3c;
  box-shadow: inset 0 0 0 2px #e74c3c;
}

.styled-input::placeholder {
  color: #666;
  font-style: italic;
}

/* 에러 메시지 스타일 */
.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 6px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.error-message::before {
  content: "⚠ ";
  margin-right: 4px;
}

.payment-widget {
  flex: 1;
}

/* 오른쪽: 예약 요약 */
.booking-summary-wrapper {
  position: sticky;
  top: 20px;
  max-height: calc(100vh - 40px);
  align-self: flex-start;
}

.booking-summary {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 2px solid #000;
  border-radius: 5%;
  padding: 20px;
  width: auto;
  max-width: 400px;
  overflow-y: auto;
  height: auto;
  background: #fff;
}

.booking-summary h3 {
  color: #000;
  font-weight: bold;
  margin-bottom: 15px;
  font-size: 18px;
}

.hotel-name {
  font-weight: bold;
  font-size: 18px;
  color: #000;
}

.room-image {
  width: 100%;
  border: 2px solid #e5e7eb;
  border-radius: 0;
}

.booking-summary > div {
  color: #000;
  line-height: 1.5;
}

/* Loading dialog 중앙 정렬 */
.loading-dialog {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* 모바일 반응형 */
@media (max-width: 900px) {
  .booking-section {
    flex-direction: column;
  }
  .booking-summary-wrapper {
    position: relative;
    max-height: none;
  }
}

.queue-rank {
  font-size: 20px;
  font-weight: bold;
  color: #000; /* 검은색으로 진하게 */
  margin-top: 8px;
}
</style>
