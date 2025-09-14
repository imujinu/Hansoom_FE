<template>
  <v-container fluid class="pa-0">
    <!-- 헤더 -->
    <v-app-bar color="white" elevation="1" class="">
      <v-btn icon variant="text" class="mr-2" @click="goBack">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="text-h6">숙소 객실 조회</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn variant="text" class="text-body-2">예약조회</v-btn>
      <v-btn variant="text" class="text-body-2">지원</v-btn>
      <v-btn variant="text" class="text-body-2">찜목록</v-btn>
      <v-btn variant="text" class="text-body-2">회원가입</v-btn>
      <v-btn variant="text" class="text-body-2">로그인하기</v-btn>
    </v-app-bar>

    <v-container class="mt-6">
      <!-- 호텔 정보 -->
      <v-card class="mb-6">
        <v-row no-gutters>
          <v-col cols="12" md="4">
            <v-img :src="hotelData.imageUrl" height="250px" cover></v-img>
          </v-col>
          <v-col cols="12" md="8" class="pa-4">
            <h2 class="text-h5 font-weight-bold mb-2">{{ hotelData.name }}</h2>
            <p class="text-body-2 text-grey-darken-1 mb-2">
              {{ hotelData.address }}
            </p>
            <div class="d-flex align-center mb-2">
              <span
                v-for="n in Math.floor(hotelData.rating)"
                :key="n"
                class="text-yellow"
                >★</span
              >
              <span v-if="hotelData.rating % 1 !== 0">☆</span>
              <span class="ml-2 text-caption"
                >({{ hotelData.reviewCount }}개 리뷰)</span
              >
            </div>
            <v-chip
              v-for="(amenity, i) in hotelData.amenities"
              :key="i"
              size="small"
              class="mr-2"
            >
              {{ amenity }}
            </v-chip>
          </v-col>
        </v-row>
      </v-card>

      <!-- 날짜 선택 -->
      <v-card class="mb-6 pa-4">
        <h3 class="text-h6 font-weight-bold mb-4">예약 날짜 선택</h3>
        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="checkInDate"
              label="체크인"
              type="date"
              dense
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="checkOutDate"
              label="체크아웃"
              type="date"
              dense
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="guestCount"
              :items="['성인 1명', '성인 2명', '성인 3명', '성인 4명']"
              label="투숙객"
              dense
            ></v-select>
          </v-col>
        </v-row>
        <v-btn color="primary" class="mt-2" @click="handleSearchRooms">
          <v-icon left>mdi-magnify</v-icon>
          객실 검색
        </v-btn>
      </v-card>

      <!-- 객실 목록 -->
      <v-card class="mb-6">
        <v-card-title class="d-flex flex-column align-start">
          <span class="text-h6 font-weight-bold">예약 가능한 객실</span>
          <span class="text-caption text-grey-darken-1"
            >{{ checkInDate }} - {{ checkOutDate }}</span
          >
        </v-card-title>
        <v-divider></v-divider>

        <v-list>
          <v-list-item
            v-for="room in roomsData"
            :key="room.id"
            class="py-4"
            :disabled="!room.isAvailable"
          >
            <v-row>
              <v-col cols="12" md="4">
                <v-img
                  :src="room.imageUrl"
                  height="160px"
                  cover
                  class="rounded-lg"
                >
                  <template v-if="!room.isAvailable">
                    <div
                      class="fill-height d-flex align-center justify-center"
                      style="background: rgba(0, 0, 0, 0.4)"
                    >
                      <span class="white--text font-weight-bold"
                        >예약 마감</span
                      >
                    </div>
                  </template>
                </v-img>
              </v-col>
              <v-col cols="12" md="5">
                <h4 class="text-subtitle-1 font-weight-bold mb-1">
                  {{ room.name }}
                </h4>
                <p class="text-body-2 mb-1">{{ room.size }}</p>
                <p class="text-body-2">침대: {{ room.bedType }}</p>
                <p class="text-body-2">최대 {{ room.maxOccupancy }}명</p>
                <div class="d-flex flex-wrap mt-1">
                  <v-chip
                    v-for="(a, i) in room.amenities"
                    :key="i"
                    size="x-small"
                    class="mr-1 mb-1"
                  >
                    {{ a }}
                  </v-chip>
                </div>
              </v-col>
              <v-col
                cols="12"
                md="3"
                class="d-flex flex-column align-end justify-space-between"
              >
                <div class="mb-3">
                  <div class="text-h6 font-weight-bold text-primary">
                    ₩{{ room.pricePerNight.toLocaleString() }}
                  </div>
                  <div class="text-caption text-grey-darken-1">
                    세금 및 수수료 포함
                  </div>
                </div>
                <v-btn
                  :color="room.isAvailable ? 'primary' : 'grey'"
                  :disabled="!room.isAvailable"
                  @click="handleSelectRoom(room)"
                >
                  {{ room.isAvailable ? "선택" : "선택 불가" }}
                </v-btn>
              </v-col>
            </v-row>
          </v-list-item>
        </v-list>
      </v-card>

      <!-- 예약 안내 -->
      <v-alert type="info" border="start" class="mt-4">
        <div class="text-subtitle-2 font-weight-bold mb-1">예약 안내</div>
        <ul class="text-body-2 mb-0">
          <li>• 체크인: 오후 3시, 체크아웃: 오전 11시</li>
          <li>• 객실 예약은 선착순으로 진행됩니다</li>
          <li>• 무료 취소는 체크인 24시간 전까지 가능합니다</li>
          <li>• 조식은 오전 7시부터 10시까지 제공됩니다</li>
        </ul>
      </v-alert>
    </v-container>
  </v-container>
