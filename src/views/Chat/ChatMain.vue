<template>
  <div class="chat-wrapper">
    <div class="chat-container">
      <!-- 왼쪽 채팅방 목록 -->
      <div class="chat-sidebar">
        <!-- 상단 헤더 -->
        <div class="sidebar-header">
          <h2 class="sidebar-title">채팅 목록</h2>
        </div>

        <!-- 탭 메뉴 -->
        <div class="chat-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'private' }"
            @click="activeTab = 'private'"
          >
            1:1채팅
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'group' }"
            @click="activeTab = 'group'"
          >
            그룹채팅
          </button>
        </div>

        <!-- 채팅방 목록 -->
        <div class="chat-list">
          <!-- 일대일 채팅방 목록 -->
          <template v-if="activeTab === 'private'">
            <div
              v-for="room in privateChatRooms"
              :key="room.roomId"
              class="chat-item"
              :class="{ active: selectedRoom?.roomId === room.roomId }"
              @click="selectRoom(room)"
            >
              <div class="chat-avatar-container">
                <div class="chat-avatar">
                  <div class="avatar-circle">
                    <img
                      :src="room.hotelImage"
                      :alt="room.hotelName"
                      class="hotel-image"
                      @error="handleImageError"
                    />
                  </div>
                </div>
              </div>

              <div class="chat-content">
                <div class="chat-header2">
                  <span class="chat-name">
                    {{
                      userRole !== "HOST" ? room.hotelName : room.guestName
                    }}</span
                  >
                </div>
                <div class="chat-preview">
                  <span class="preview-text">{{
                    room.lastMessage || "대화를 시작해보세요"
                  }}</span>
                  <span class="unread-count">
                    {{ room.unReadCount > 99 ? "99+" : room.unReadCount }}
                  </span>
                </div>
                <div class="chat-location">
                  <span class="location-text"
                    >{{
                      userRole !== "HOST"
                        ? room.hotelAddress.split(" ")[0] + "·"
                        : ""
                    }}
                    {{ formatTime(room.lastMessageTime) }}</span
                  >
                </div>
              </div>
            </div>
          </template>

          <!-- 단체 채팅방 목록 -->
          <template v-if="activeTab === 'group'">
            <div
              v-for="room in groupChatRooms"
              :key="room.roomId"
              class="chat-item"
              :class="{ active: selectedRoom?.roomId === room.roomId }"
              @click="selectRoom(room)"
            >
              <div class="chat-avatar-container">
                <div class="chat-avatar group">
                  <div class="avatar-circle group">
                    <img
                      :src="room.hotelImage"
                      :alt="room.hotelName"
                      class="hotel-image"
                      @error="handleImageError"
                    />
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.004 3.004 0 0 0 16.91 6c-.8 0-1.54.5-1.85 1.26l-1.92 5.69c-.15.45.15.95.65.95h.91v6h4zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2.5 16v-7H6V9.5C6 8.12 7.12 7 8.5 7h3c1.38 0 2.5 1.12 2.5 2.5V15h-2v7h-4z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div class="chat-content">
                <div class="chat-header2">
                  <span class="chat-name">{{ room.hotelName }}</span>
                </div>
                <div class="chat-preview">
                  <span class="preview-text"
                    >{{ room.participants || 0 }} 명</span
                  >
                  <span class="unread-count">
                    {{ room.unReadCount > 99 ? "99+" : room.unReadCount }}
                  </span>
                </div>
                <div class="chat-location">
                  <span class="location-text"
                    >{{
                      userRole !== "HOST"
                        ? room.hotelAddress.split(" ")[0] + "·"
                        : ""
                    }}
                    {{ formatTime(room.lastMessageTime) }}</span
                  >
                </div>
              </div>
            </div>
          </template>

          <!-- 빈 상태 -->
          <div v-if="currentChatRooms.length === 0" class="empty-state">
            <div class="empty-content">
              <div class="empty-icon">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
                  />
                </svg>
              </div>
              <p class="empty-title">
                {{
                  activeTab === "private"
                    ? "1:1 채팅 방이 존재하지 않습니다"
                    : "그룹 채팅 방이 존재하지 않습니다"
                }}
              </p>
              <p class="empty-subtitle">채팅 방 목록이 이곳에 표시됩니다</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 오른쪽 채팅 화면 -->
      <div class="chat-main">
        <template v-if="selectedRoom">
          <div class="chat-header">
            <!-- 나가기 버튼을 헤더 최상단 오른쪽에 위치 -->
            <button
              v-if="userRole === 'USER'"
              class="exit-button-top"
              @click="showExitModal = true"
              title="채팅방 나가기"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
                />
              </svg>
            </button>

            <div class="header-content">
              <div class="chat-avatar-container">
                <div
                  class="chat-avatar"
                  :class="{ group: activeTab === 'group' }"
                >
                  <div v-if="activeTab === 'private'" class="avatar-circle">
                    {{ selectedRoom.hotelName?.charAt(0) || "H" }}
                  </div>
                  <div v-else class="avatar-circle group">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.004 3.004 0 0 0 16.91 6c-.8 0-1.54.5-1.85 1.26l-1.92 5.69c-.15.45.15.95.65.95h.91v6h4zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2.5 16v-7H6V9.5C6 8.12 7.12 7 8.5 7h3c1.38 0 2.5 1.12 2.5 2.5V15h-2v7h-4z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div class="header-info">
                <h3 class="chat-title">{{ selectedRoom.hotelName }}</h3>
                <p class="chat-status"></p>
              </div>
            </div>
          </div>

          <!-- 나가기 확인 모달 추가 -->
          <div
            v-if="showExitModal"
            class="modal-overlay"
            @click="showExitModal = false"
          >
            <div class="exit-modal" @click.stop>
              <div class="modal-header">
                <h3>채팅방 나가기</h3>
                <button class="modal-close" @click="showExitModal = false">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path
                      d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                    />
                  </svg>
                </button>
              </div>
              <div class="modal-body">
                <div class="modal-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="#ff4757"
                  >
                    <path
                      d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73z"
                    />
                  </svg>
                </div>
                <h4>정말로 이 채팅방에서 나가시겠습니까?</h4>
                <p>나간 후에는 이전 대화 내역을 볼 수 없습니다.</p>
              </div>
              <div class="modal-actions">
                <button class="cancel-btn" @click="showExitModal = false">
                  취소
                </button>
                <button class="confirm-btn" @click="confirmExit">나가기</button>
              </div>
            </div>
          </div>

          <!-- 성공 토스트 메시지 -->
          <div v-if="showSuccessToast" class="toast success-toast">
            <div class="toast-content">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              <span>채팅방에서 나갔습니다.</span>
            </div>
          </div>

          <!-- 에러 토스트 메시지 -->
          <div v-if="showErrorToast" class="toast error-toast">
            <div class="toast-content">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
              <span>채팅방 나가기에 실패했습니다.</span>
            </div>
          </div>

          <!-- 메시지 영역 -->
          <div
            class="messages-container"
            ref="messageArea"
            @scroll="handleScroll"
          >
            <div class="messages-wrapper">
              <!-- 공지사항 -->
              <div class="announcement-header">
                <span class="announcement-label">
                  <div class="announcement-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      />
                    </svg>
                  </div>
                  공지사항</span
                >

                <div
                  v-for="(announcement, index) in announcements"
                  :key="`announcement-${index}`"
                  :class="[
                    'announcement-item',
                    { important: announcement.isImportant },
                  ]"
                >
                  <div class="announcement-content">
                    <p class="announcement-text">{{ announcement.content }}</p>
                  </div>
                </div>
              </div>
              <div
                v-for="(msg, index) in messages"
                :key="index"
                class="message-item"
                :class="{ 'own-message': msg.senderEmail === userEmail }"
              >
                <!-- 상대방 메시지 -->
                <template v-if="msg.senderEmail !== userEmail">
                  <div class="message-content">
                    <div class="sender-name">
                      {{ msg.senderName || "Unknown User" }}
                    </div>
                    <div class="message-bubble incoming">
                      {{ msg.content }}
                    </div>
                    <div class="message-time">
                      {{ formatTime(msg.timestamp) }}
                    </div>
                  </div>
                </template>

                <!-- 내 메시지 -->
                <template v-else>
                  <div class="message-content outgoing">
                    <div class="message-bubble outgoing">
                      {{ msg.content }}
                    </div>
                    <div class="message-time">
                      {{ formatTime(msg.timestamp) }}
                    </div>
                  </div>
                </template>
              </div>

              <!-- 빈 메시지 상태 -->
              <div v-if="messages.length === 0" class="empty-messages">
                <div class="empty-message-content">
                  <div class="empty-icon">
                    <svg
                      width="64"
                      height="64"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
                      />
                    </svg>
                  </div>
                  <p>대화를 시작해보세요</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 메시지 입력 -->
          <div class="message-input-area">
            <div class="input-wrapper">
              <div>
                <input
                  v-model="newMessage"
                  class="message-input"
                  :disabled="remainingTime > 0"
                  placeholder="메세지를 입력해주세요."
                  @keydown.enter.prevent="sendMessage(selectedRoom?.roomId)"
                />
                <div class="input-footer">
                  <span class="char-count">{{ newMessage.length }}/1000</span>
                  <button
                    class="send-button"
                    :disabled="remainingTime > 0 || !newMessage.trim()"
                    @click="sendMessage(selectedRoom?.roomId)"
                  >
                    전송
                  </button>
                </div>
                <p v-if="remainingTime > 0">
                  남은 채팅 제한 시간: {{ remainingTime }}초 동안 메시지 입력이
                  제한됩니다.
                </p>
              </div>
            </div>
          </div>
        </template>

        <!-- 채팅방 선택 안됨 상태 -->
        <template v-else>
          <div class="no-selection">
            <div class="no-selection-content">
              <div class="no-selection-icon">
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
                  />
                </svg>
              </div>
              <h3>채팅방을 선택해주세요</h3>
              <p>예약이 완료되면 자동으로 채팅방이 생성됩니다.</p>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
  computed,
  nextTick,
  getCurrentInstance,
} from "vue";
import axios from "axios";
import { onBeforeRouteLeave, useRoute } from "vue-router";
import { userStompStore } from "@/store";

