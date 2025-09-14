<template>
  <v-container fluid class="bg-grey-lighten-4 min-h-screen pa-4">
    <v-row justify="center">
      <v-col cols="12" xl="10" lg="11">
        <v-card
          height="700"
          class="d-flex overflow-hidden rounded-xl"
          elevation="4"
        >
          <!-- Left Sidebar - Member List Only -->
          <div
            class="sidebar"
            style="
              width: 280px;
              background-color: white;
              border-right: 1px solid #e0e0e0;
            "
          >
            <!-- Header -->
            <div class="pa-4" style="border-bottom: 1px solid #e0e0e0">
              <div class="d-flex align-center mb-2">
                <v-icon color="primary" class="mr-3">mdi-account-group</v-icon>
                <div>
                  <h2 class="text-h6 font-weight-bold">멤버</h2>
                  <p class="text-caption text-grey">
                    {{ onlineCount || 0 }}명 온라인 •
                    {{ members?.length || 0 }}명 전체
                  </p>
                </div>
              </div>
            </div>

            <!-- Member List -->
            <div class="flex-grow-1 pa-4" style="overflow-y: auto">
              <div
                v-for="member in members"
                :key="member.id"
                class="d-flex align-center mb-4 pa-2 rounded-lg"
                :class="member.isOnline ? 'bg-primary-lighten-5' : ''"
              >
                <div class="position-relative mr-3">
                  <v-avatar
                    :size="member.isOnline ? 42 : 36"
                    :color="member.isOnline ? 'primary' : 'grey-lighten-2'"
                    class="elevation-1"
                  >
                    <v-img v-if="member.avatar" :src="member.avatar" />
                    <span
                      v-else
                      class="text-white font-weight-bold"
                      :style="{ fontSize: member.isOnline ? '16px' : '14px' }"
                    >
                      {{ member.name?.[0] || "?" }}
                    </span>
                  </v-avatar>
                  <!-- Online indicator -->
                  <div
                    v-if="member.isOnline"
                    class="position-absolute online-dot"
                  />
                </div>

                <div class="flex-grow-1" style="min-width: 0">
                  <div class="d-flex align-center mb-1">
                    <p
                      class="font-weight-medium text-truncate mr-2"
                      :class="
                        member.isOnline
                          ? 'text-body-1'
                          : 'text-body-2 text-grey-darken-1'
                      "
                      style="max-width: 120px"
                    >
                      {{ member.name || "알 수 없는 사용자" }}
                    </p>
                    <v-chip
                      :color="getRoleColor(member.role)"
                      size="x-small"
                      class="text-caption"
                      :variant="member.isOnline ? 'flat' : 'outlined'"
                    >
                      {{ getRoleName(member.role) }}
                    </v-chip>
                  </div>
                  <p
                    v-if="!member.isOnline && member.lastSeen"
                    class="text-caption text-grey"
                  >
                    {{ member.lastSeen }}
                  </p>
                  <p
                    v-else-if="member.isOnline"
                    class="text-caption text-success"
                  >
                    온라인
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Chat Area -->
          <div class="flex-grow-1 d-flex flex-column">
            <!-- Chat Header -->
            <div class="pa-4 chat-header">
              <div class="d-flex justify-space-between align-center">
                <div class="d-flex">
                  <v-avatar color="primary" size="48" class="mr-4">
                    <v-icon color="white" size="24">mdi-account-group</v-icon>
                  </v-avatar>
                  <div v-if="currentRoom">
                    <h2 class="text-h6 font-weight-bold">
                      {{ currentRoom.name }}
                    </h2>
                    <p class="text-caption text-grey">
                      {{ currentRoom.memberCount }}명이 참여 중
                    </p>
                  </div>
                  <div v-else>
                    <h2 class="text-h6 font-weight-bold">단체 채팅방</h2>
                    <p class="text-caption text-grey">로딩 중...</p>
                  </div>
                </div>

                <div class="d-flex justify-end mr-5">
                  <v-btn
                    icon
                    size="small"
                    variant="text"
                    @click="$router.back()"
                  >
                    <v-icon class="mr-2">mdi-arrow-left</v-icon>
                    뒤로가기
                  </v-btn>
                </div>
              </div>
            </div>

            <!-- Messages Area -->
            <div class="flex-grow-1 messages-container">
              <div ref="messagesContainer" class="pa-4 messages-scroll">
                <div
                  v-for="(message, index) in messages"
                  :key="index"
                  class="mb-6"
                >
                  <!-- System Message -->
                  <div
                    v-if="message.type === 'system'"
                    class="d-flex justify-center mb-4"
                  >
                    <v-chip color="grey-lighten-2" size="small" class="pa-3">
                      <span class="text-caption">{{ message.content }}</span>
                    </v-chip>
                  </div>

                  <!-- Regular Message -->
                  <div
                    v-else
                    :class="
                      message.senderEmail === userEmail
                        ? 'message-right'
                        : 'message-left'
                    "
                  >
                    <div
                      class="d-flex"
                      :class="
                        message.senderEmail === userEmail
                          ? 'flex-row-reverse'
                          : 'flex-row'
                      "
                    >
                      <!-- Avatar for other users -->
                      <v-avatar
                        v-if="message.senderEmail !== userEmail"
                        size="36"
                        class="mt-1 elevation-1"
                        :class="
                          message.senderEmail === userEmail ? 'ml-3' : 'mr-3'
                        "
                        color="grey-lighten-2"
                      >
                        <v-img
                          v-if="getSender(message.senderEmail)?.avatar"
                          :src="getSender(message.senderEmail)?.avatar"
                        />
                        <span
                          v-else
                          class="text-white font-weight-bold text-body-2"
                          >{{
                            (message.senderName && message.senderName[0]) || "?"
                          }}</span
                        >
                      </v-avatar>

                      <div
                        class="message-content"
                        :class="
                          message.senderEmail === userEmail ? 'my-message' : ''
                        "
                        :style="{
                          maxWidth:
                            message.senderEmail === userEmail ? '85%' : '70%',
                        }"
                      >
                        <!-- Sender info for other users -->
                        <div
                          v-if="message.senderEmail !== userEmail"
                          class="d-flex align-center mb-2"
                          style="width: 100%"
                        >
                          <span
                            class="text-body-2 font-weight-bold mr-2 text-grey-darken-2"
                            >{{
                              message.senderName || "알 수 없는 사용자"
                            }}</span
                          >
                          <v-chip
                            v-if="getSender(message.senderEmail)"
                            :color="
                              getRoleColor(getSender(message.senderEmail)?.role)
                            "
                            size="x-small"
                            class="text-caption"
                          >
                            {{
                              getRoleName(getSender(message.senderEmail)?.role)
                            }}
                          </v-chip>
                        </div>

                        <!-- Message bubble -->
                        <div
                          class="message-bubble pa-4 rounded-xl elevation-1"
                          :class="
                            message.senderEmail === userEmail
                              ? 'message-bubble-sent'
                              : 'message-bubble-received'
                          "
                        >
                          <p
                            class="text-body-2 mb-0"
                            style="word-break: break-word"
                          >
                            {{ message.content }}
                          </p>
                        </div>

                        <!-- Timestamp -->
                        <p
                          class="text-caption mt-2 mb-0 text-grey"
                          :class="
                            message.senderEmail === userEmail
                              ? 'text-right'
                              : 'text-left'
                          "
                        >
                          {{ formatTime(message.timestamp) }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Message Input -->
            <div class="pa-4 message-input">
              <div class="d-flex align-center">
                <v-text-field
                  v-model="newMessage"
                  @keydown.enter.prevent="handleSendMessage"
                  placeholder="메시지를 입력하세요..."
                  variant="filled"
                  density="comfortable"
                  hide-details
                  class="flex-grow-1 mr-3"
                  bg-color="grey-lighten-4"
                  rounded="xl"
                />
                <v-btn
                  @click="handleSendMessage"
                  :disabled="!newMessage.trim()"
                  color="primary"
                  icon
                  size="large"
                  elevation="0"
                  class="rounded-circle"
                >
                  <v-icon>mdi-send</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import axios from "axios";
import SockJS from "sockjs-client";
import {
  ref,
  computed,
  nextTick,
  onMounted,
  watch,
  onBeforeUnmount,
  getCurrentInstance,
} from "vue";
import { onBeforeRouteLeave, useRoute } from "vue-router";
import Stomp from "webstomp-client";

// Reactive data
const newMessage = ref("");
const selectedRoom = ref("general");
const messagesContainer = ref();
const route = useRoute();
const roomId = route.params.roomId;
const getMessageHistory = async () => {
  const { data } = await axios.get(
    `${process.env.VUE_APP_API_BASE_URL}/chat/history/${roomId}`
  );
  messages.value = data;
  console.log(data);
};

onMounted(async () => {
  await connectWebSocket();
  await getMessageHistory();
  await getGroupMembers();
  scrollToBottom();
});

const chatRooms = ref([
  { id: "general", name: "전체 채팅", memberCount: 0, unreadCount: 3 },
]);

const members = ref([
  // {
  //   id: "1",
  //   name: "김호스트",
  //   role: "HOST",
  //   isOnline: true,
  //   avatar:
  //     "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  // },
]);

const getGroupMembers = async () => {
  const { data } = await axios.get(
    `${process.env.VUE_APP_API_BASE_URL}/chat/room/${roomId}/group-user-list`
  );
  console.log(data);
  members.value = [...members.value, ...data.result];
};

const onlineCount = computed(
  () => members.value.filter((m) => m.isOnline === "Y").length
);
const readChatMessage = async () => {
  await axios.post(
    `${process.env.VUE_APP_API_BASE_URL}/chat/room/${roomId}/read`
  );
};

// 페이지 이동 시
onBeforeRouteLeave(async (to, from, next) => {
  await readChatMessage();
  next();
});

// 새로고침/브라우저 닫기 시
window.addEventListener("beforeunload", readChatMessage);

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", readChatMessage);
});

