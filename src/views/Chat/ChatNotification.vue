<template>
  <div v-if="showNotification" class="chat-notification-overlay">
    <div class="chat-notification-container">
      <!-- 채팅방명 -->
      <div class="chat-room-title">{{ currentMessage.roomName }}</div>

      <!-- 알림 제어 버튼들 -->
      <div class="notification-controls">
        <!-- <v-btn
          icon
          size="small"
          variant="text"
          @click="toggleNotification"
          class="control-btn"
        >
          <v-icon size="16" :color="notificationEnabled ? '#666' : '#999'">
            {{ notificationEnabled ? "mdi-bell" : "mdi-bell-off" }}
          </v-icon>
        </v-btn> -->
        <v-btn
          icon
          size="small"
          variant="text"
          @click="goToChatRoom(currentMessage.roomId)"
          class="control-btn"
        >
          <v-icon size="16" color="#666">mdi-chat</v-icon>
        </v-btn>
        <v-btn
          icon
          size="small"
          variant="text"
          @click="closeNotification"
          class="control-btn"
        >
          <v-icon size="16" color="#666">mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- 메시지 내용 -->
      <div class="message-content">
        <v-btn
          v-if="messages.length > 1"
          icon
          size="small"
          variant="text"
          @click="previousMessage"
          class="nav-btn nav-btn-left"
          :disabled="currentIndex === 0"
        >
          <v-icon size="16">mdi-chevron-left</v-icon>
        </v-btn>

        <div class="profile-section">
          <v-avatar size="40" class="profile-avatar">
            <v-img
              :src="currentMessage.profileImage || '/default-avatar.png'"
              :alt="currentMessage.senderName"
            >
              <template v-slot:error>
                <div class="default-avatar">
                  {{ currentMessage.senderName?.charAt(0) || "?" }}
                </div>
              </template>
            </v-img>
          </v-avatar>
        </div>

        <div class="message-info">
          <div class="sender-name">{{ currentMessage.senderName }}</div>
          <div class="message-text">{{ currentMessage.message }}</div>
          <div class="message-time">
            {{ formatTime(currentMessage.timestamp) }}
          </div>
        </div>

        <v-btn
          v-if="messages.length > 1"
          icon
          size="small"
          variant="text"
          @click="nextMessage"
          class="nav-btn nav-btn-right"
          :disabled="currentIndex === messages.length - 1"
        >
          <v-icon size="16">mdi-chevron-right</v-icon>
        </v-btn>
      </div>

      <div v-if="messages.length > 1" class="message-indicator">
        {{ currentIndex + 1 }} / {{ messages.length }}
      </div>

      <div class="reply-section">
        <v-text-field
          v-model="replyMessage"
          placeholder="메시지 입력"
          variant="outlined"
          density="compact"
          hide-details
          class="reply-input"
          @keyup.enter="sendReply"
        >
          <template v-slot:append-inner>
            <v-btn
              icon
              size="small"
              variant="text"
              @click="sendReply"
              :disabled="!replyMessage.trim()"
              class="send-btn"
            >
              <v-icon size="16" color="primary">mdi-send</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </div>
    </div>
  </div>
</template>

<script setup>
import router from "@/router";
import { userStompStore } from "@/store";
import axios from "axios";
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { VBtn, VIcon, VAvatar, VImg } from "vuetify/components";

const showNotification = ref(false);
const messages = ref([]);
const currentIndex = ref(0);
const replyMessage = ref("");
const notificationEnabled = ref(true);

let autoCloseTimer = null;

const currentMessage = computed(() => messages.value[currentIndex.value] || {});

const handleNewMessage = async (event) => {
  if (!notificationEnabled.value) return;

  const messageData = event.detail;
  if (messageData.isGroupChat === "N") {
    await getKeys(messageData.roomId);
    const decrypt = await decryptMessage(messageData.content, Aes, iv);
    messages.value.unshift({
      id: messageData.roomId || Date.now(),
      isGroupChat: messageData.isGroupChat || "N",
      roomName: messageData.roomName || "채팅",
      senderName: messageData.senderName || "익명",
      message: decrypt || "",
      profileImage: messageData.profileImage,
      timestamp: messageData.timestamp || new Date(),
    });
  } else {
    messages.value.unshift({
      id: messageData.roomId || Date.now(),
      isGroupChat: messageData.isGroupChat || "N",
      roomName: messageData.roomName || "채팅",
      senderName: messageData.senderName || "익명",
      message: messageData.content || "",
      profileImage: messageData.profileImage,
      timestamp: messageData.timestamp || new Date(),
    });
  }

  if (messages.value.length > 5) messages.value = messages.value.slice(0, 5);

  currentIndex.value = 0;
  showNotification.value = true;
  startAutoCloseTimer();
};

const startAutoCloseTimer = () => {
  if (autoCloseTimer) clearTimeout(autoCloseTimer);
  autoCloseTimer = setTimeout(() => closeNotification(), 1000000);
};

const previousMessage = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    startAutoCloseTimer();
  }
};

const nextMessage = () => {
  if (currentIndex.value < messages.value.length - 1) {
    currentIndex.value++;
    startAutoCloseTimer();
  }
};