// 반응형 변수들
const activeTab = ref("private");
const newMessage = ref("");
const messages = ref([]);
const messageArea = ref(null);
const chatRooms = ref([]);
const selectedRoom = ref(null);
const isUserScrolling = ref(false);
const scrollTimeout = ref(null);
const route = useRoute();
const stompStore = ref(null);
const stompClient = ref(null);
const selectedRoomId = route.query.roomId;
let userEmail = "";

// Computed properties
const privateChatRooms = computed(() =>
  chatRooms.value.filter((r) => r.isGroupChat === "N")
);
const groupChatRooms = computed(() =>
  chatRooms.value.filter((r) => r.isGroupChat === "Y")
);
const currentChatRooms = computed(() =>
  activeTab.value === "private" ? privateChatRooms.value : groupChatRooms.value
);

// 시간 포맷팅 함수
const formatTime = (timestamp) => {
  if (!timestamp) return "";

  const date =
    getCurrentInstance().appContext.config.globalProperties.$dateUtils.parseServerDate(
      timestamp
    );
  if (!date) return "";

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } else {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "어제";
    } else {
      return date.toLocaleDateString("ko-KR", {
        month: "short",
        day: "numeric",
      });
    }
  }
};

// 스크롤 함수
const handleScroll = () => {
  if (!messageArea.value) return;
  const { scrollTop, scrollHeight, clientHeight } = messageArea.value;
  const scrolledToBottom =
    Math.abs(scrollHeight - clientHeight - scrollTop) < 5;

  if (!scrolledToBottom) {
    isUserScrolling.value = true;
    if (scrollTimeout.value) clearTimeout(scrollTimeout.value);
    scrollTimeout.value = setTimeout(() => {
      isUserScrolling.value = false;
    }, 3000);
  } else {
    isUserScrolling.value = false;
  }
};

