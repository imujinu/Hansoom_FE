<template>
  <div class="min-h-screen">
    <!-- Header -->
    <header class="header">
      <div class="header-container">
        <div class="header-content">
          <div class="header-left">
            <button class="back-button" @click="useBackButton()">←</button>
            <h1 class="header-title">관리자 대시보드</h1>
          </div>
        </div>
      </div>
    </header>

    <div class="main-container">
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-icon">👥</span>
            <span class="stat-label">총 사용자</span>
          </div>
          <p class="stat-value">{{ stats.users }}</p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-icon">📄</span>
            <span class="stat-label">총 등록</span>
          </div>
          <p class="stat-value">{{ stats.documents }}</p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-icon">✅</span>
            <span class="stat-label">승인된 등록</span>
          </div>
          <p class="stat-value">{{ stats.approved }}</p>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-icon">📋</span>
            <span class="stat-label">대기중인 등록</span>
          </div>
          <p class="stat-value">{{ stats.pending }}</p>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-container">
        <div class="tab-nav">
          <button
            @click="changeTab('registration')"
            :class="{
              'tab-button': true,
              active: currentTab === 'registration',
            }"
          >
            📝 호텔 승인
          </button>
          <button
            @click="changeTab('management')"
            :class="{ 'tab-button': true, active: currentTab === 'management' }"
          >
            📊 호텔 관리
          </button>
          <button
            @click="changeTab('users')"
            :class="{ 'tab-button': true, active: currentTab === 'users' }"
          >
            👥 사용자 관리
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <p>데이터를 불러오는 중...</p>
      </div>

      <!-- Tab Content -->
      <div v-else class="tab-content">
        <!-- 호텔 등록 승인 탭 -->
        <div v-if="currentTab === 'registration'" class="tab-panel">
          <h2 class="panel-title">호텔 등록 승인</h2>

          <div v-if="hotelRegistrations.length === 0" class="empty-state">
            <p>승인 대기 중인 호텔이 없습니다.</p>
          </div>

          <div v-else>
            <div class="hotel-list">
              <div
                v-for="hotel in hotelRegistrations"
                :key="hotel.id"
                class="hotel-card"
              >
                <div class="hotel-header">
                  <div class="hotel-info">
                    <h3>{{ hotel.hotelName }}</h3>
                    <span class="status-badge badge-pending">{{
                      getStatusText(hotel.state)
                    }}</span>
                  </div>
                  <div class="hotel-actions">
                    <button @click="viewDetails(hotel)" class="btn btn-outline">
                      👁 상세보기
                    </button>
                    <button
                      @click="showConfirmDialog(hotel, 'reject')"
                      class="btn btn-reject"
                    >
                      ❌ 거절
                    </button>
                    <button
                      @click="showConfirmDialog(hotel, 'approve')"
                      class="btn btn-approve"
                    >
                      ✅ 승인
                    </button>
                  </div>
                </div>

                <div class="hotel-details">
                  <div class="detail-item">
                    <span class="label">주소:</span> {{ hotel.address }}
                  </div>
                  <div class="detail-item">
                    <span class="label">호스트:</span>
                    {{ hotel.hostName || "정보없음" }}
                  </div>
                  <div class="detail-item">
                    <span class="label">등록일:</span>
                    {{ formatDate(hotel.createdTime) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 호텔 승인 페이지네이션 -->
            <div class="pagination-container">
              <div class="pagination">
                <button
                  @click="
                    goToPage(
                      'registration',
                      registrationPagination.currentPage - 1
                    )
                  "
                  :disabled="registrationPagination.currentPage === 0"
                  class="pagination-btn"
                >
                  ‹ 이전
                </button>

                <div class="pagination-numbers">
                  <button
                    v-for="pageNum in getPageNumbers(registrationPagination)"
                    :key="pageNum"
                    @click="goToPage('registration', pageNum)"
                    :class="[
                      'pagination-number',
                      {
                        active: pageNum === registrationPagination.currentPage,
                      },
                    ]"
                  >
                    {{ pageNum + 1 }}
                  </button>
                </div>

                <button
                  @click="
                    goToPage(
                      'registration',
                      registrationPagination.currentPage + 1
                    )
                  "
                  :disabled="
                    registrationPagination.currentPage >=
                    registrationPagination.totalPages - 1
                  "
                  class="pagination-btn"
                >
                  다음 ›
                </button>
              </div>

              <div class="pagination-info">
                페이지 {{ registrationPagination.currentPage + 1 }} /
                {{ registrationPagination.totalPages }} (총
                {{ registrationPagination.totalElements }}개)
              </div>
            </div>
          </div>
        </div>

        <!-- 호텔 관리 탭 -->
        <div v-if="currentTab === 'management'" class="tab-panel">
          <h2 class="panel-title">호텔 관리</h2>

          <div class="table-container">
            <table class="table" style="text-align: center">
              <thead>
                <tr>
                  <th style="text-align: center">호텔명</th>
                  <th style="text-align: center">주소</th>
                  <th style="text-align: center">호스트</th>
                  <th style="text-align: center">상태</th>
                  <th style="text-align: center">평점</th>
                  <th style="text-align: center">등록일</th>
                  <th style="text-align: center">상세보기</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="hotelManagement.length === 0">
                  <td colspan="7" class="empty-table-row">
                    등록된 호텔이 없습니다.
                  </td>
                </tr>
                <tr v-else v-for="hotel in hotelManagement" :key="hotel.id">
                  <td class="table-name">{{ hotel.hotelName }}</td>
                  <td class="table-text">{{ hotel.address }}</td>
                  <td class="table-text">{{ hotel.hostName || "정보없음" }}</td>
                  <td>
                    <span
                      :class="['status-badge', getStatusClass(hotel.state)]"
                    >
                      {{ getStatusText(hotel.state) }}
                    </span>
                  </td>
                  <td class="table-text">{{ hotel.rating || "평점없음" }}</td>
                  <td class="table-text">
                    {{ formatDate(hotel.createdTime) }}
                  </td>
                  <td style="place-items: center">
                    <div class="table-actions">
                      <button @click="viewDetails(hotel)" class="action-btn">
                        👁
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 호텔 관리 페이지네이션 -->
          <div v-if="hotelManagement.length > 0" class="pagination-container">
            <div class="pagination">
              <button
                @click="
                  goToPage('management', managementPagination.currentPage - 1)
                "
                :disabled="managementPagination.currentPage === 0"
                class="pagination-btn"
              >
                ‹ 이전
              </button>

              <div class="pagination-numbers">
                <button
                  v-for="pageNum in getPageNumbers(managementPagination)"
                  :key="pageNum"
                  @click="goToPage('management', pageNum)"
                  :class="[
                    'pagination-number',
                    { active: pageNum === managementPagination.currentPage },
                  ]"
                >
                  {{ pageNum + 1 }}
                </button>
              </div>

              <button
                @click="
                  goToPage('management', managementPagination.currentPage + 1)
                "
                :disabled="
                  managementPagination.currentPage >=
                  managementPagination.totalPages - 1
                "
                class="pagination-btn"
              >
                다음 ›
              </button>
            </div>

            <div class="pagination-info">
              페이지 {{ managementPagination.currentPage + 1 }} /
              {{ managementPagination.totalPages }} (총
              {{ managementPagination.totalElements }}개)
            </div>
          </div>
        </div>

        <!-- 사용자 관리 탭 -->
        <div v-if="currentTab === 'users'" class="tab-panel">
          <h2 class="panel-title">사용자 관리</h2>

          <!-- 검색 기능 -->
          <div class="search-container">
            <div class="search-box">
              <input
                v-model="userSearchQuery"
                @keyup.enter="searchUsers"
                placeholder="사용자 이름으로 검색..."
                class="search-input"
              />
              <button @click="searchUsers" class="search-button">
                검색
              </button>
              <button v-if="userSearchQuery" @click="clearSearch" class="clear-button">
                초기화
              </button>
            </div>
          </div>

          <div class="table-container">
            <table class="table" style="text-align: center">
              <thead>
                <tr>
                  <th style="text-align: center">사용자명</th>
                  <th style="text-align: center">이메일</th>
                  <th style="text-align: center">역할</th>
                  <th style="text-align: center">상태</th>
                  <th style="text-align: center">가입일</th>
                  <th style="text-align: center">작업</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="userManagement.length === 0">
                  <td colspan="6" class="empty-table-row">
                    등록된 사용자가 없습니다.
                  </td>
                </tr>
                <tr v-else v-for="user in userManagement" :key="user.email">
                  <td class="table-name">{{ user.name }}</td>
                  <td class="table-text">{{ user.email }}</td>
                  <td>
                    <span :class="['status-badge', getRoleClass(user.userRole)]">
                      {{ getUserRoleText(user.userRole) }}
                    </span>
                  </td>
                  <td>
                    <span
                      :class="['status-badge', getUserStatusClass(user.userState)]"
                    >
                      {{ getUserStatusText(user.userState) }}
                    </span>
                  </td>
                  <td class="table-text">{{ formatDate(user.createdTime) }}</td>
                  <td>
                    <button @click="suspendUser(user)" class="btn btn-suspend">
                      정지
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 사용자 관리 페이지네이션 -->
          <div v-if="userManagement.length > 0" class="pagination-container">
            <div class="pagination">
              <button
                @click="
                  goToPage('users', userPagination.currentPage - 1)
                "
                :disabled="userPagination.currentPage === 0"
                class="pagination-btn"
              >
                ‹ 이전
              </button>

              <div class="pagination-numbers">
                <button
                  v-for="pageNum in getPageNumbers(userPagination)"
                  :key="pageNum"
                  @click="goToPage('users', pageNum)"
                  :class="[
                    'pagination-number',
                    { active: pageNum === userPagination.currentPage },
                  ]"
                >
                  {{ pageNum + 1 }}
                </button>
              </div>

              <button
                @click="
                  goToPage('users', userPagination.currentPage + 1)
                "
                :disabled="
                  userPagination.currentPage >=
                  userPagination.totalPages - 1
                "
                class="pagination-btn"
              >
                다음 ›
              </button>
            </div>

            <div class="pagination-info">
              페이지 {{ userPagination.currentPage + 1 }} /
              {{ userPagination.totalPages }} (총
              {{ userPagination.totalElements }}개)
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 확인 대화상자 -->
    <div v-if="showConfirm" class="modal-overlay" @click="cancelConfirm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">{{ confirmMessage.title }}</h3>
        </div>
        <div class="modal-body">
          <p>{{ confirmMessage.message }}</p>
        </div>
        <div class="modal-actions">
          <button @click="cancelConfirm" class="btn btn-cancel">아니오</button>
          <button
            @click="confirmAction"
            class="btn"
            :class="confirmMessage.buttonClass"
          >
            예
          </button>
        </div>
      </div>
    </div>

    <!-- 스낵바 -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top center"
    >
      {{ snackbar.text }}
      
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          닫기
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";