</template>

<script>
import { useRouter } from "vue-router";
import { reactive, toRefs } from "vue";

export default {
  setup() {
    const router = useRouter();

    const data = reactive({
      checkInDate: "2024-08-15",
      checkOutDate: "2024-08-17",
      guestCount: "성인 2명",
      hotelData: {
        name: "오션뷰 디럭스 호텔",
        address: "부산 해운대구 해운대해변로 264",
        rating: 4.5,
        reviewCount: 123,
        amenities: ["무료 Wi-Fi", "주차장", "수영장", "피트니스"],
        imageUrl:
          "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&h=600",
      },
      roomsData: [
        {
          id: "standard-ocean",
          name: "스탠다드 오션뷰",
          size: "32m² • 침실 1개 • 바다 전망",
          bedType: "퀸 침대 2개",
          maxOccupancy: 3,
          amenities: ["무료 Wi-Fi", "조식 포함", "무료 취소"],
          pricePerNight: 120000,
          availableCount: 3,
          isAvailable: true,
          imageUrl:
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&h=400",
        },
        {
          id: "deluxe-ocean",
          name: "디럭스 오션뷰",
          size: "42m² • 침실 1개 • 발코니 • 바다 전망",
          bedType: "킹 침대 1개",
          maxOccupancy: 2,
          amenities: ["무료 Wi-Fi", "조식 포함", "무료 취소", "미니바"],
          pricePerNight: 180000,
          availableCount: 2,
          isAvailable: true,
          imageUrl:
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&h=400",
        },
        {
          id: "premium-suite",
          name: "프리미엄 스위트",
          size: "65m² • 침실 1개 • 거실 • 발코니 • 바다 전망",
          bedType: "킹 침대 1개",
          maxOccupancy: 4,
          amenities: ["무료 Wi-Fi", "조식 포함", "무료 취소", "컨시어지"],
          pricePerNight: 280000,
          availableCount: 1,
          isAvailable: true,
          imageUrl:
            "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&h=400",
        },
        {
          id: "family-suite",
          name: "패밀리 스위트",
          size: "85m² • 침실 2개 • 거실 • 발코니 • 바다 전망",
          bedType: "킹 침대 1개, 싱글 침대 2개",
          maxOccupancy: 6,
          amenities: ["무료 Wi-Fi", "조식 포함", "키즈룸"],
          pricePerNight: 350000,
          availableCount: 0,
          isAvailable: false,
          imageUrl:
            "https://images.unsplash.com/photo-1568495248636-6432b97bd949?auto=format&fit=crop&w=600&h=400",
        },
      ],
    });

    const handleSearchRooms = () => {
      console.log(
        "검색:",
        data.checkInDate,
        data.checkOutDate,
        data.guestCount
      );
    };

    const handleSelectRoom = (room) => {
      router.push({
        path: "/reservation",
        query: {
          checkIn: data.checkInDate,
          checkOut: data.checkOutDate,
          guestCount: data.guestCount,
          roomName: room.name,
          roomSize: room.size,
          bedType: room.bedType,
          maxOccupancy: room.maxOccupancy,
          pricePerNight: room.pricePerNight,
          hotelName: data.hotelData.name,
          hotelAddress: data.hotelData.address,
          roomImageUrl: room.imageUrl,
        },
      });
    };

    return {
      ...toRefs(data),
      handleSearchRooms,
      handleSelectRoom,
    };
  },
};
</script>

<style scoped>
.text-yellow {
  color: #ffc107;
}
</style>