const messages = ref([
  {
    content: "채팅방 생성이 완료되었습니다.",
    roomId: 2,
    senderEmail: "admin@naver.com",
    senderName: null,
    timestamp: "2025-08-20T09:48:05.094266",
  },
]);

// Computed properties

const currentRoom = computed(() => {
  const room = chatRooms.value.find((room) => room.id === selectedRoom.value);
  return room ? { ...room, memberCount: members.value.length } : null;
});

// Methods
const userEmail = localStorage.getItem("email");

const handleSendMessage = async () => {
  if (newMessage.value.trim() === "") return;
  const message = {
    roomId: roomId,
    senderEmail: userEmail,
    content: newMessage.value.trim(),
    timestamp: new Date().toISOString(),
  };

  stompClient.send(`/publish/${roomId}`, JSON.stringify(message));
  newMessage.value = "";

  await nextTick();
  scrollToBottom();
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const getSender = (senderEmail) => {
  return members.value.find((m) => m.email === senderEmail);
};

const getRoleColor = (role) => {
  switch (role) {
    case "ADMIN":
      return "error";
    case "HOST":
      return "primary";
    case "USER":
      return "success";
    default:
      return "grey";
  }
};

const getRoleName = (role) => {
  switch (role) {
    case "ADMIN":
      return "관리자";
    case "HOST":
      return "호스트";
    case "USER":
      return "투숙객";
    default:
      return "사용자";
  }
};

// 시간 포맷팅 함수
const formatTime = (timestamp) => {
  if (!timestamp) return "";

  const date = getCurrentInstance().appContext.config.globalProperties.$dateUtils.parseServerDate(timestamp);
  if (!date) return "";
  
  const now = new Date();

  // 오늘 날짜인지 확인
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } else {
    return date.toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
};

// Watch for new messages to auto-scroll
watch(
  messages,
  () => {
    nextTick(() => {
      scrollToBottom();
    });
  },
  { deep: true }
);

// Lifecycle

let stompClient = null;
let token = "";

const connectWebSocket = () => {
  if (stompClient && stompClient.connected) return;

  const sockJs = new SockJS(`${process.env.VUE_APP_API_BASE_URL}/connect`);
  console.log(`port : ${process.env.VUE_APP_API_BASE_URL}`);
  stompClient = Stomp.over(sockJs);
  token = localStorage.getItem("accessToken");

  stompClient.connect(
    {
      Authorization: `Bearer ${token}`,
    },
    () => {
      stompClient.subscribe(
        `/topic/1`,
        (message) => {
          console.log("연결완료");
          console.log("메시지가 들어오는 중입니다.");
          console.log(message.body);

          const parsedMessage = JSON.parse(message.body);
          messages.value.push(parsedMessage);
          scrollToBottom();
        },
        {
          Authorization: `Bearer ${token}`,
        }
      );
    }
  );
};

const disconnectWebSocket = async () => {
  console.trace("disconnect 호출됨");
  if (stompClient && stompClient.connected) {
    stompClient.unsubscribe("/topic/1");
    stompClient.disconnect();
  }
};

onBeforeUnmount(() => {
  disconnectWebSocket();
});

onBeforeRouteLeave(() => {
  disconnectWebSocket();
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.sidebar {
  display: flex;
  flex-direction: column;
}

.chat-header {
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
}

.messages-container {
  overflow: hidden;
  background-color: #f8f9fa;
}

.messages-scroll {
  height: 100%;
  overflow-y: auto;
}

.message-input {
  background-color: white;
  border-top: 1px solid #e0e0e0;
}

.message-right {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.message-left {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
}

.message-content {
  max-width: 70%;
}

.message-bubble-sent {
  background-color: rgb(var(--v-theme-primary)) !important;
  color: white !important;
}

.message-bubble-received {
  background-color: white !important;
  border: 1px solid #e9ecef;
}

.online-dot {
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background-color: #4caf50;
  border-radius: 50%;
  border: 2px solid white;
}

/* Custom scrollbar styling */
.messages-scroll::-webkit-scrollbar {
  width: 6px;
}

.messages-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.messages-scroll::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.messages-scroll::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