export default {
  name: "AdminDashboard",
  setup() {
    const currentTab = ref("registration");
    const loading = ref(false);
    const router = useRouter();
    const showConfirm = ref(false);
    const pendingAction = ref(null);

    // 스낵바 상태
    const snackbar = ref({
      show: false,
      text: '',
      color: 'success'
    });

    const stats = ref({
      users: 0,
      documents: 0,
      approved: 0,
      pending: 0,
    });

    const hotelRegistrations = ref([]);
    const hotelManagement = ref([]);
    const userManagement = ref([]);

    // 사용자 관리 페이지네이션 상태
    const userPagination = ref({
      currentPage: 0,
      totalPages: 0,
      totalElements: 0,
      size: 10,
    });

    // 사용자 검색 관련 상태
    const userSearchQuery = ref('');
    const isSearching = ref(false);

    // 페이지네이션 상태
    const registrationPagination = ref({
      currentPage: 0,
      totalPages: 0,
      totalElements: 0,
      size: 10,
    });

    const managementPagination = ref({
      currentPage: 0,
      totalPages: 0,
      totalElements: 0,
      size: 10,
    });

    const confirmMessage = ref({
      title: "",
      message: "",
      buttonClass: "",
    });

    // API 호출 함수들
    const fetchWaitingHotels = async (page = 0) => {
      try {
        loading.value = true;
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/hotel/admin/waitlist?page=${page}&size=${registrationPagination.value.size}`
        );
        console.log(response.data.result);

        if (response.data && response.data.result) {
          const pageData = response.data.result;
          hotelRegistrations.value = pageData.content || [];

          // 페이지네이션 정보 업데이트
          registrationPagination.value = {
            currentPage: pageData.number || 0,
            totalPages: pageData.totalPages || 0,
            totalElements: pageData.totalElements || 0,
            size: pageData.size || 10,
          };
        }
      } catch (error) {
        console.error("대기 중인 호텔 목록을 가져오는데 실패했습니다:", error);
        alert("대기 중인 호텔 목록을 가져오는데 실패했습니다.");
        hotelRegistrations.value = [];
      } finally {
        loading.value = false;
      }
    };

    const fetchAllHotels = async (page = 0) => {
      try {
        loading.value = true;
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/hotel/admin/list?page=${page}&size=${managementPagination.value.size}`
        );

        if (response.data && response.data.result) {
          const pageData = response.data.result;
          hotelManagement.value = pageData.content || [];

          // 페이지네이션 정보 업데이트
          managementPagination.value = {
            currentPage: pageData.number || 0,
            totalPages: pageData.totalPages || 0,
            totalElements: pageData.totalElements || 0,
            size: pageData.size || 10,
          };
        }
      } catch (error) {
        console.error("전체 호텔 목록을 가져오는데 실패했습니다:", error);
        alert("전체 호텔 목록을 가져오는데 실패했습니다.");
        hotelManagement.value = [];
      } finally {
        loading.value = false;
      }
    };

    const fetchUserManagement = async (page = 0) => {
      try {
        loading.value = true;
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/user/list?page=${page}&size=${userPagination.value.size}`
        );

        if (response.data && response.data.result) {
          const pageData = response.data.result;
          userManagement.value = pageData.content || [];

          // 페이지네이션 정보 업데이트
          userPagination.value = {
            currentPage: pageData.number || 0,
            totalPages: pageData.totalPages || 0,
            totalElements: pageData.totalElements || 0,
            size: pageData.size || 10,
          };
        }
      } catch (error) {
        console.error("사용자 목록을 가져오는데 실패했습니다:", error);
        alert("사용자 목록을 가져오는데 실패했습니다.");
        userManagement.value = [];
      } finally {
        loading.value = false;
      }
    };

    // 사용자 역할 텍스트 변환
    const getUserRoleText = (role) => {
      switch (role) {
        case 'USER':
          return '일반 사용자';
        case 'HOST':
          return '호스트';
        case 'ADMIN':
          return '관리자';
        default:
          return role;
      }
    };

    // 사용자 상태 텍스트 변환
    const getUserStatusText = (status) => {
      switch (status) {
        case 'NORMAL':
          return '정상';
        case 'SUSPENDED':
          return '정지';
        case 'DELETED':
          return '삭제됨';
        default:
          return status;
      }
    };

    // 사용자 역할에 따른 CSS 클래스
    const getRoleClass = (role) => {
      switch (role) {
        case 'USER':
          return 'role-user';
        case 'HOST':
          return 'role-host';
        case 'ADMIN':
          return 'role-admin';
        default:
          return 'role-default';
      }
    };

    // 사용자 상태에 따른 CSS 클래스
    const getUserStatusClass = (status) => {
      switch (status) {
        case 'NORMAL':
          return 'status-normal';
        case 'SUSPENDED':
          return 'status-suspended';
        case 'DELETED':
          return 'status-deleted';
        default:
          return 'status-default';
      }
    };

    // 날짜 포맷팅
    const formatDate = (dateString) => {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR');
    };

    // 사용자 검색 함수
    const searchUsers = async () => {
      if (!userSearchQuery.value.trim()) {
        await fetchUserManagement(0);
        return;
      }
      
      try {
        isSearching.value = true;
        loading.value = true;
        const response = await axios.get(
          `${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/user/list?page=0&name=${encodeURIComponent(userSearchQuery.value.trim())}`
        );

        if (response.data && response.data.result) {
          const pageData = response.data.result;
          userManagement.value = pageData.content || [];

          // 페이지네이션 정보 업데이트
          userPagination.value = {
            currentPage: pageData.number || 0,
            totalPages: pageData.totalPages || 0,
            totalElements: pageData.totalElements || 0,
            size: pageData.size || 10,
          };
        }
      } catch (error) {
        console.error("사용자 검색에 실패했습니다:", error);
        showSnackbar('error', '사용자 검색에 실패했습니다.');
        userManagement.value = [];
      } finally {
        loading.value = false;
        isSearching.value = false;
      }
    };

    // 검색 초기화 함수
    const clearSearch = async () => {
      userSearchQuery.value = '';
      await fetchUserManagement(0);
    };

    // 스낵바 표시 함수
    const showSnackbar = (type, message) => {
      snackbar.value = {
        show: true,
        text: message,
        color: type === 'success' ? 'success' : 'error'
      };

      // 3초 후 자동으로 숨기기
      setTimeout(() => {
        snackbar.value.show = false;
      }, 3000);
    };

    const fetchStats = async () => {
      try {
        // 통계 정보를 가져오는 API 호출 (현재는 임시 데이터)
        stats.value = {
          users: 3,
          documents: managementPagination.value.totalElements,
          approved: hotelManagement.value.filter(
            (hotel) => hotel.state === "APPLY"
          ).length,
          pending: registrationPagination.value.totalElements,
        };
      } catch (error) {
        console.error("통계 정보를 가져오는데 실패했습니다:", error);
      }
    };

    // 페이지네이션 관련 함수들
    const getPageNumbers = (pagination) => {
      const { currentPage, totalPages } = pagination;
      const pages = [];

      // 최대 5개의 페이지 번호를 표시
      let startPage = Math.max(0, currentPage - 2);
      let endPage = Math.min(totalPages - 1, startPage + 4);

      // 끝 페이지에서 조정
      if (endPage - startPage < 4) {
        startPage = Math.max(0, endPage - 4);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      return pages;
    };

    const goToPage = async (tabType, pageNumber) => {
      if (pageNumber < 0) return;

      if (tabType === "registration") {
        if (pageNumber >= registrationPagination.value.totalPages) return;
        await fetchWaitingHotels(pageNumber);
      } else if (tabType === "management") {
        if (pageNumber >= managementPagination.value.totalPages) return;
        await fetchAllHotels(pageNumber);
      } else if (tabType === "users") {
        if (pageNumber >= userPagination.value.totalPages) return;
        await fetchUserManagement(pageNumber);
      }

      await fetchStats();
    };

    // 탭 변경 함수
    const changeTab = async (tabName) => {
      currentTab.value = tabName;

      if (tabName === "registration") {
        await fetchWaitingHotels(0); // 첫 페이지로 이동
      } else if (tabName === "management") {
        await fetchAllHotels(0); // 첫 페이지로 이동
      } else if (tabName === "users") {
        await fetchUserManagement(0); // 첫 페이지로 이동
      }

      await fetchStats();
    };

    // Helper methods for dynamic classes
    const getStatusClass = (state) => {
      switch (state) {
        case "APPLY":
          return "badge-approved";
        case "WAIT":
          return "badge-pending";
        case "DENY":
          return "badge-rejected";
        case "REMOVE":
          return "badge-rejected";
        default:
          return "badge-pending";
      }
    };

    const getStatusText = (state) => {
      switch (state) {
        case "APPLY":
          return "승인완료";
        case "WAIT":
          return "대기중";
        case "DENY":
          return "거절됨";
        case "REMOVE":
          return "삭제됨";
        default:
          return "대기중";
      }
    };

    // 확인 대화상자 표시
    const showConfirmDialog = (hotel, action) => {
      if (action === "approve") {
        confirmMessage.value = {
          title: "호텔 승인",
          message: `${hotel.hotelName}을(를) 승인하시겠습니까?`,
          buttonClass: "btn-approve",
        };
      } else if (action === "reject") {
        confirmMessage.value = {
          title: "호텔 거절",
          message: `${hotel.hotelName}을(를) 거절하시겠습니까?`,
          buttonClass: "btn-reject",
        };
      }

      pendingAction.value = { hotel, action };
      showConfirm.value = true;
    };

    // 확인 대화상자 취소
    const cancelConfirm = () => {
      showConfirm.value = false;
      pendingAction.value = null;
    };

    // 확인 액션 실행
    const confirmAction = async () => {
      if (!pendingAction.value) return;

      const { hotel, action } = pendingAction.value;

      if (action === "approve") {
        await approveHotel(hotel);
      } else if (action === "reject") {
        await rejectHotel(hotel);
      }

      showConfirm.value = false;
      pendingAction.value = null;
    };

    // Methods
    const viewDetails = (item) => {
      router.push(`/admin/hotel/${item.id}`);
    };

    const rejectHotel = async (hotel) => {
      try {
        const dto = {
          hotelId: hotel.id,
          state: "DENY",
        };

        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/hotel/answerAdmin`,
          dto
        );

        if (response.data.success || response.status === 200) {
          alert(`${hotel.hotelName}이(가) 거절되었습니다.`);

          // 현재 페이지 새로고침
          await fetchWaitingHotels(registrationPagination.value.currentPage);
          await fetchStats();
        } else {
          throw new Error("서버 응답 오류");
        }
      } catch (error) {
        console.error("호텔 거절에 실패했습니다:", error);
        alert("호텔 거절에 실패했습니다. 다시 시도해 주세요.");
      }
    };

    // const createGroupChat = async (hotel) => {
    //   console.log(hotel)
    //   await axios.post(
    //     `${process.env.VUE_APP_API_BASE_URL}/chat/host/${hotel.id}`
    //   );
    // };

    const approveHotel = async (hotel) => {
      try {
        const dto = {
          hotelId: hotel.id,
          state: "APPLY",
        };

        const response = await axios.post(
          `${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/hotel/answerAdmin`,
          dto
        );

        if (response.data.success || response.status === 200) {
          alert(`${hotel.hotelName}이(가) 승인되었습니다.`);


          // 현재 페이지 새로고침
          await fetchWaitingHotels(registrationPagination.value.currentPage);
          await fetchStats();
          // window.location.reload();
        } else {
          throw new Error("서버 응답 오류");
        }
      } catch (error) {
        console.error("호텔 승인에 실패했습니다:", error);
        alert("호텔 승인에 실패했습니다. 다시 시도해 주세요.");
      }
    };

    const suspendUser = async (user) => {
      try {
        // 전역 모달을 통해 확인
        const confirmed = await new Promise((resolve) => {
          window.dispatchEvent(
            new CustomEvent('show-confirm-modal', {
              detail: {
                title: '사용자 탈퇴',
                message: `정말로 ${user.name} 사용자를 탈퇴시키시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
                confirmColor: '#dc2626',
                loading: false,
                resolve
              }
            })
          );
        });

        if (!confirmed) return;

        // API 호출하여 사용자 탈퇴
        const response = await axios.delete(
          `${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/user/admin/delete/${user.id}`
        );

        if (response.data.success || response.status === 200) {
          // 성공 시 스낵바 표시
          showSnackbar('success', `${user.name} 사용자가 탈퇴되었습니다.`);
          
          // 사용자 목록 새로고침
          await fetchUserManagement(userPagination.value.currentPage);
          await fetchStats();
        } else {
          throw new Error("서버 응답 오류");
        }
      } catch (error) {
        console.error("사용자 탈퇴에 실패했습니다:", error);
        showSnackbar('error', '사용자 탈퇴에 실패했습니다. 다시 시도해 주세요.');
      }
    };

    const useBackButton = () => {
      router.push("/mypage");
    };

    // 컴포넌트 마운트 시 초기 데이터 로드
    onMounted(async () => {
      // 모든 데이터를 먼저 로드한 후 통계 계산
      await Promise.all([fetchWaitingHotels(0), fetchAllHotels(0), fetchUserManagement(0)]);
      await fetchStats();
    });

    return {
      currentTab,
      loading,
      stats,
      hotelRegistrations,
      hotelManagement,
      userManagement,
      registrationPagination,
      managementPagination,
      userPagination,
      showConfirm,
      confirmMessage,
      changeTab,
      getStatusClass,
      getStatusText,
      getRoleClass,
      getUserStatusClass,
      getUserRoleText,
      getUserStatusText,
      formatDate,
      viewDetails,
      showConfirmDialog,
      cancelConfirm,
      confirmAction,
      rejectHotel,
      approveHotel,
      suspendUser,
      getPageNumbers,
      goToPage,
      useBackButton,
      fetchUserManagement,
      snackbar, // 스낵바 상태 반환
      showSnackbar, // 스낵바 표시 함수 반환
      searchUsers, // 사용자 검색 함수 반환
      userSearchQuery, // 사용자 검색 쿼리 반환
      clearSearch, // 검색 초기화 함수 반환
    };
  },
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.min-h-screen {
  min-height: 100vh;
  background-color: #f9fafb;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Header */
.header {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #e5e7eb;
}

.header-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 4rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
}

.back-button:hover {
  color: #6b7280;
}

.header-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.settings-button {
  background: none;
  border: none;
  color: #7c3aed;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem;
}

.settings-button:hover {
  color: #5b21b6;
}

.avatar {
  width: 2rem;
  height: 2rem;
  background: #2563eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Main Content */
.main-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* Loading */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.loading-container p {
  color: #6b7280;
  font-size: 1rem;
}

/* Empty State */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  color: #6b7280;
  text-align: center;
}

/* Status Badges */
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
  display: inline-block;
  min-width: 60px;
}

/* 사용자 역할 배지 스타일 */
.role-user {
  background-color: #3b82f6;
  color: white;
}

.role-host {
  background-color: #10b981;
  color: white;
}

.role-admin {
  background-color: #f59e0b;
  color: white;
}

.role-default {
  background-color: #6b7280;
  color: white;
}

/* 사용자 상태 배지 스타일 */
.status-normal {
  background-color: #10b981;
  color: white;
}

.status-suspended {
  background-color: #ef4444;
  color: white;
}

.status-deleted {
  background-color: #6b7280;
  color: white;
}

.status-default {
  background-color: #6b7280;
  color: white;
}

/* 빈 테이블 행 스타일 */
.empty-table-row {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 2rem;
}

/* Stats Cards */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.stat-icon {
  font-size: 1rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #111827;
}

/* Tab Navigation */
.tab-container {
  margin-bottom: 1.5rem;
}

.tab-nav {
  display: flex;
  gap: 0.25rem;
  background: #f3f4f6;
  padding: 0.25rem;
  border-radius: 0.5rem;
  width: fit-content;
}

.tab-button {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button.active {
  background: white;
  color: #111827;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-button:not(.active) {
  background: none;
  color: #6b7280;
}

.tab-button:not(.active):hover {
  color: #374151;
}

/* Tab Content */
.tab-content {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 검색 컨테이너 */
.search-container {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.search-box {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  max-width: 400px;
}

.search-input {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s ease-in-out;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-button {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.search-button:hover {
  background-color: #2563eb;
}

.clear-button {
  padding: 0.5rem 0.75rem;
  background-color: #6b7280;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.clear-button:hover {
  background-color: #4b5563;
}

.tab-panel {
  padding: 1.5rem;
}

.panel-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 1.5rem;
}

/* Hotel Registration Cards */
.hotel-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.hotel-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  background: #f9fafb;
}

.hotel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.hotel-info h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 9999px;
}

.badge-pending {
  background: #fef3c7;
  color: #92400e;
}

.badge-approved {
  background: #d1fae5;
  color: #065f46;
}

.badge-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.badge-host {
  background: #dbeafe;
  color: #1e40af;
}

.badge-user {
  background: #f3f4f6;
  color: #374151;
}

.badge-active {
  background: #d1fae5;
  color: #065f46;
}

.badge-suspended {
  background: #fee2e2;
  color: #991b1b;
}

.hotel-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline {
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
}

.btn-outline:hover {
  background: #f9fafb;
}

.btn-reject {
  border: 1px solid #fca5a5;
  background: white;
  color: #dc2626;
}

.btn-reject:hover {
  background: #fef2f2;
}

.btn-approve {
  background: #10b981;
  color: white;
}

.btn-approve:hover {
  background: #059669;
}

.btn-suspend {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.25rem;
  border: 1px solid #fca5a5;
  background: white;
  color: #dc2626;
}

.btn-suspend:hover {
  background: #fef2f2;
}

.btn-cancel {
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
}

.btn-cancel:hover {
  background: #f9fafb;
}

.hotel-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.detail-item .label {
  font-weight: 500;
}

/* Tables */
.table-container {
  overflow-x: auto;
  margin-bottom: 2rem;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead {
  background: #f9fafb;
}

.table th {
  padding: 0.75rem 1.5rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
}

.table td {
  padding: 1rem 1.5rem;
  font-size: 0.875rem;
  border-bottom: 1px solid #e5e7eb;
}

.table tbody tr:hover {
  background: #f9fafb;
}

.table-name {
  font-weight: 500;
  color: #111827;
}

.table-text {
  color: #6b7280;
}

.table-actions {
  display: flex;
  gap: 0.5rem;
  place-items: center;
}

.action-btn {
  background: none;
  border: none;
  font-size: 1rem;
  color: #9ca3af;
  cursor: pointer;
}

.action-btn:hover {
  color: #6b7280;
}

/* Pagination Styles */
.pagination-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem 0;
  border-top: 1px solid #e5e7eb;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-btn {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-numbers {
  display: flex;
  gap: 0.25rem;
  margin: 0 0.5rem;
}

.pagination-number {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-number:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.pagination-number.active {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}

.pagination-number.active:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.pagination-info {
  font-size: 0.875rem;
  color: #6b7280;
  text-align: center;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem 1.5rem 0;
}

.modal-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.modal-body {
  padding: 1rem 1.5rem;
}

.modal-body p {
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.modal-actions {
  padding: 0 1.5rem 1.5rem;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.modal-actions .btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .header-container {
    padding: 0 0.5rem;
  }

  .main-container {
    padding: 1rem 0.5rem;
  }

  .hotel-header {
    flex-direction: column;
    gap: 1rem;
  }

  .hotel-actions {
    align-self: flex-start;
  }

  .hotel-details {
    grid-template-columns: 1fr;
  }

  .tab-nav {
    width: 100%;
    justify-content: center;
  }

  .modal-content {
    margin: 1rem;
    width: calc(100% - 2rem);
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions .btn {
    width: 100%;
  }

  .pagination {
    flex-wrap: wrap;
    justify-content: center;
  }

  .pagination-numbers {
    margin: 0.5rem 0;
  }

  .pagination-container {
    gap: 0.5rem;
  }
}
</style>