// const toggleNotification = () => {
//   notificationEnabled.value = !notificationEnabled.value;
//   if (!notificationEnabled.value) closeNotification();
// };
const goToChatRoom = (roomId) => {
  router.push({ path: "/chat", query: { roomId } });
};
const closeNotification = () => {
  showNotification.value = false;
  messages.value = [];
  currentIndex.value = 0;
  replyMessage.value = "";
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }
};

const sendReply = async () => {
  if (!replyMessage.value.trim()) return;
  const stompClient = userStompStore().stompClient;
  if (!stompClient || !stompClient.connected) {
    console.warn("STOMP client not connected yet");
    return;
  }
  console.log(currentMessage);
  let message = {};
  if (currentMessage.value.isGroupChat === "N") {
    const encrypt = await encryptMessage(replyMessage.value, Aes, iv);
    message = {
      roomId: currentMessage.value.id,
      senderEmail: localStorage.getItem("email"),
      content: encrypt,
      timestamp: new Date().toISOString(),
    };
  } else {
    message = {
      roomId: currentMessage.value.id,
      senderEmail: localStorage.getItem("email"),
      content: replyMessage.value,
      timestamp: new Date().toISOString(),
    };
  }
  stompClient.send(`/publish/${message.roomId}`, JSON.stringify(message));
  messages.value.splice(currentIndex.value, 1);
  // currentIndex 조정
  if (currentIndex.value >= messages.value.length) {
    currentIndex.value = messages.value.length - 1;
  }

  // 메시지 없으면 알림 닫기
  showNotification.value = messages.value.length > 0;

  replyMessage.value = "";
  //   closeNotification();
};

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return "방금 전";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (date.toDateString() === now.toDateString())
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

let Aes = "";
let iv = "";
watch(currentMessage, (newVal) => {
  if (newVal && newVal.id) getKeys(newVal.id);
});
async function getKeys(roomId) {
  if (!roomId) return;
  const { data } = await axios.get(
    `${process.env.VUE_APP_API_BASE_URL}/chat/room/${roomId}/keys`
  );
  Aes = data.result.aes;
  iv = data.result.iv;
}

onMounted(() => {
  window.addEventListener("show-chat-notification", handleNewMessage);
});

onBeforeUnmount(() => {
  window.removeEventListener("show-chat-notification", handleNewMessage);
  if (autoCloseTimer) clearTimeout(autoCloseTimer);
});

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
</script>

<style scoped>
.chat-notification-overlay {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui,
    sans-serif;
}

.chat-notification-container {
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.chat-room-title {
  background: #f8fafc;
  padding: 8px 16px;
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  text-align: center;
}

.notification-controls {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  z-index: 10;
}

.control-btn {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.06) !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04) !important;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.95) !important;
  transform: scale(1.05);
}

.message-content {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 16px;
  gap: 12px;
  min-height: 80px;
}

.nav-btn {
  position: absolute;
  top: 116%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.06) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  z-index: 2;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.95) !important;
  transform: translateY(-50%) scale(1.1);
}

.nav-btn:disabled {
  opacity: 0.3;
}

.nav-btn-left {
  left: 8px;
}

.nav-btn-right {
  right: 8px;
}

.profile-section {
  flex-shrink: 0;
  margin-top: 2px;
}

.profile-avatar {
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.default-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.message-info {
  flex: 1;
  min-width: 0;
  padding-right: 40px; /* 네비게이션 버튼 공간 확보 */
}

.sender-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  line-height: 1.2;
}

.message-text {
  font-size: 13px;
  color: #374151;
  line-height: 1.4;
  margin-bottom: 4px;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.message-time {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 400;
}

.message-indicator {
  text-align: center;
  padding: 8px 16px;
  font-size: 11px;
  color: #9ca3af;
  background: #f8fafc;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
}

.reply-section {
  padding: 12px 16px;
  background: #f8fafc;
}

.reply-input :deep(.v-field) {
  background: white !important;
  border-radius: 8px !important;
  font-size: 13px;
}

.reply-input :deep(.v-field__input) {
  min-height: 36px;
  padding: 8px 12px;
}

.reply-input :deep(.v-field__outline) {
  --v-field-border-width: 1px;
  --v-field-border-opacity: 0.12;
}

.send-btn {
  margin-right: -4px;
}

.send-btn:hover {
  background: rgba(25, 118, 210, 0.1) !important;
  transform: scale(1.1);
}

/* 다크 모드 대응 */
@media (prefers-color-scheme: dark) {
  .chat-notification-container {
    background: #1e293b;
    border-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .chat-room-title {
    background: #0f172a;
    color: #94a3b8;
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }

  .sender-name {
    color: #f1f5f9;
  }

  .message-text {
    color: #cbd5e1;
  }

  .reply-section,
  .message-indicator {
    background: #0f172a;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .reply-input :deep(.v-field) {
    background: #334155 !important;
    color: white;
  }

  .control-btn,
  .nav-btn {
    background: rgba(30, 41, 59, 0.9) !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
  }
}

/* 모바일 반응형 */
@media (max-width: 480px) {
  .chat-notification-overlay {
    left: 8px;
    right: 8px;
    top: 8px;
  }

  .chat-notification-container {
    width: auto;
    max-width: none;
  }

  .message-info {
    padding-right: 32px;
  }

  .nav-btn-left {
    left: 4px;
  }

  .nav-btn-right {
    right: 4px;
  }
}
</style>
