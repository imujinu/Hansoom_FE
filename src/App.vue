<template>
  <v-app>
    <HeaderComponent />
    <v-main :class="{ 'content-page': !isHomePage }">
      <router-view />
    </v-main>
    <FooterComponent />
    <!-- 채팅 알림창 -->
    <ChatNotification
      v-if="$route.name != 'ChatMain'"
      @send-reply="handleChatReply"
    />
    <!-- 전역 확인 모달 -->
    <v-dialog v-model="showConfirmModal" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-4">
          {{ confirmModalOptions.title }}
        </v-card-title>

        <v-card-text class="pa-4">
          {{ confirmModalOptions.message }}
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="outlined" @click="handleCancel" class="mr-2">
            아니오
          </v-btn>
          <v-btn
            :color="confirmModalOptions.confirmColor"
            @click="handleConfirm"
            :loading="confirmModalOptions.loading"
          >
            예
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import SockJS from "sockjs-client";
import Stomp from "webstomp-client";
import FooterComponent from "./components/FooterComponent.vue";
import HeaderComponent from "./components/HeaderComponent.vue";
import { userStompStore } from "./store";
import ChatNotification from "./views/Chat/ChatNotification.vue";
import axios from "axios";
export default {
  name: "App",
  components: {
    HeaderComponent,
    FooterComponent,
    ChatNotification,
  },
  data() {
    return {
      showConfirmModal: false,
      confirmModalOptions: {
        title: "확인",
        message: "정말로 진행하시겠습니까?",
        confirmColor: "#374151",
        loading: false,
      },
      token: null,
      stompStore: userStompStore(),
      confirmModalResolve: null,
      currentSubscription: null,
      userRooms: [],
      roomSubscriptions: {},
    };
  },
  computed: {
    isHomePage() {
      return this.$route.path === "/";
    },
    stompClient() {
      return this.stompStore.stompClient;
    },
  },
  mounted() {
    // 전역 모달 이벤트 리스너 등록
    window.addEventListener("show-confirm-modal", this.handleShowConfirmModal);
    this.token = localStorage.getItem("accessToken");
    this.connectWebSocket();
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  },
  beforeUnmount() {
    // 이벤트 리스너 제거
    window.removeEventListener(
      "show-confirm-modal",
      this.handleShowConfirmModal
    );
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
  },
  methods: {
    handleShowConfirmModal(event) {
      const options = event.detail;
      this.confirmModalOptions = {
        title: options.title || "확인",
        message: options.message || "정말로 진행하시겠습니까?",
        confirmColor: options.confirmColor || "#374151",
        loading: options.loading || false,
      };

      // Promise resolve 함수를 저장
      this.confirmModalResolve = options.resolve;
      this.showConfirmModal = true;
    },

    handleConfirm() {
      this.showConfirmModal = false;
      if (this.confirmModalResolve) {
        this.confirmModalResolve(true);
        this.confirmModalResolve = null;
      }
    },

    handleCancel() {
      this.showConfirmModal = false;
      if (this.confirmModalResolve) {
        this.confirmModalResolve(false);
        this.confirmModalResolve = null;
      }
    },
    async connectWebSocket() {
      if (!this.token) {
        console.log("비로그인 상태에서는 소켓 연결 안 함");
        return;
      }

      // 기존 연결이 있다면 먼저 정리
      if (this.stompClient && this.stompClient.connected) {
        console.log("기존 연결 정리 중...");
        this.disconnectWebSocket();
      }

      try {
        const sockJs = new SockJS(
          `${process.env.VUE_APP_API_BASE_URL}/connect`
        );
        this.stompStore.setClient(Stomp.over(sockJs));
        const client = this.stompClient;

        // heartbeat 설정
        client.heartbeat.outgoing = 20000;
        client.heartbeat.incoming = 60000;

        const connectHeaders = { Authorization: `Bearer ${this.token}` };

        client.connect(
          connectHeaders,
          async () => {
            console.log("WebSocket 연결 완료");
            await this.getAllChatRooms();
            await this.subscribeAllRooms();
          },
          (error) => {
            console.error("WebSocket 연결 오류:", error);
            this.scheduleReconnect();
          }
        );

        // 연결 종료 시 재연결
        client.ws.onclose = (event) => {
          console.warn("WebSocket 종료 감지:", event.code, event.reason);
          this.scheduleReconnect();
        };

        // 에러 발생 시 재연결
        client.ws.onerror = (error) => {
          console.error("WebSocket 에러:", error);
          this.scheduleReconnect();
        };
      } catch (error) {
        console.error("WebSocket 연결 실패:", error);
        this.scheduleReconnect();
      }
    },
    scheduleReconnect() {
      // 중복 재연결 방지
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      this.reconnectTimeout = setTimeout(() => {
        console.log("WebSocket 재연결 시도...");
        this.connectWebSocket();
      }, 5000);
    },

    async subscribeAllRooms() {
      if (!this.stompClient || !this.stompClient.connected || !this.userRooms) {
        console.warn("구독 조건이 충족되지 않음");
        return;
      }

      // 기존 구독 정리
      this.unsubscribeAllRooms();

      console.log("구독할 방 목록:", this.userRooms);

      this.userRooms.forEach((roomId) => {
        // roomId가 문자열이라고 가정
        if (this.roomSubscriptions[roomId]) {
          console.warn(`이미 구독 중인 방: ${roomId}`);
          return;
        }

        try {
          const subscription = this.stompClient.subscribe(
            `/topic/${roomId}`,
            async (msg) => {
              try {
                const parsed = JSON.parse(msg.body);
                console.log("메시지 수신:", parsed);

                // remaining 정보 조회
                const { data } = await axios.get(
                  `${process.env.VUE_APP_API_BASE_URL}/chat/user/remaining/${roomId}`
                );
              
                // 자신이 보낸 메시지가 아닌 경우 알림 표시
                if (parsed.senderEmail !== localStorage.getItem("email")) {
                  window.dispatchEvent(
                    new CustomEvent("show-chat-notification", {
                      detail: parsed,
                    })
                  );
                }

                // remaining 정보를 메시지에 추가
                const messageWithRemaining = {
                  ...parsed,
                  remaining: data.result,
                };

                // 모든 컴포넌트에 메시지 전달
                window.dispatchEvent(
                  new CustomEvent("new-chat-message", {
                    detail: messageWithRemaining,
                  })
                );
              } catch (error) {
                console.error("메시지 처리 오류:", error);
              }
            },
            {
              Authorization: `Bearer ${this.token}`,
            }
          );

          this.roomSubscriptions[roomId] = subscription;
          console.log(`방 구독 완료: ${roomId}`);
        } catch (error) {
          console.error(`방 구독 실패 (${roomId}):`, error);
        }
      });

      console.log(
        "전체 구독 완료. 구독 중인 방:",
        Object.keys(this.roomSubscriptions)
      );
    },
    unsubscribeAllRooms() {
      Object.entries(this.roomSubscriptions).forEach(
        ([roomId, subscription]) => {
          try {
            if (
              subscription &&
              typeof subscription.unsubscribe === "function"
            ) {
              subscription.unsubscribe();
              console.log(`방 구독 해제: ${roomId}`);
            }
          } catch (error) {
            console.error(`구독 해제 실패 (${roomId}):`, error);
          }
        }
      );
      this.roomSubscriptions = {};
    },
    disconnectWebSocket() {
      try {
        // 재연결 타이머 정리
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }

        // 모든 방 구독 해제
        this.unsubscribeAllRooms();

        // WebSocket 연결 종료
        if (this.stompClient && this.stompClient.connected) {
          this.stompClient.disconnect(() => {
            console.log("WebSocket 연결 해제 완료");
          });
        }

        // 스토어 클라이언트 정리
        this.stompStore.setClient(null);
      } catch (error) {
        console.error("연결 해제 오류:", error);
      }
    },

    handleBeforeUnload() {
      if (!this.token) {
        return;
      }
      if (this.stompClient && this.stompClient.connected) {
        console.log("연결끊기 실행", this.stompClient);
        this.stompClient.disconnect();
      }
    },
    async getAllChatRooms() {
      const { data } = await axios.get(
        `${process.env.VUE_APP_API_BASE_URL}/chat/user/rooms`
      );
      this.userRooms = data.result;
    },
  },
};
</script>

<style>
/* 콘텐츠 페이지에서 헤더 높이만큼 상단 여백 추가 */
.content-page {
  padding-top: 72px !important;
  background: #f8fafc;
}

/* 홈페이지에서는 상단 여백 제거 (원래대로 가려짐) */
.v-main:not(.content-page) {
  padding-top: 0 !important;
}
</style>
