<template>
  <div>
    <v-btn
      block
      @click="requestPayment"
      style="background-color: #000000; color: #ffffff"
    >
      {{ formatPrice(props.totalPrice) }} 원 결제하기
    </v-btn>

    <!-- 실패 모달 -->
    <v-dialog v-model="showErrorModal" persistent max-width="500">
      <v-card>
        <v-card-title class="text-h5">예약 실패</v-card-title>
        <v-card-text>
          {{ errorMessage }}
          <div v-if="redirectCountdown > 0">
            {{ redirectCountdown }}초 후 호텔 검색 페이지로 이동합니다.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="stopCountdownAndGoHome" color="primary" text>
            홈으로 돌아가기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
/* global TossPayments */
import { ref } from "vue";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "vue-router";
import axios from "axios";

const props = defineProps({
  guestInfo: Object,
  booking: Object,
  totalPrice: Number,
});

const router = useRouter();
const showErrorModal = ref(false);
const errorMessage = ref("");
const redirectCountdown = ref(0);
let countdownInterval = null;
let id = null;
const formatPrice = (price) => (price ? price.toLocaleString() : 0);
const stopCountdownAndGoHome = () => {
  if (countdownInterval) clearInterval(countdownInterval);
  router.push("/");
};
const requestPayment = async () => {
  if (
    !props.guestInfo?.name ||
    !props.guestInfo?.email ||
    !props.guestInfo?.phone
  ) {
    alert("필수 정보를 모두 입력해주세요.");
    return;
  }
  const phoneRegex = /^01[016789]\d{7,8}$/;
  if (!phoneRegex.test(props.guestInfo.phone)) {
    alert(
      "휴대폰 번호를 010, 011, 016, 017, 018, 019로 시작하는 10~11자리로 입력해주세요."
    );
    return;
  }
  if (!props.booking?.room?.pricePerNight || !props.booking?.dates?.nights) {
    alert("예약 정보를 확인해주세요.");
    return;
  }
  const data = {
    hotelId: props.booking.hotelId,
    roomId: props.booking.room.id,
    checkIn: props.booking.checkIn,
    checkOut: props.booking.checkOut,
    price: props.booking?.room.pricePerNight * props.booking?.dates.nights,
    reservationTime: new Date().toISOString(),
    guest: props.guestCount,
    people: props.booking?.room.guestCount,
    requests: props.guestInfo?.requests,
  };

  console.log(data.hotelId);
  // let id = 0;
  let reservationId = 0;
  try {
    const response = await axios.post(
      `${process.env.VUE_APP_API_BASE_URL}/reservation/confirm`,
      data
    );
    console.log(response.data);

    if (
      !response.data ||
      !response.data.result ||
      response.data.result.status === "FAIL"
    ) {
      throw new Error(
        response.data?.result?.message || "예약 처리에 실패했습니다."
      );
    }
    id = response.data?.result?.id;
    reservationId = response.data?.result?.reservationId;
  } catch (e) {
    if (e.status == 500) {
      errorMessage.value =
        e.response.data.status_message.split(":")[1] ||
        "예약 처리에 실패했습니다.";
    } else {
      errorMessage.value = e.message || "예기치 못한 오류가 발생했습니다.";
    }
    showErrorModal.value = true;
    redirectCountdown.value = 3;
    countdownInterval = setInterval(() => {
      redirectCountdown.value--;
      if (redirectCountdown.value <= 0) {
        clearInterval(countdownInterval);
        router.push("/hotel/search");
      }
    }, 1000);
    return;
  }
  try {
    const clientKey = "test_ck_pP2YxJ4K879wRK7gq2RWVRGZwXLO";
    const tossPayments = TossPayments(clientKey);

    // 회원 결제
    const customerKey = uuidv4();
    const payment = tossPayments.payment({ customerKey });

    await payment.requestPayment({
      method: "CARD", // 카드 결제
      amount: {
        currency: "KRW",
        value: Number(props.totalPrice),
      },
      orderId: reservationId, // 고유 주문번호 (실제로는 서버에서 생성/저장해야 안전)
      orderName: "호텔 예약 결제",
      successUrl: window.location.origin + "/success",
      failUrl: window.location.origin + "/fail",
      customerEmail: props.guestInfo?.email || "",
      customerName: props.guestInfo?.name || "",
      customerMobilePhone: props.guestInfo?.phone || "",
      card: {
        useEscrow: false,
        flowMode: "DEFAULT",
        useCardPoint: false,
        useAppCardOnly: false,
      },
    });
  } catch (e) {
    const response = await axios.patch(
      `${process.env.VUE_APP_API_BASE_URL}/reservation/cancel/${id}`
    );
    console.log("예약취소=========", response);
    console.error(e);
    errorMessage.value =
      e.response?.data?.status_message?.split(":")[1] ||
      e.message ||
      "예기치 못한 오류가 발생했습니다.";
    showErrorModal.value = true;
    redirectCountdown.value = 5;

    countdownInterval = setInterval(() => {
      redirectCountdown.value--;
      if (redirectCountdown.value <= 0) {
        clearInterval(countdownInterval);
        router.push("/hotel/search");
      }
    }, 1000);
  }
};
</script>
