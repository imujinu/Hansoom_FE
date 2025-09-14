<template>
  <div class="success-page">
    <div v-if="loading" class="loading-state">
      <h2>결제가 진행 중입니다...</h2>
      <p>잠시만 기다려주세요.</p>
    </div>

    <div v-else-if="success" class="summary-container">
      <div class="booking-summary-card">
        <h3 class="summary-title">예약 완료</h3>
        <p class="order-id">
          예약 번호 :
          {{
            booking.reservation.reservationId
              ? booking.reservation.reservationId.split("-")[0]
              : ""
          }}
        </p>

        <div class="hotel-info-horizontal">
          <img class="hotel-image" :src="booking.hotel.image" alt="룸 이미지" />
          <div class="hotel-details">
            <div class="hotel-name">{{ booking.hotel.name }}</div>
            <div class="room-name">{{ booking.reservation.roomType }}</div>
            <div class="room-dates">
              {{ booking.reservation.checkIn }} ~
              {{ booking.reservation.checkOut }}
            </div>
            <div class="guest-count">
              예약 인원: {{ booking.reservation.guests }}명
            </div>
          </div>
        </div>

        <div class="total-price">
          총 결제 금액:
          <span>₩{{ booking.reservation.price }}</span>
        </div>
        <p v-if="countdown > 0" class="auto-redirect">
          잠시 후 예약 상세 페이지로 이동합니다. ({{ countdown }}초)
        </p>

        <v-btn block color="#111" @click="goHome">홈으로 돌아가기</v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
const countdown = ref(3);
const router = useRouter();
const paymentKey = ref("");
const orderId = ref("");
const amount = ref("");
const loading = ref(true);
const success = ref(false);
const reservationId = ref("");
const booking = reactive({
  chatRoomId: null,
  hotel: {
    name: "",
    address: "",
    image: "",
    phone: "",
    rating: 0,
    reviewCount: 0,
  },
  reservation: {
    id: "",
    reservationId: "",
    checkIn: "",
    checkOut: "",
    guests: 0,
    price: 0,
    request: null,
    roomType: "",
    status: "",
  },
  user: {
    name: "",
    email: "",
    phone: "",
  },
});

async function generateAESKeyAndIV() {
  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const rawKey = await window.crypto.subtle.exportKey("raw", key);
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 12바이트 추천

  return {
    key: btoa(String.fromCharCode(...new Uint8Array(rawKey))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}
let countdownTimer = null;
const confirmPayment = async () => {
  const requestData = {
    paymentKey: paymentKey.value,
    orderId: orderId.value,
    amount: amount.value,
  };
  try {
    await axios.post(
      `${process.env.VUE_APP_API_BASE_URL}/payment/confirm`,
      requestData,
      { headers: { "Content-Type": "application/json" } }
    );

    const completeRes = await axios.post(
      `${process.env.VUE_APP_API_BASE_URL}/reservation/complete`,
      { reservationId: orderId.value }
    );
    console.log(completeRes.data);
    reservationId.value = completeRes.data.result.reservationId;
    const cryptoData = await generateAESKeyAndIV();

    // 채팅 처리
    await axios.post(`${process.env.VUE_APP_API_BASE_URL}/chat/room/create`, {
      reservationId: reservationId.value,
      aesKey: cryptoData.key,
      iv: cryptoData.iv,
    });

    await axios.post(
      `${process.env.VUE_APP_API_BASE_URL}/chat/room/join/${reservationId.value}`
    );

    success.value = true;
    const { data } = await axios.post(
      `${process.env.VUE_APP_API_BASE_URL}/reservation/find/${reservationId.value}`
    );
    console.log(data);
    booking.chatRoomId = data.chatRoomId;
    booking.hotel = data.hotelDto;
    booking.reservation = data.reservationDto;
    booking.user = data.userDto;

    // 결제 완료 시 알림 초기화
    try {
      window.dispatchEvent(new CustomEvent('refresh-notifications'));
      console.log('결제 완료: 알림 초기화 요청');
    } catch (error) {
      console.error('알림 초기화 실패:', error);
    }

    countdownTimer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(countdownTimer); // 전역 변수라 goHome에서도 접근 가능
        router.replace({
          name: "ReservationDetail",
          params: { id: reservationId.value },
        });
      }
    }, 1000);
  } catch (err) {
    const response = axios.patch(
      `${process.env.VUE_APP_API_BASE_URL}/reservation/cancel/${reservationId.value}`
    );
    console.log("예약취소=========", response);
    let message = "결제 실패";
    if (err.response && err.response.data) {
      message = err.response.data.message || JSON.stringify(err.response.data);
    } else {
      message = err.message;
    }

    router.push({ path: "/fail", query: { msg: message } });
  } finally {
    loading.value = false;
  }
};
const goHome = () => {
  if (countdownTimer) clearInterval(countdownTimer);
  router.push("/");
};
onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  paymentKey.value = urlParams.get("paymentKey") || "";
  orderId.value = urlParams.get("orderId") || "";
  amount.value = urlParams.get("amount") || "";

  await confirmPayment();

  window.history.replaceState(null, "", window.location.href);
  window.addEventListener("popstate", () => {
    window.history.replaceState(null, "", window.location.href);
  });
});
</script>

<style scoped>
.success-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 80vh;
  padding: 40px 20px;
  background-color: #f7f9fc;
}

.loading-state {
  text-align: center;
  font-size: 18px;
  color: #555;
}

.summary-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

.booking-summary-card {
  background: #fff;
  border-radius: 16px;
  padding: 30px 25px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 20px;
  text-align: left;
}

.summary-title {
  font-size: 26px;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
}

.order-id {
  font-size: 15px;
  color: #6b7280;
  text-align: center;
}

.hotel-info-horizontal {
  display: flex;
  gap: 15px;
  align-items: center;
}

.hotel-image {
  width: 200px;
  height: 150px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;
}

.hotel-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hotel-name {
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.room-name {
  font-size: 17px;
  color: #374151;
}

.room-dates,
.guest-count {
  font-size: 14px;
  color: #6b7280;
}

.total-price {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
}

.total-price span {
  font-size: 22px;
}

.v-btn {
  margin-top: 15px;
}
</style>