const scrollToBottom = (force = false) => {
  if (!messageArea.value) return;
  if (force || !isUserScrolling.value) {
    nextTick(() => {
      if (messageArea.value)
        messageArea.value.scrollTop = messageArea.value.scrollHeight;
    });
  }
};

// 메시지 변경 시 자동 스크롤
watch(messages, () => scrollToBottom(), { deep: true });

// 탭 변경 시 첫 채팅방 선택
watch(activeTab, async (newVal) => {
  if (newVal === "private" && privateChatRooms.value.length > 0) {
    await selectRoom(privateChatRooms.value[0]);
  } else if (newVal === "group" && groupChatRooms.value.length > 0) {
    await selectRoom(groupChatRooms.value[0]);
  } else {
    selectedRoom.value = null;
  }
});

const announcements = ref([]);
function isValidBase64(str) {
  if (!str || typeof str !== "string") {
    return false;
  }

  // 기본적인 Base64 패턴 확인
  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Pattern.test(str)) {
    return false;
  }

  // 길이가 4의 배수인지 확인
  if (str.length % 4 !== 0) {
    return false;
  }

  // 실제로 디코딩이 가능한지 테스트
  try {
    const decoded = atob(str);
    // 디코딩된 결과가 바이너리 데이터처럼 보이는지 확인
    // (암호화된 데이터는 일반적으로 읽을 수 없는 바이너리 형태)
    return decoded.length > 0;
  } catch (e) {
    return false;
  }
}

