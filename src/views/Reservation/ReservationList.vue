<template>
  <div class="booking-history-container">
    <div class="container">
      <!-- 헤더 -->
      <div class="page-header">
        <h1 class="page-title">예약내역</h1>
      </div>

      <!-- 안내 메시지 -->
      <div class="info-alert">
        <div class="info-icon">ℹ️</div>
        <div class="info-text">자세한 문의는 호스트연락을 통해 가능합니다!</div>
      </div>

      <!-- 필터 영역 -->
      <div class="filter-section">
        <div class="filter-row">
          <!-- 날짜 필터 -->
          <div class="date-filter-group">
            <button class="date-filter-btn" @click="openDateModal">
              <span class="filter-icon">📅</span>
              <span>{{ dateFilterText }}</span>
            </button>
            <button
              v-if="dateFilter.startDate || dateFilter.endDate"
              class="clear-filter-btn"
              @click="clearDateFilter"
            >
              ✕ 초기화
            </button>
          </div>

          <!-- 정렬 필터 -->
          <div class="sort-filter-group">
            <select v-model="sortOrder" class="sort-select">
              <option value="latest">최신순</option>
              <option value="oldest">과거순</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 탭 -->
      <div class="tab-container">
        <div class="tab-list">
          <button
            :class="['tab-button', { active: activeTab === 'active' }]"
            @click="activeTab = 'active'"
          >
            이용예정 및 이용중
          </button>
          <button
            :class="['tab-button', { active: activeTab === 'completed' }]"
            @click="activeTab = 'completed'"
          >
            이용완료 및 예약취소
          </button>
        </div>
      </div>

      <!-- 탭 내용 -->
      <div class="tab-content">
        <!-- 이용예정 및 이용중 탭 -->
        <div v-if="activeTab === 'active'">
          <div v-if="filteredActiveBookings.length === 0" class="empty-state">
            <div class="empty-icon">📅</div>
            <div class="empty-title">
              {{
                dateFilter.startDate || dateFilter.endDate
                  ? "해당 기간에 예정된 여행이 없습니다."
                  : "예정된 여행이 없습니다."
              }}
            </div>
            <div class="empty-desc">지금 새로운 예약을 진행해보세요.</div>
            <button class="cta-button" @click="router.push('/')">
              여행지 찾아보기
            </button>
          </div>

          <div v-else class="booking-grid">
            <div
              v-for="booking in paginatedActiveBookings"
              :key="booking.id"
              class="booking-card"
              @click="viewDetails(booking.id)"
            >
              <!-- 상태 배지 -->
              <div :class="['status-badge', statusClass(booking.status)]">
                {{ statusText(booking.status) }}
              </div>

              <div class="card-content">
                <!-- 정보 (왼쪽) -->
                <div class="info-section">
                  <div class="reservation-number">
                    예약 번호:
                    {{
                      booking.reservationNumber &&
                      booking.reservationNumber.split("-")[0]
                    }}
                  </div>

                  <h3 class="hotel-name">{{ booking.hotelName }}</h3>

                  <div class="location">
                    <span class="location-icon">📍</span>
                    {{ booking.address }}
                  </div>

                  <div class="rating">
                    <div class="stars">
                      <span class="star"> 평점 </span>
                      <span
                        v-for="i in fullStars(booking.hotelRating)"
                        :key="`full-${i}`"
                        class="star filled"
                        >⭐</span
                      >
                      <span
                        v-if="hasHalfStar(booking.hotelRating)"
                        class="star half"
                        >⭐</span
                      >
                    </div>
                    <span class="rating-text">{{ booking.hotelRating }}</span>
                  </div>

                  <div class="booking-details">
                    <div class="detail-row">
                      <div class="detail-item">
                        <div class="detail-label">객실 타입</div>
                        <div class="detail-value">{{ booking.roomType }}</div>
                      </div>
                      <div class="detail-item">
                        <div class="detail-label">투숙 인원</div>
                        <div class="detail-value">{{ booking.guests }}명</div>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <div class="detail-label">체크인</div>
                        <div class="detail-value">
                          {{ formatDisplayDate(booking.checkIn) }}
                        </div>
                      </div>
                      <div class="detail-item">
                        <div class="detail-label">체크아웃</div>
                        <div class="detail-value">
                          {{ formatDisplayDate(booking.checkOut) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 이미지 및 액션 (오른쪽) -->
                <div class="image-action-section">
                  <!-- 이미지 -->
                  <div class="image-section">
                    <img
                      :src="booking.hotelImage"
                      :alt="booking.hotelName"
                      class="hotel-image"
                    />
                  </div>

                  <!-- 가격 및 버튼들 -->
                  <div class="price-info">
                    <span class="price-value">
                      결제 금액 : ₩{{ booking.totalPrice.toLocaleString() }}
                    </span>
                  </div>

                  <div class="action-buttons">
                    <button
                      class="action-btn primary"
                      @click.stop="viewDetails(booking.id)"
                    >
                      <span class="btn-icon">👁️</span>
                      상세 보기
                    </button>
                    <button
                      v-if="
                        !router.currentRoute.value.path.startsWith(
                          '/myhostpage'
                        )
                      "
                      class="action-btn outline"
                      @click.stop="contactHost(booking.chatRoomId)"
                    >
                      <span class="btn-icon">💬</span>
                      호스트 연락
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 페이지네이션 -->
          <div
            v-if="filteredActiveBookings.length > 0"
            class="pagination-wrapper"
          >
            <div class="pagination">
              <button
                v-for="page in activeTotalPages"
                :key="page"
                :class="['page-btn', { active: activeCurrentPage === page }]"
                @click="activeCurrentPage = page"
              >
                {{ page }}
              </button>
            </div>
          </div>
        </div>

        <!-- 이용완료 및 예약취소 탭 -->
        <div v-if="activeTab === 'completed'">
          <div
            v-if="filteredCompletedBookings.length === 0"
            class="empty-state"
          >
            <div class="empty-icon">📅</div>
            <div class="empty-title">
              {{
                dateFilter.startDate || dateFilter.endDate
                  ? "해당 기간에 예약 내역이 없습니다"
                  : "예약 내역이 없습니다"
              }}
            </div>
            <div class="empty-desc">해당되는 예약 내역이 없습니다.</div>
          </div>

          <div v-else class="booking-grid">
            <div
              v-for="booking in paginatedCompletedBookings"
              :key="booking.id"
              class="booking-card"
              @click="viewDetails(booking.id)"
            >
              <!-- 상태 배지 -->
              <div :class="['status-badge', statusClass(booking.status)]">
                {{ statusText(booking.status) }}
              </div>

              <div class="card-content">
                <!-- 정보 (왼쪽) -->
                <div class="info-section">
                  <div class="reservation-number">
                    예약번호 :
                    {{
                      booking.reservationNumber &&
                      booking.reservationNumber.split("-")[0]
                    }}
                  </div>

                  <h3 class="hotel-name">{{ booking.hotelName }}</h3>

                  <div class="location">
                    <span class="location-icon">📍</span>
                    {{ booking.address }}
                  </div>

                  <div class="rating">
                    <div class="stars">
                      <span
                        v-for="i in fullStars(booking.hotelRating)"
                        :key="`full-${i}`"
                        class="star filled"
                        >⭐</span
                      >
                      <span
                        v-if="hasHalfStar(booking.hotelRating)"
                        class="star half"
                        >⭐</span
                      >
                    </div>
                    <span class="rating-text">{{
                      booking.hotelRating == 0 ? "" : booking.hotelRating
                    }}</span>
                  </div>

                  <div class="booking-details">
                    <div class="detail-row">
                      <div class="detail-item">
                        <div class="detail-label">객실 타입</div>
                        <div class="detail-value">{{ booking.roomType }}</div>
                      </div>
                      <div class="detail-item">
                        <div class="detail-label">투숙 인원</div>
                        <div class="detail-value">{{ booking.guests }}명</div>
                      </div>
                    </div>
                    <div class="detail-row">
                      <div class="detail-item">
                        <div class="detail-label">체크인</div>
                        <div class="detail-value">
                          {{ formatDisplayDate(booking.checkIn) }}
                        </div>
                      </div>
                      <div class="detail-item">
                        <div class="detail-label">체크아웃</div>
                        <div class="detail-value">
                          {{ formatDisplayDate(booking.checkOut) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 이미지 및 액션 (오른쪽) -->
                <div class="image-action-section">
                  <!-- 이미지 -->
                  <div class="image-section">
                    <img
                      :src="booking.hotelImage"
                      :alt="booking.hotelName"
                      class="hotel-image"
                    />
                  </div>

                  <!-- 가격 및 버튼들 -->
                  <div class="price-info">
                    <p>결제 금액 :</p>
                    <div class="price-value">
                      ₩{{ booking.totalPrice.toLocaleString() }}
                    </div>
                  </div>

                  <div class="action-buttons">
                    <button
                      class="action-btn primary"
                      @click.stop="viewDetails(booking.id)"
                    >
                      <span class="btn-icon">👁️</span>
                      상세 보기
                    </button>
                    <button
                      v-if="booking.status === 'completed'"
                      class="action-btn dark"
                      @click.stop="openReviewModal(booking.id, booking.hotelId)"
                    >
                      <span class="btn-icon">✏️</span>
                      리뷰 작성
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 페이지네이션 -->
          <div
            v-if="filteredCompletedBookings.length > 0"
            class="pagination-wrapper"
          >
            <div class="pagination">
              <button
                v-for="page in completedTotalPages"
                :key="page"
                :class="['page-btn', { active: completedCurrentPage === page }]"
                @click="completedCurrentPage = page"
              >
                {{ page }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 커스텀 달력 모달 -->
    <div v-if="dateModal" class="modal-overlay" @click="closeDateModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">날짜 범위 선택</h2>
          <button class="close-btn" @click="closeDateModal">✕</button>
        </div>

        <div class="modal-body">
          <div class="calendar-container">
            <!-- 시작 날짜 달력 -->
            <div class="calendar-section">
              <h3 class="calendar-title">시작 날짜</h3>
              <div class="custom-calendar">
                <div class="calendar-header">
                  <button @click="prevMonth('start')" class="nav-btn">‹</button>
                  <span class="month-year">{{
                    formatMonthYear(startCalendarDate)
                  }}</span>
                  <button @click="nextMonth('start')" class="nav-btn">›</button>
                </div>
                <div class="calendar-grid">
                  <div class="weekday" v-for="day in weekdays" :key="day">
                    {{ day }}
                  </div>
                  <button
                    v-for="date in getCalendarDates(startCalendarDate)"
                    :key="date.key"
                    :class="[
                      'date-cell',
                      {
                        'other-month': !date.current,
                        selected: isSelectedStart(date.date),
                        disabled: isStartDateDisabled(date.date),
                        'in-range': isInRange(date.date),
                      },
                    ]"
                    @click="selectStartDate(date.date)"
                    :disabled="!date.current || isStartDateDisabled(date.date)"
                  >
                    {{ date.day }}
                  </button>
                </div>
              </div>
            </div>

            <!-- 종료 날짜 달력 -->
            <div class="calendar-section">
              <h3 class="calendar-title">종료 날짜</h3>
              <div class="custom-calendar">
                <div class="calendar-header">
                  <button @click="prevMonth('end')" class="nav-btn">‹</button>
                  <span class="month-year">{{
                    formatMonthYear(endCalendarDate)
                  }}</span>
                  <button @click="nextMonth('end')" class="nav-btn">›</button>
                </div>
                <div class="calendar-grid">
                  <div class="weekday" v-for="day in weekdays" :key="day">
                    {{ day }}
                  </div>
                  <button
                    v-for="date in getCalendarDates(endCalendarDate)"
                    :key="date.key"
                    :class="[
                      'date-cell',
                      {
                        'other-month': !date.current,
                        selected: isSelectedEnd(date.date),
                        disabled: isEndDateDisabled(date.date),
                        'in-range': isInRange(date.date),
                      },
                    ]"
                    @click="selectEndDate(date.date)"
                    :disabled="!date.current || isEndDateDisabled(date.date)"
                  >
                    {{ date.day }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 선택된 날짜 표시 -->
          <div class="selected-range">
            <div class="range-title">선택된 기간</div>
            <div class="range-display">
              <span v-if="tempStartDate" class="date-chip start">
                시작: {{ formatDisplayDate(tempStartDate) }}
              </span>
              <span v-if="tempStartDate && tempEndDate" class="arrow">→</span>
              <span v-if="tempEndDate" class="date-chip end">
                종료: {{ formatDisplayDate(tempEndDate) }}
              </span>
              <span v-if="!tempStartDate && !tempEndDate" class="no-selection">
                날짜를 선택해주세요
              </span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="clearTempDates" class="btn-secondary">초기화</button>
          <button @click="closeDateModal" class="btn-secondary">취소</button>
          <button @click="applyDateFilter" class="btn-primary">적용</button>
        </div>
      </div>
    </div>

    <!-- 리뷰 작성 모달 -->
    <ReviewWriteModal v-model="writeOpen" @submit="handleWriteSubmit" />

    <!-- 스낵바 -->
    <div v-if="snackbar.show" :class="['snackbar', snackbar.color]">
      <span>{{ snackbar.text }}</span>
      <button @click="snackbar.show = false" class="snackbar-close">✕</button>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { onMounted, ref, computed, watch } from "vue";
import { useRouter } from "vue-router";
import ReviewWriteModal from "@/views/Review/ReviewWriteModal.vue";

const router = useRouter();

// 탭 관리
const activeTab = ref("active");
const writeOpen = ref(false);
const currentReviewData = ref(null);
const snackbar = ref({
  show: false,
  text: "",
  color: "success",
});

// 날짜 필터 관련
const dateModal = ref(false);
const tempStartDate = ref(null);
const tempEndDate = ref(null);
const dateFilter = ref({
  startDate: null,
  endDate: null,
});

// 달력 관련
const startCalendarDate = ref(new Date());
const endCalendarDate = ref(new Date());
const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

// 정렬 관련
const sortOrder = ref("latest");

// 페이지네이션
const itemsPerPage = 4;
const activeCurrentPage = ref(1);
const completedCurrentPage = ref(1);

// 예약 데이터
const bookings = ref([]);

// 날짜 관련 computed
const dateFilterText = computed(() => {
  if (dateFilter.value.startDate && dateFilter.value.endDate) {
    return `${formatDisplayDate(
      dateFilter.value.startDate
    )} ~ ${formatDisplayDate(dateFilter.value.endDate)}`;
  } else if (dateFilter.value.startDate) {
    return `${formatDisplayDate(dateFilter.value.startDate)} ~`;
  } else if (dateFilter.value.endDate) {
    return `~ ${formatDisplayDate(dateFilter.value.endDate)}`;
  }
  return "날짜 선택";
});

// 필터링 및 정렬된 예약 목록
const getSortedBookings = (bookingList) => {
  const filtered = bookingList.filter((booking) => {
    const checkInDate = new Date(booking.checkIn);
    const startDate = dateFilter.value.startDate
      ? new Date(dateFilter.value.startDate)
      : null;
    const endDate = dateFilter.value.endDate
      ? new Date(dateFilter.value.endDate)
      : null;

    if (startDate && checkInDate < startDate) return false;
    if (endDate && checkInDate > endDate) return false;

    return true;
  });

  return filtered.sort((a, b) => {
    const dateA = new Date(a.bookingDate);
    const dateB = new Date(b.bookingDate);

    return sortOrder.value === "latest"
      ? dateB.getTime() - dateA.getTime()
      : dateA.getTime() - dateB.getTime();
  });
};

const filteredActiveBookings = computed(() => {
  const activeList = bookings.value.filter(
    (booking) => booking.status === "upcoming" || booking.status === "ongoing"
  );
  return getSortedBookings(activeList);
});

const filteredCompletedBookings = computed(() => {
  const completedList = bookings.value.filter(
    (booking) =>
      booking.status === "completed" || booking.status === "cancelled"
  );
  return getSortedBookings(completedList);
});

// 페이지네이션된 예약 목록
const paginatedActiveBookings = computed(() => {
  const start = (activeCurrentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredActiveBookings.value.slice(start, end);
});

const paginatedCompletedBookings = computed(() => {
  const start = (completedCurrentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredCompletedBookings.value.slice(start, end);
});

// 총 페이지 수
const activeTotalPages = computed(() => {
  return Math.ceil(filteredActiveBookings.value.length / itemsPerPage);
});

const completedTotalPages = computed(() => {
  return Math.ceil(filteredCompletedBookings.value.length / itemsPerPage);
});

// 달력 관련 함수
const formatMonthYear = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}년 ${month}월`;
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
};

const getCalendarDates = (currentDate) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const dates = [];
  const current = new Date(startDate);

  for (let i = 0; i < 42; i++) {
    dates.push({
      date: new Date(current),
      day: current.getDate(),
      current: current.getMonth() === month,
      key: `${current.getFullYear()}-${current.getMonth()}-${current.getDate()}`,
    });
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

const prevMonth = (type) => {
  if (type === "start") {
    startCalendarDate.value = new Date(
      startCalendarDate.value.getFullYear(),
      startCalendarDate.value.getMonth() - 1,
      1
    );
  } else {
    endCalendarDate.value = new Date(
      endCalendarDate.value.getFullYear(),
      endCalendarDate.value.getMonth() - 1,
      1
    );
  }
};

const nextMonth = (type) => {
  if (type === "start") {
    startCalendarDate.value = new Date(
      startCalendarDate.value.getFullYear(),
      startCalendarDate.value.getMonth() + 1,
      1
    );
  } else {
    endCalendarDate.value = new Date(
      endCalendarDate.value.getFullYear(),
      endCalendarDate.value.getMonth() + 1,
      1
    );
  }
};

const selectStartDate = (date) => {
  if (isStartDateDisabled(date)) return;
  tempStartDate.value = date;
  if (tempEndDate.value && date > tempEndDate.value) {
    tempEndDate.value = null;
  }
};

const selectEndDate = (date) => {
  if (isEndDateDisabled(date)) return;
  tempEndDate.value = date;
};

const isSelectedStart = (date) => {
  return (
    tempStartDate.value && date.getTime() === tempStartDate.value.getTime()
  );
};

const isSelectedEnd = (date) => {
  return tempEndDate.value && date.getTime() === tempEndDate.value.getTime();
};

const isInRange = (date) => {
  if (!tempStartDate.value || !tempEndDate.value) return false;
  return date > tempStartDate.value && date < tempEndDate.value;
};

const isStartDateDisabled = (date) => {
  return tempEndDate.value && date > tempEndDate.value;
};

const isEndDateDisabled = (date) => {
  return tempStartDate.value && date < tempStartDate.value;
};

// 날짜 관련 함수
const openDateModal = () => {
  tempStartDate.value = dateFilter.value.startDate;
  tempEndDate.value = dateFilter.value.endDate;
  dateModal.value = true;
};

const closeDateModal = () => {
  dateModal.value = false;
  tempStartDate.value = null;
  tempEndDate.value = null;
};

const clearTempDates = () => {
  tempStartDate.value = null;
  tempEndDate.value = null;
};

const applyDateFilter = () => {
  dateFilter.value.startDate = tempStartDate.value;
  dateFilter.value.endDate = tempEndDate.value;
  dateModal.value = false;

  // 페이지 초기화
  activeCurrentPage.value = 1;
  completedCurrentPage.value = 1;
};

const clearDateFilter = () => {
  dateFilter.value.startDate = null;
  dateFilter.value.endDate = null;

  // 페이지 초기화
  activeCurrentPage.value = 1;
  completedCurrentPage.value = 1;
};

// 유틸리티 함수들
const statusClass = (status) => {
  switch (status) {
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
};

const statusText = (status) => {
  switch (status) {
    case "ongoing":
      return "투숙 중";
    case "upcoming":
      return "예약 확정";
    case "completed":
      return "투숙 완료";
    case "cancelled":
      return "예약 취소";
    default:
      return status;
  }
};

const fullStars = (rating) => Math.floor(rating);
const hasHalfStar = (rating) => rating % 1 !== 0;

// 액션 함수들
const viewDetails = (id) => {
  router.push(`/reservations/${id}`);
};

const contactHost = (id) => {
  router.push({ path: "/chat", query: { roomId: id } });
};

const openReviewModal = (reservationId, hotelId) => {
  writeOpen.value = true;
  currentReviewData.value = { reservationId, hotelId };
};

const handleWriteSubmit = async ({ rating, contents, files }) => {
  try {
    const fd = new FormData();
    fd.append("hotelId", currentReviewData.value.hotelId);
    fd.append("reservationId", currentReviewData.value.reservationId);
    fd.append("rating", String(rating));
    fd.append("contents", contents);
    (files || []).forEach((f, i) =>
      fd.append("reviewImages", f, f.name ?? `photo_${i}.jpg`)
    );

    await axios.post(`${process.env.VUE_APP_API_BASE_URL}/review/create`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    writeOpen.value = false;
    currentReviewData.value = null;
    window.location.reload();
    snackbar.value = {
      show: true,
      text: "리뷰가 성공적으로 작성되었습니다!",
      color: "success",
    };
  } catch (e) {
    console.error("리뷰 등록 실패:", e);
    snackbar.value = {
      show: true,
      text: "리뷰 작성에 실패했습니다.",
      color: "error",
    };
  }
};

// 데이터 로드 함수
const loadBookings = async () => {
  try {
    const isHostPage = router.currentRoute.value.path.startsWith("/myhostpage");
    const url = isHostPage
      ? `${process.env.VUE_APP_API_BASE_URL}/reservation/host/findAll`
      : `${process.env.VUE_APP_API_BASE_URL}/reservation/findAll`;

    const response = await axios.get(url, {
      params: {
        page: activeCurrentPage.value - 1,
        size: itemsPerPage,
      },
    });
    console.log("예약 불러오는중===========");
    console.log(response);
    console.log(response.data.content);
    bookings.value = [...bookings.value, ...response.data.content];
  } catch (e) {
    console.error("예약 목록 불러오기 실패", e);
  }
};

// 탭 변경 시 페이지 초기화
watch(activeTab, () => {
  activeCurrentPage.value = 1;
  completedCurrentPage.value = 1;
});

// 정렬 변경 시 페이지 초기화
watch(sortOrder, () => {
  activeCurrentPage.value = 1;
  completedCurrentPage.value = 1;
});

onMounted(async () => {
  await loadBookings();
});
</script>

<style scoped>
/* 기본 리셋 및 전역 스타일 */
* {
  box-sizing: border-box;
}

.booking-history-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 40px 0;
  font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui,
    Roboto, sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* 헤더 */
.page-header {
  text-align: center;
  margin-bottom: 48px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  letter-spacing: -0.025em;
}

/* 안내 메시지 */
.info-alert {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 40px;
  border: 1px solid rgba(226, 232, 240, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.info-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.info-text {
  color: #64748b;
  font-weight: 500;
  line-height: 1.5;
}

/* 필터 섹션 */
.filter-section {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 40px;
  border: 1px solid rgba(226, 232, 240, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.date-filter-group {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.date-filter-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  box-shadow: 0 4px 15px rgba(15, 23, 42, 0.2);
}

.date-filter-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.3);
}

.filter-icon {
  font-size: 1rem;
}

.clear-filter-btn {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(220, 38, 38, 0.2);
}

.clear-filter-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3);
}

.sort-filter-group {
  min-width: 200px;
}

.sort-select {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 18px;
  padding-right: 40px;
  color: #374151;
}

.sort-select:focus {
  outline: none;
  border-color: #0f172a;
  box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.1);
}

/* 탭 */
.tab-container {
  margin-bottom: 40px;
}

.tab-list {
  display: flex;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 8px;
  border: 1px solid rgba(226, 232, 240, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.tab-button {
  flex: 1;
  padding: 16px 24px;
  border: none;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #64748b;
  background: transparent;
  font-size: 0.95rem;
}

.tab-button.active {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(15, 23, 42, 0.2);
}

.tab-button:not(.active):hover {
  color: #374151;
  background: rgba(248, 250, 252, 0.8);
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 80px 40px;
  border: 1px solid rgba(226, 232, 240, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 3.5rem;
  margin-bottom: 24px;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.375rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12px;
  line-height: 1.4;
}

.empty-desc {
  color: #64748b;
  margin-bottom: 32px;
  font-size: 1rem;
  line-height: 1.5;
}

.cta-button {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px 28px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  box-shadow: 0 4px 15px rgba(15, 23, 42, 0.2);
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.3);
}

/* 예약 카드 그리드 */
.booking-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32px;
}

.booking-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 32px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(226, 232, 240, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.booking-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #0f172a 0%, #475569 50%, #0f172a 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.booking-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  border-color: rgba(203, 213, 225, 0.8);
}

.booking-card:hover::before {
  opacity: 1;
}

.status-badge {
  position: absolute;
  top: 24px;
  right: 24px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  z-index: 10;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.status-ongoing {
  background: linear-gradient(135deg, gray 0%, gray 100%);
}
.status-upcoming {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.status-completed {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.status-cancelled {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
}

.card-content {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  align-items: start;
}

/* 정보 섹션 */
.info-section {
  flex: 1;
}

.reservation-number {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 12px;
  font-weight: 500;
  background: rgba(248, 250, 252, 0.8);
  padding: 6px 12px;
  border-radius: 8px;
  display: inline-block;
}

.hotel-name {
  font-size: 1.375rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 16px 0;
  line-height: 1.3;
  letter-spacing: -0.025em;
}

.location {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  margin-bottom: 16px;
  font-size: 0.9rem;
  line-height: 1.4;
}

.location-icon {
  font-size: 0.9rem;
}

.rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 24px;
}

.stars {
  display: flex;
  gap: 2px;
}

.star {
  font-size: 1rem;
  filter: grayscale(0);
}

.rating-text {
  color: #64748b;
  font-weight: 500;
  font-size: 0.9rem;
}

.booking-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.detail-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

.detail-value {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

/* 가격 정보 */
.price-info {
  display: flex;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.price-label {
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 6px;
  font-weight: 500;
}

.price-value {
  /* font-size: 1.25rem; */
  font-weight: 700;
  background: linear-gradient(135deg, #0f172a 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 이미지 및 액션 섹션 */
.image-action-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 200px;
}

/* 이미지 섹션 */
.image-section {
  position: relative;
}

.hotel-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.hotel-image:hover {
  transform: scale(1.02);
}

/* 액션 버튼들 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn.primary {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  border: none;
}

.action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(15, 23, 42, 0.3);
}

.action-btn.outline {
  background: rgba(255, 255, 255, 0.9);
  color: #475569;
  border: 1px solid rgba(203, 213, 225, 0.8);
  backdrop-filter: blur(10px);
}

.action-btn.outline:hover {
  background: rgba(248, 250, 252, 0.95);
  border-color: #94a3b8;
  color: #334155;
  transform: translateY(-1px);
}

.action-btn.dark {
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  color: white;
  border: none;
}

.action-btn.dark:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(71, 85, 105, 0.3);
}

.btn-icon {
  font-size: 1rem;
}

/* 페이지네이션 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 48px;
}

.pagination {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid rgba(226, 232, 240, 0.5);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.page-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn.active {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.2);
}

.page-btn:not(.active):hover {
  background: rgba(241, 245, 249, 0.8);
  color: #334155;
}

/* 모달 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px 32px 24px 32px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.5);
}

.modal-title {
  font-size: 1.375rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.025em;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: rgba(241, 245, 249, 0.8);
  color: #64748b;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(226, 232, 240, 0.9);
  color: #475569;
}

.modal-body {
  padding: 32px;
}

.calendar-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  margin-bottom: 32px;
}

.calendar-section {
  background: rgba(248, 250, 252, 0.8);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.calendar-title {
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  margin: 0 0 20px 0;
  text-align: center;
}

.custom-calendar {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(226, 232, 240, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.nav-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(241, 245, 249, 0.8);
  color: #64748b;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.nav-btn:hover {
  background: rgba(226, 232, 240, 0.9);
  color: #475569;
}

.month-year {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.95rem;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.weekday {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
}

.date-cell {
  height: 36px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #374151;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  font-size: 0.875rem;
}

.date-cell:not(.disabled):hover {
  background: rgba(241, 245, 249, 0.8);
}

.date-cell.other-month {
  color: #cbd5e1;
}

.date-cell.selected {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.2);
}

.date-cell.in-range {
  background: rgba(15, 23, 42, 0.1);
  color: #0f172a;
}

.date-cell.disabled {
  color: #cbd5e1;
  cursor: not-allowed;
}

.selected-range {
  background: rgba(248, 250, 252, 0.8);
  border-radius: 12px;
  padding: 24px;
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.range-title {
  font-weight: 600;
  color: #334155;
  margin-bottom: 16px;
  font-size: 0.95rem;
}

.range-display {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.date-chip {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.2);
}

.arrow {
  color: #64748b;
  font-weight: 500;
}

.no-selection {
  color: #64748b;
  font-style: italic;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px 32px 32px 32px;
  border-top: 1px solid rgba(226, 232, 240, 0.5);
}

.btn-secondary,
.btn-primary {
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.btn-secondary {
  background: transparent;
  color: #64748b;
  border: 1px solid rgba(209, 213, 219, 0.8);
}

.btn-secondary:hover {
  background: rgba(248, 250, 252, 0.8);
  color: #475569;
  border-color: #94a3b8;
}

.btn-primary {
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: white;
  border: none;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.2);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(15, 23, 42, 0.3);
}

/* 스낵바 */
.snackbar {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 2000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  color: #1e293b;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
  animation: slideInRight 0.3s ease;
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.snackbar.success {
  border-left: 3px solid #059669;
}

.snackbar.error {
  border-left: 3px solid #dc2626;
}

.snackbar-close {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0;
  margin-left: auto;
  transition: color 0.3s ease;
}

.snackbar-close:hover {
  color: #475569;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* 반응형 */
@media (max-width: 1024px) {
  .card-content {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .image-action-section {
    order: -1;
    flex-direction: row;
    gap: 24px;
    align-items: flex-start;
  }

  .action-buttons {
    flex-direction: row;
    gap: 12px;
    width: auto;
  }
  .booking-grid {
    grid-template-columns: 1fr; /* 한 줄 1개로 */
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 20px;
  }

  .booking-history-container {
    padding: 24px 0;
  }

  .page-title {
    font-size: 2rem;
  }

  .filter-section {
    padding: 24px;
    margin-bottom: 32px;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
  }

  .sort-filter-group {
    min-width: auto;
  }

  .booking-grid {
    gap: 24px;
  }

  .booking-card {
    padding: 24px;
  }

  .card-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .image-action-section {
    order: -1;
    flex-direction: column;
    gap: 20px;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }

  .calendar-container {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .modal-content {
    margin: 16px;
    width: calc(100% - 32px);
  }

  .modal-header,
  .modal-body {
    padding: 24px;
  }

  .modal-footer {
    padding: 20px 24px 24px 24px;
  }

  .range-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .booking-history-container {
    padding: 20px 0;
  }

  .container {
    padding: 0 16px;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .booking-card {
    padding: 20px;
  }

  .hotel-name {
    font-size: 1.25rem;
  }

  .detail-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .date-filter-group {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .date-filter-btn {
    justify-content: center;
  }

  .empty-state {
    padding: 60px 24px;
  }

  .filter-section {
    padding: 20px;
  }
}
</style>