// 채팅방 선택
const selectRoom = async (room) => {
  try {
    selectedRoom.value = room;
    console.log(room.roomId, " roomId=============");
    getMyRemaining(room?.roomId);

    if (selectedRoom.value.isGroupChat === "N") {
      await getKeys(room?.roomId);
      let message = selectedRoom.value.lastMessage;

      // lastMessage가 존재하고 유효한 암호화된 메시지인지 확인
      if (message && message.trim() && isValidBase64(message)) {
        try {
          message = await decryptMessage(message, Aes, iv);
          selectedRoom.value.lastMessage = message;
        } catch (decryptError) {
          console.error("lastMessage 복호화 실패:", decryptError);
        }
      }
    } else {
      selectedRoom.value.lastMessage =
        selectedRoom.value.lastMessage || "대화를 시작해보세요";
    }

    const roomId = room.roomId;
    isUserScrolling.value = false;

    await axios.post(
      `${process.env.VUE_APP_API_BASE_URL}/chat/room/${roomId}/read`
    );

    const announcementResponse = await axios.get(
      `${process.env.VUE_APP_API_BASE_URL}/chat/announcements/${roomId}`
    );

    const currentChatType = room.isGroupChat === "Y" ? "group" : "private";
    announcements.value = (announcementResponse.data.result || []).filter(
      (a) => a.isActive === "Y" && a.chatType === currentChatType
    );

    const { data } = await axios.get(
      `${process.env.VUE_APP_API_BASE_URL}/chat/history/${roomId}`
    );

    if (selectedRoom.value.isGroupChat === "N") {
      messages.value = []; // 먼저 비우기
      for (const msg of data) {
        try {
          // 메시지 내용이 유효한 암호화된 데이터인지 확인
          if (msg.content && msg.content.trim() && isValidBase64(msg.content)) {
            const decryptedContent = await decryptMessage(msg.content, Aes, iv);
            messages.value.push({ ...msg, content: decryptedContent });
          } else {
            // 암호화되지 않은 메시지이거나 빈 메시지인 경우
            messages.value.push({
              ...msg,
              content: msg.content || "[빈 메시지]",
            });
          }
        } catch (err) {
          console.error(
            "메시지 복호화 실패:",
            err,
            "원본 메시지:",
            msg.content
          );
          messages.value.push({ ...msg, content: "[복호화 실패]" });
        }
      }
    } else {
      messages.value = data || [];
    }

    const roomIndex = chatRooms.value.findIndex((r) => r.roomId === roomId);
    if (roomIndex !== -1) chatRooms.value[roomIndex].unReadCount = 0;

    setTimeout(() => scrollToBottom(true), 100);
  } catch (error) {
    console.error("채팅방 선택 오류:", error);
  }
};

// 메시지 전송
const sendMessage = async (roomId) => {
  if (!newMessage.value.trim()) return;
  if (!stompClient.value || !stompClient.value.connected) {
    console.error("WebSocket이 연결되지 않음");
    return;
  }
  let message = {};
  try {
    if (selectedRoom.value.isGroupChat === "N") {
      const encryptedContent = await encryptMessage(newMessage.value, Aes, iv);
      message = {
        roomId,
        senderEmail: userEmail,
        content: encryptedContent,
        timestamp: new Date().toISOString(),
      };
    } else {
      message = {
        roomId,
        senderEmail: userEmail,
        content: newMessage.value,
        timestamp: new Date().toISOString(),
      };
    }
    stompClient.value.send(`/publish/${roomId}`, JSON.stringify(message));
    newMessage.value = "";
    isUserScrolling.value = false;
    scrollToBottom(true);
  } catch (error) {
    console.error("메시지 전송 오류:", error);
  }
};

// 내 채팅방 목록 가져오기
const getMyChatRoom = async () => {
  try {
    const { data } = await axios.get(
      `${process.env.VUE_APP_API_BASE_URL}/chat/room/private/list`
    );
    console.log(data);
    chatRooms.value = data.result;

    // 1:1 채팅방들의 마지막 메시지 복호화
    for (const room of chatRooms.value) {
      if (
        room.isGroupChat === "N" &&
        room.lastMessage &&
        room.lastMessage.trim() &&
        isValidBase64(room.lastMessage)
      ) {
        try {
          // 각 방의 키를 가져와서 복호화
          const keysResponse = await axios.get(
            `${process.env.VUE_APP_API_BASE_URL}/chat/room/${room.roomId}/keys`
          );
          const { aes, iv } = keysResponse.data.result;

          const decryptedMessage = await decryptMessage(
            room.lastMessage,
            aes,
            iv
          );
          room.lastMessage = decryptedMessage;
        } catch (decryptError) {
          console.error(
            `Room ${room.roomId} 마지막 메시지 복호화 실패:`,
            decryptError
          );
          // 복호화 실패시 기본 메시지로 설정
          room.lastMessage = "대화를 시작해보세요";
        }
      }
    }

    // 기존 선택 로직
    if (selectedRoomId) {
      const room = chatRooms.value.find((r) => r.roomId === selectedRoomId);
      if (room) {
        await selectRoom(room);
        return;
      }
    }
    if (privateChatRooms.value.length > 0)
      await selectRoom(privateChatRooms.value[0]);
  } catch (error) {
    console.error("채팅방 목록 가져오기 실패:", error);
  }
};

const userRole = ref(null);

onMounted(async () => {
  userRole.value = localStorage.getItem("role");
  window.addEventListener("new-chat-message", onNewMessage);
  userEmail = localStorage.getItem("email");
  stompStore.value = userStompStore();
  stompClient.value = stompStore.value.stompClient;
  await getMyChatRoom();
  scrollToBottom(true);
});

const remainingTime = ref(0);
const getMyRemaining = async (roomId) => {
  if (!selectedRoom.value) return;
  const { data } = await axios.get(
    `${process.env.VUE_APP_API_BASE_URL}/chat/user/remaining/${roomId}`
  );
  console.log("======remain", (data.result - Date.now()) / 1000);

  remainingTime.value = Math.max(
    Math.floor((data.result - Date.now()) / 1000),
    0
  );
};

let timer = null;
watch(remainingTime, (val) => {
  if (val > 0 && !timer) {
    timer = setInterval(() => {
      if (remainingTime.value > 0) remainingTime.value--;
      else {
        clearInterval(timer);
        timer = null;
      }
    }, 1000);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener("new-chat-message", onNewMessage);
});

onBeforeRouteLeave(() => {
  window.removeEventListener("new-chat-message", onNewMessage);
});

const onNewMessage = async (event) => {
  const message = event.detail;
  console.log(message, "=============");
  console.log(message.remaining);
  remainingTime.value = Math.max(
    Math.floor((message.remaining - Date.now()) / 1000),
    0
  );

  if (message.roomId === selectedRoom.value?.roomId) {
    try {
      if (selectedRoom.value.isGroupChat === "N") {
        const decrypt = await decryptMessage(message.content, Aes, iv);

        messages.value.push({ ...message, content: decrypt });
      } else {
        remainingTime.value = message.remaining;
        messages.value.push(message);
      }
    } catch (err) {
      console.error("메시지 복호화 실패:", err);
      messages.value.push({ ...message, content: "[복호화 실패]" });
    }
  }
};

const readChatMessage = async () => {
  if (selectedRoom.value) {
    await axios.post(
      `${process.env.VUE_APP_API_BASE_URL}/chat/room/${selectedRoom.value.roomId}/read`
    );
  }
};

onBeforeRouteLeave(async (to, from, next) => {
  await readChatMessage();
  next();
});

window.addEventListener("beforeunload", readChatMessage);
onBeforeUnmount(() =>
  window.removeEventListener("beforeunload", readChatMessage)
);

let Aes = "";
let iv = "";

async function getKeys(roomId) {
  const { data } = await axios.get(
    `${process.env.VUE_APP_API_BASE_URL}/chat/room/${roomId}/keys`
  );
  console.log(data);
  Aes = data.result.aes;
  iv = data.result.iv;
  console.log(Aes);
  console.log(iv);
}

function base64ToArrayBuffer(base64) {
  if (!base64 || typeof base64 !== "string") {
    throw new Error("유효하지 않은 Base64 문자열입니다.");
  }

  try {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (error) {
    console.error("Base64 디코딩 실패:", error, "Input:", base64);
    throw new Error("Base64 디코딩에 실패했습니다: " + error.message);
  }
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function encryptMessage(message, base64Key, base64Iv) {
  const keyBuffer = base64ToArrayBuffer(base64Key);
  const ivBuffer = base64ToArrayBuffer(base64Iv);

  const key = await window.crypto.subtle.importKey(
    "raw",
    keyBuffer,
    "AES-GCM",
    false,
    ["encrypt"]
  );

  const encoded = new TextEncoder().encode(message);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
    key,
    encoded
  );

  return arrayBufferToBase64(encrypted);
}

async function decryptMessage(encryptedBase64, base64Key, base64Iv) {
  if (!encryptedBase64 || !base64Key || !base64Iv) {
    throw new Error("복호화에 필요한 매개변수가 누락되었습니다.");
  }

  if (
    !isValidBase64(encryptedBase64) ||
    !isValidBase64(base64Key) ||
    !isValidBase64(base64Iv)
  ) {
    throw new Error("유효하지 않은 Base64 데이터입니다.");
  }

  try {
    const keyBuffer = base64ToArrayBuffer(base64Key);
    const ivBuffer = base64ToArrayBuffer(base64Iv);
    const encryptedData = base64ToArrayBuffer(encryptedBase64);

    const key = await window.crypto.subtle.importKey(
      "raw",
      keyBuffer,
      "AES-GCM",
      false,
      ["decrypt"]
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(ivBuffer) },
      key,
      encryptedData
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("복호화 실패:", error);
    throw new Error("메시지 복호화에 실패했습니다: " + error.message);
  }
}

const showExitModal = ref(false);
const showSuccessToast = ref(false);
const showErrorToast = ref(false);

// 나가기 확인 함수
const confirmExit = async () => {
  if (!selectedRoom.value) return;

  try {
    await axios.patch(
      `${process.env.VUE_APP_API_BASE_URL}/chat/exit/${selectedRoom.value.roomId}`
    );

    // 성공적으로 나간 후 채팅방 목록에서 제거
    chatRooms.value = chatRooms.value.filter(
      (room) => room.roomId !== selectedRoom.value.roomId
    );

    // 선택된 채팅방 초기화
    selectedRoom.value = null;
    messages.value = [];

    // 남은 채팅방이 있다면 첫 번째 채팅방 선택
    if (privateChatRooms.value.length > 0 && activeTab.value === "private") {
      await selectRoom(privateChatRooms.value[0]);
    } else if (groupChatRooms.value.length > 0 && activeTab.value === "group") {
      await selectRoom(groupChatRooms.value[0]);
    }

    // 모달 닫고 성공 토스트 표시
    showExitModal.value = false;
    showSuccessToast.value = true;

    // 3초 후 토스트 숨기기
    setTimeout(() => {
      showSuccessToast.value = false;
    }, 3000);
  } catch (error) {
    console.error("채팅방 나가기 실패:", error);

    // 모달 닫고 에러 토스트 표시
    showExitModal.value = false;
    showErrorToast.value = true;

    // 3초 후 토스트 숨기기
    setTimeout(() => {
      showErrorToast.value = false;
    }, 3000);
  }
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.chat-wrapper {
  min-height: 100vh;
  background: #f8fafc;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-container {
  display: flex;
  width: 100%;
  max-width: 1200px;
  height: calc(100vh - 30px);
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "SF Pro Text",
    Helvetica, Arial, sans-serif;
}

/* 왼쪽 사이드바 */
.chat-sidebar {
  width: 300px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.sidebar-header {
  padding: 24px 20px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.sidebar-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 16px 0;
  letter-spacing: -0.025em;
}

.unread-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-label {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.toggle-input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e2e8f0;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: #ffffff;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-input:checked + .toggle-slider {
  background-color: #000000;
}

.toggle-input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.toggle-text {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

/* 탭 메뉴 */
.chat-tabs {
  background: #f8fafc;
  display: flex;
  padding: 0 20px 16px;
  gap: 8px;
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  background: #ffffff;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px;
  position: relative;
}

.tab-btn.active {
  background: #000000;
  color: #ffffff;
  border-color: #000000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.tab-btn:hover:not(.active) {
  background: #f1f5f9;
  color: #334155;
  border-color: #cbd5e1;
}

/* 채팅방 목록 */
.chat-list {
  background: #ffffff;
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.chat-item {
  height: 80px;
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  border-radius: 8px;
  background: #ffffff;
  border: 1px solid transparent;
}

.chat-item:hover {
  background: #f8fafc;
  transform: translateY(-1px);
  border-color: #e2e8f0;
}

.chat-item.active {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.chat-avatar-container {
  position: relative;
  margin-right: 16px;
  flex-shrink: 0;
}

.chat-avatar {
  width: 48px;
  height: 48px;
  position: relative;
}

.avatar-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, #000000 0%, #374151 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.hotel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.avatar-circle.group {
  background: linear-gradient(135deg, #374151 0%, #6b7280 100%);
}

.avatar-circle.small {
  width: 36px;
  height: 36px;
  font-size: 16px;
  border-radius: 50%;
}

.chat-content {
  flex: 1;
  min-width: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  margin-bottom: 2px;
}

.chat-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.preview-text {
  font-size: 12px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  max-width: 160px;
}

.chat-location {
  display: flex;
  align-items: center;
}

.location-text {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
}

.unread-count {
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 12px;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
}

/* 빈 상태 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  height: 100%;
}

.empty-content {
  text-align: center;
  max-width: 230px;
}

.empty-icon {
  color: #94a3b8;
  margin-bottom: 20px;
  opacity: 0.7;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #475569;
  margin: 0 0 8px 0;
}

.empty-subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.5;
}

/* 사이드바 하단 */
.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
}

.faq-link {
  color: #475569;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s ease;
}

.faq-link:hover {
  color: #000000;
}

/* 오른쪽 채팅 메인 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.chat-header {
  background: #f8fafc;
  padding: 4px 6px;
  border-bottom: 1px solid #e2e8f0;
}
.chat-header2 {
  background: #f1f5f9;
  padding: 6px 0px;
  border-bottom: 1px solid #e2e8f0;
}

.header-content {
  display: flex;
  align-items: center;
}

.chat-header .chat-avatar-container {
  margin-right: 16px;
}

.chat-header .chat-avatar {
  width: 44px;
  height: 44px;
}

.header-info {
  flex: 1;
  min-width: 0;
}

.chat-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.chat-status {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.temperature {
  color: #f59e0b;
  font-weight: 600;
}

.response-time {
  color: #94a3b8;
}

/* 메시지 영역 */
.messages-container {
  flex: 1;
  overflow-y: auto;
  background: #f8fafc;
  position: relative;
}

.messages-wrapper {
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
}

.message-item {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
}

.message-item.own-message {
  justify-content: flex-end;
}

.message-content {
  max-width: 75%;
}

.message-content.outgoing {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.sender-name {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
  margin-left: 4px;
  font-weight: 500;
}

.message-bubble {
  padding: 16px 20px;
  border-radius: 20px;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
  position: relative;
  max-width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.message-bubble.incoming {
  background: #ffffff;
  color: #1e293b;
  border-bottom-left-radius: 8px;
  border: 1px solid #e2e8f0;
}

.message-bubble.outgoing {
  background: #000000;
  color: #ffffff;
  border-bottom-right-radius: 8px;
}

.message-time {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 6px;
  margin-left: 4px;
  font-weight: 500;
}

.message-content.outgoing .message-time {
  margin-left: 0;
  margin-right: 4px;
  color: #64748b;
}

/* 빈 메시지 상태 */
.empty-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.empty-message-content {
  text-align: center;
  color: #94a3b8;
}

.empty-message-content .empty-icon {
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-message-content p {
  font-size: 18px;
  margin: 0;
  font-weight: 500;
}

/* 메시지 입력 */
.message-input-area {
  padding: 20px 28px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
}

.input-wrapper {
  /* display: flex; */
  max-width: 900px;
  margin: 0 auto;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #000000;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.input-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  color: #94a3b8;
}

.action-btn:hover {
  background-color: #e2e8f0;
  color: #64748b;
}

.action-btn svg {
  width: 20px;
  height: 20px;
}

.message-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 12px 0;
  font-size: 15px;
  background: transparent;
  color: #1e293b;
  resize: none;
  font-weight: 500;
  min-height: 24px;
}

.message-input::placeholder {
  color: #94a3b8;
}

.input-footer {
  display: flex;
  justify-content: end;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e2e8f0;
}

.char-count {
  margin-right: 10px;
  font-size: 12px;
  color: #94a3b8;
}

.send-button {
  background: #000000;
  color: #ffffff;
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.send-button:hover:not(:disabled) {
  background: #374151;
  transform: translateY(-1px);
}

.send-button:disabled {
  background: #e2e8f0;
  color: #94a3b8;
  cursor: not-allowed;
  transform: none;
}

/* 채팅방 선택 안됨 상태 */
.no-selection {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 60px;
}

.no-selection-content {
  text-align: center;
  max-width: 360px;
}

.no-selection-icon {
  color: #94a3b8;
  margin-bottom: 28px;
  opacity: 0.7;
}

.no-selection-content h3 {
  font-size: 24px;
  font-weight: 700;
  color: #475569;
  margin: 0 0 12px 0;
}

.no-selection-content p {
  font-size: 16px;
  color: #94a3b8;
  margin: 0;
  line-height: 1.6;
  font-weight: 500;
}

/* 스크롤바 스타일 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.7);
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .chat-sidebar {
    width: 225px;
  }

  .messages-wrapper {
    padding: 20px;
  }

  .chat-wrapper {
    padding: 16px;
  }

  .chat-container {
    height: calc(100vh - 32px);
  }
}

@media (max-width: 768px) {
  .chat-wrapper {
    padding: 12px;
  }

  .chat-container {
    flex-direction: column;
    height: calc(100vh - 24px);
    border-radius: 16px;
  }

  .chat-sidebar {
    width: 100%;
    height: 45vh;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }

  .chat-main {
    height: 55vh;
  }

  .messages-wrapper {
    padding: 16px;
  }

  .message-input-area {
    padding: 16px 20px;
  }

  .message-bubble {
    font-size: 14px;
    padding: 12px 16px;
  }
}

@media (max-width: 480px) {
  .sidebar-title {
    font-size: 18px;
  }

  .chat-name {
    font-size: 15px;
  }

  .preview-text {
    font-size: 13px;
  }

  .message-bubble {
    max-width: 90%;
  }

  .chat-wrapper {
    padding: 8px;
  }

  .chat-container {
    border-radius: 12px;
    height: calc(100vh - 16px);
  }
}

/* 공지사항 스타일 */
.announcement-item {
  display: flex;
  justify-content: center;
  margin: 6px 0;
  position: relative;
}

.announcement-item::before,
.announcement-item::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 60px;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    #e2e8f0 50%,
    transparent 100%
  );
  transform: translateY(-50%);
}

.announcement-item::before {
  left: -80px;
}

.announcement-item::after {
  right: -80px;
}

.announcement-container {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #000000;
  border-radius: 20px;
  padding: 20px 24px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.announcement-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #000000 0%, #374151 50%, #000000 100%);
}

.announcement-header {
  justify-self: center;
  text-align: center;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
  position: sticky;
  top: 0;
}

.announcement-icon {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #000000 0%, #374151 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  animation: announceGlow 2s ease-in-out infinite alternate;
}

@keyframes announceGlow {
  0% {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }
  100% {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  }
}

.announcement-icon svg {
  width: 16px;
  height: 16px;
}

.announcement-label {
  display: flex;
  justify-self: center;
  font-size: 16px;
  font-weight: 700;
  color: #000000;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  position: relative;
}

.announcement-label::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    #000000 50%,
    transparent 100%
  );
}

.announcement-content {
  text-align: center;
}

.announcement-text {
  font-size: 15px;
  line-height: 1.6;
  color: #1e293b;
  margin: 0 0 12px 0;
  font-weight: 500;
  letter-spacing: 0.2px;
}

.announcement-time {
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  background: #f1f5f9;
  padding: 6px 12px;
  border-radius: 12px;
  display: inline-block;
  border: 1px solid #e2e8f0;
}

/* 중요 공지사항 (우선순위가 높은 경우) */
.announcement-item.important .announcement-container {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
  animation: importantPulse 3s ease-in-out infinite;
}

.announcement-item.important .announcement-container::before {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 50%, #ef4444 100%);
}

.announcement-item.important .announcement-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.announcement-item.important .announcement-label {
  color: #ef4444;
}

@keyframes importantPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 15px 35px rgba(239, 68, 68, 0.2);
  }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .announcement-container {
    padding: 16px 20px;
    margin: 0 16px;
    max-width: calc(100% - 32px);
  }

  .announcement-item::before,
  .announcement-item::after {
    width: 40px;
  }

  .announcement-item::before {
    left: -60px;
  }

  .announcement-item::after {
    right: -60px;
  }

  .announcement-label {
    font-size: 14px;
  }

  .announcement-text {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .announcement-item::before,
  .announcement-item::after {
    display: none;
  }

  .announcement-container {
    margin: 0 8px;
    max-width: calc(100% - 16px);
    padding: 14px 16px;
  }

  .announcement-icon {
    width: 24px;
    height: 24px;
  }

  .announcement-icon svg {
    width: 14px;
    height: 14px;
  }
}
.chat-header {
  position: relative;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
}

.exit-button-top {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c757d;
  border: 1px solid #302828;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
}

.exit-button-top:hover {
  background: hwb(268 75% 20%);
  transform: translateY(-1px);
}

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
  backdrop-filter: blur(4px);
}

.exit-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  color: #7f8c8d;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f8f9fa;
  color: #2c3e50;
}

.modal-body {
  padding: 24px;
  text-align: center;
}

.modal-icon {
  margin-bottom: 16px;
}

.modal-body h4 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.modal-body p {
  margin: 0;
  font-size: 14px;
  color: #7f8c8d;
  line-height: 1.4;
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 0 24px 24px;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f8f9fa;
  color: #6c757d;
}

.cancel-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.confirm-btn {
  background: #6c757d;
  color: white;
}

.confirm-btn:hover {
  background: #6c757d;
  transform: translateY(-1px);
}

.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1001;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: toastSlideIn 0.3s ease-out;
}

@keyframes toastSlideIn {
  from {
    opacity: 0;
    transform: translateX(100px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.success-toast {
  background: #10ac84;
  color: white;
}

.error-toast {
  background: #6c757d;
  color: white;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
}

.toast-content svg {
  flex-shrink: 0;
}
</style>
