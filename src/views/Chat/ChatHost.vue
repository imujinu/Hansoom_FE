<template>
  <div style="min-height: 100vh; background-color: #f8f9fa">
    <v-container style="max-width: 1200px" class="py-6">
      <!-- 호텔 선택 + 탭 -->
      <div class="d-flex justify-space-between align-center mb-6">
        <!-- 탭 -->
        <v-tabs
          v-model="activeTab"
          color="primary"
          height="48"
          class="flex-grow-1"
        >
          <v-tab value="group-chat">
            <v-icon start>mdi-account-group</v-icon>
            단체 채팅 관리
          </v-tab>
          <v-tab value="conversations">
            <v-icon start>mdi-message-text</v-icon>
            1:1 채팅 관리
          </v-tab>
          <v-tab value="announcements">
            <v-icon start>mdi-volume-high</v-icon>
            공지사항 관리
          </v-tab>
        </v-tabs>

        <!-- 호텔 선택 Select / 등록 버튼 -->
        <!-- <div style="margin-left: 16px">
          <v-select
            v-if="hotels.length > 0"
            v-model="selectedHotelId"
            :items="hotels"
            item-title="name"
            item-value="hotelId"
            label="호텔 선택"
            variant="outlined"
            density="comfortable"
            hide-details
            style="max-width: 250px; height: 48px"
          />
          <v-btn
            v-else
            color="#666 !important"
            variant="outlined"
            @click="$router.push('/hotel/register')"
            style="height: 48px"
          >
            호텔 등록하러 가기
          </v-btn>
        </div> -->
      </div>

      <!-- Tab Contents -->
      <v-window v-model="activeTab">
        <!-- Group Chat Tab -->
        <v-window-item value="group-chat">
          <!-- No Group Chat State -->
          <v-card v-if="!groupChat" class="text-center pa-12">
            <v-icon size="64" color="grey-lighten-2" class="mb-4"
              >mdi-account-group</v-icon
            >
            <h3 class="text-h6 font-weight-medium mb-2">
              단체 채팅방이 없습니다
            </h3>
            <p class="text-body-1 text-grey-darken-1 mb-6">
              단체 채팅방은 호텔 등록 완료 후 자동 생성됩니다.
            </p>
            <v-btn
              @click="createGroupChat"
              color="#666 !important"
              size="large"
            >
              <v-icon start>mdi-plus</v-icon>
              단체 채팅방 생성
            </v-btn>
          </v-card>

          <!-- Group Chat Management -->
          <div v-else>
            <div class="d-flex justify-space-between align-center mb-6">
              <h2 class="text-h4 font-weight-bold">단체 채팅 관리</h2>
              <v-btn variant="outlined" @click="goToGroupChat(groupChat.id)">
                <v-icon start>mdi-eye</v-icon>
                채팅방 보기
              </v-btn>
            </div>

            <!-- Group Chat Overview Card -->
            <v-card class="mb-6" hover>
              <v-card-title class="d-flex justify-space-between align-center">
                <div class="d-flex align-center">
                  <v-icon color="grey-lighten-1" class="mr-2"
                    >mdi-account-group</v-icon
                  >
                  {{ groupChat.name }}
                </div>
              </v-card-title>

              <v-card-text style="color: #666">
                <!-- Statistics Row -->
                <v-row class="text-center mb-4">
                  <v-col cols="4">
                    <p class="text-h4 font-weight-bold">
                      {{ groupChat.participantCount }}
                    </p>
                    <p class="text-caption text-grey-darken-1">참여 인원</p>
                  </v-col>
                  <v-col cols="4">
                    <p class="text-h4 font-weight-bold">
                      {{ activeAnnouncementsCount }}
                    </p>
                    <p class="text-caption text-grey-darken-1">활성 공지</p>
                  </v-col>
                  <v-col cols="4">
                    <p class="text-h4 font-weight-bold">
                      {{ groupChat.isOnline }}
                    </p>
                    <p class="text-caption text-grey-darken-1">온라인</p>
                  </v-col>
                </v-row>

                <v-divider class="mb-4" />

                <!-- Last Message -->
                <div class="mb-4">
                  <p class="text-caption text-grey-darken-1 mb-2">
                    최근 메시지
                  </p>
                  <p class="text-body-1">{{ groupChat.lastMessage }}</p>
                  <p class="text-caption text-grey-darken-1 mt-1">
                    {{ groupChat.timestamp }}
                  </p>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-window-item>

        <!-- 1:1 Conversations Tab -->
        <v-window-item value="conversations">
          <h2 class="text-h4 font-weight-bold mb-6">1:1 채팅 관리</h2>

          <div v-if="conversations.length > 0">
            <v-card
              v-for="conversation in conversations"
              :key="conversation.id"
              class="mb-4"
              hover
            >
              <v-card-text class="pa-4">
                <div class="d-flex justify-space-between align-center">
                  <div class="d-flex align-center">
                    <v-avatar color="grey-lighten-2" class="mr-3">
                      <span class="text-grey-darken-2">{{
                        conversation.userName.charAt(0)
                      }}</span>
                    </v-avatar>
                    <div>
                      <h3 class="text-h6 font-weight-medium">
                        {{ conversation.userName }}
                      </h3>
                      <p class="text-body-2 text-grey-darken-1">
                        {{ conversation.lastMessage }}
                      </p>
                      <p class="text-caption text-grey">
                        {{ conversation.timestamp }}
                      </p>
                    </div>
                  </div>
                  <div class="d-flex align-center">
                    <v-chip
                      v-if="
                        conversation.unreadCount > 0
                          ? conversation.unreadCount
                          : 0
                      "
                      color="error"
                      variant="flat"
                      size="small"
                      class="mr-2"
                    >
                      {{ conversation.unreadCount }}
                    </v-chip>
                    <v-btn
                      variant="outlined"
                      color="grey-darken-5"
                      @click="goToChat(conversation.id)"
                    >
                      <v-icon start>mdi-message-text</v-icon>
                      답변하기
                    </v-btn>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </div>

          <v-card v-else class="text-center pa-12">
            <v-icon size="48" color="grey-lighten-2" class="mb-4"
              >mdi-message-text</v-icon
            >
            <h3 class="text-h6 font-weight-medium mb-2">1:1 채팅이 없습니다</h3>
            <p class="text-body-1 text-grey-darken-1">
              고객과의 개별 대화가 시작되면 여기에 표시됩니다.
            </p>
          </v-card>
        </v-window-item>

        <!-- Announcements Management Tab -->
        <v-window-item value="announcements">
          <h2 class="text-h4 font-weight-bold mb-6">공지사항 관리</h2>

          <!-- Action Buttons -->
          <div class="d-flex justify-space-between align-center mb-4">
            <div class="d-flex gap-2">
              <v-btn
                color="grey-darken-3"
                variant="outlined"
                @click="showAddAnnouncement = true"
              >
                <v-icon start>mdi-plus</v-icon>
                추가
              </v-btn>
              <v-btn
                v-if="selectedAnnouncements.length > 0"
                color="success"
                variant="outlined"
                @click="handleActivateAnnouncements"
              >
                <v-icon start>mdi-check-circle</v-icon>
                활성화
              </v-btn>
              <v-btn
                v-if="selectedAnnouncements.length > 0"
                color="warning"
                variant="outlined"
                @click="handleDeactivateAnnouncements"
              >
                <v-icon start>mdi-pause-circle</v-icon>
                비활성화
              </v-btn>
              <v-btn
                v-if="selectedAnnouncements.length > 0"
                color="error"
                variant="outlined"
                @click="confirmDelete = true"
              >
                <v-icon start>mdi-delete</v-icon>
                삭제
              </v-btn>
            </div>
          </div>

          <!-- Announcements List -->
          <v-card v-if="groupAnnouncements.length > 0">
            <v-card-text class="pa-0">
              <v-list>
                <v-list-item
                  v-for="announcement in groupAnnouncements"
                  :key="announcement.id"
                  class="border-b"
                >
                  <template v-slot:prepend>
                    <v-checkbox
                      v-model="selectedAnnouncements"
                      :value="announcement.id"
                      color="primary"
                    />
                  </template>

                  <v-list-item-title class="font-weight-medium">
                    {{ announcement.title }}
                  </v-list-item-title>

                  <v-list-item-subtitle class="mt-1">
                    {{ announcement.content }}
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <div class="d-flex align-center gap-2">
                      <v-chip
                        :color="
                          announcement.isActive === `Y` ? 'success' : 'grey'
                        "
                        size="small"
                        variant="flat"
                      >
                        {{ announcement.isActive === `Y` ? "활성" : "비활성" }}
                      </v-chip>
                      <v-chip
                        :color="
                          announcement.chatType === 'group'
                            ? 'primary'
                            : 'secondary'
                        "
                        size="small"
                        variant="outlined"
                      >
                        {{
                          announcement.chatType === "group"
                            ? "단체채팅"
                            : "개인채팅"
                        }}
                      </v-chip>
                      <span class="text-caption text-grey">
                        {{ announcement.createdAtFormatted }}
                      </span>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- No Announcements State -->
          <v-card v-else class="text-center pa-12">
            <v-icon size="48" color="grey-lighten-2" class="mb-4"
              >mdi-volume-high</v-icon
            >
            <h3 class="text-h6 font-weight-medium mb-2">공지사항이 없습니다</h3>
            <p class="text-body-1 text-grey-darken-1 mb-6">
              새로운 공지사항을 추가해보세요.
            </p>
            <v-btn
              color="grey-darken-4"
              size="large"
              @click="showAddAnnouncement = true"
            >
              <v-icon start>mdi-plus</v-icon>
              첫 공지사항 추가
            </v-btn>
          </v-card>
        </v-window-item>
      </v-window>

      <!-- Add Announcement Dialog -->
      <v-dialog v-model="showAddAnnouncement" max-width="600">
        <v-card>
          <v-card-title class="text-h5">
            <v-icon color="primary" class="mr-2">mdi-volume-high</v-icon>
            공지사항 추가
          </v-card-title>

          <v-card-text>
            <v-form ref="announcementForm">
              <v-text-field
                v-model="newAnnouncement.title"
                label="공지사항 제목"
                variant="outlined"
                :rules="[(v) => !!v || '제목을 입력해주세요']"
                required
                class="mb-4"
              />

              <v-textarea
                v-model="newAnnouncement.content"
                label="공지사항 내용"
                variant="outlined"
                :rules="[(v) => !!v || '내용을 입력해주세요']"
                required
                rows="4"
                class="mb-4"
              />

              <v-select
                v-model="newAnnouncement.chatType"
                :items="chatTypeOptions"
                label="적용 대상"
                variant="outlined"
                :rules="[(v) => !!v || '적용 대상을 선택해주세요']"
                required
              />
            </v-form>
          </v-card-text>

          <v-card-actions class="justify-end pa-4">
            <v-btn variant="text" @click="closeAddAnnouncementDialog">
              취소
            </v-btn>
            <v-btn color="primary" @click="handleCreateAnnouncement(hotels.id)">
              <v-icon start>mdi-plus</v-icon>
              추가
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Delete Confirmation Dialog -->
      <v-dialog v-model="confirmDelete" max-width="400">
        <v-card>
          <v-card-title class="text-h6">
            <v-icon color="error" class="mr-2">mdi-delete</v-icon>
            공지사항 삭제
          </v-card-title>

          <v-card-text>
            선택한 {{ selectedAnnouncements.length }}개의 공지사항을 정말
            삭제하시겠습니까?
            <br />
            <span class="text-error text-caption"
              >삭제된 공지사항은 복구할 수 없습니다.</span
            >
          </v-card-text>

          <v-card-actions class="justify-end">
            <v-btn variant="text" @click="confirmDelete = false"> 취소 </v-btn>
            <v-btn color="error" @click="handleDeleteAnnouncements">
              <v-icon start>mdi-delete</v-icon>
              삭제
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Legacy Dialogs (keeping existing functionality) -->
      <v-dialog v-model="groupChatManagementDialog" max-width="500">
        <v-card>
          <v-card-title>채팅방 설정</v-card-title>
          <v-card-text>
            <!-- 대표 이미지 미리보기 -->
            <div class="mb-4 d-flex justify-center">
              <v-avatar size="100">
                <img
                  :src="
                    groupChatSettings.imagePreview || groupChatSettings.image
                  "
                  alt="대표 이미지"
                />
              </v-avatar>
            </div>

            <!-- 이미지 업로드 -->
            <v-file-input
              v-model="groupChatSettings.imageFile"
              label="대표 이미지 업로드"
              accept="image/*"
              prepend-icon="mdi-image"
              outlined
              @change="handleImageChange"
            />

            <!-- 이름/설명 -->
            <v-text-field
              v-model="groupChatSettings.name"
              label="채팅방 이름"
              outlined
              class="mt-2"
            />
            <v-textarea
              v-model="groupChatSettings.description"
              label="채팅방 설명"
              outlined
              rows="3"
              class="mt-2"
            />
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn text @click="groupChatManagementDialog = false">취소</v-btn>
            <v-btn color="primary" @click="handleSaveGroupChatSettings"
              >저장</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Legacy Announcement Dialog (kept for compatibility) -->
      <v-dialog v-model="announcementDialog" max-width="500">
        <v-card>
          <v-card-title>단체 채팅 공지사항</v-card-title>
          <v-card-text>
            <div class="d-flex justify-space-between align-center mb-3">
              <v-label>공지사항 목록</v-label>
              <v-btn
                size="small"
                variant="outlined"
                @click="showAddAnnouncement = !showAddAnnouncement"
              >
                <v-icon start>mdi-plus</v-icon>
                추가
              </v-btn>
            </div>

            <div style="max-height: 200px; overflow-y: auto">
              <v-card
                v-for="announce in groupAnnouncements"
                :key="announce.id"
                variant="outlined"
                class="mb-2"
              >
                <v-card-text
                  class="d-flex justify-space-between align-center pa-2"
                >
                  <div>
                    <p class="text-body-2 font-weight-medium">
                      {{ announce.title }}
                    </p>
                    <p class="text-caption text-grey-darken-1">
                      {{ announce.createdAt }}
                    </p>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn color="primary" @click="announcementDialog = false"
              >확인</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script setup>
import router from "@/router";
import axios from "axios";
import { ref, computed, onMounted, getCurrentInstance } from "vue";

// Reactive data
const activeTab = ref("group-chat");
const groupChatManagementDialog = ref(false);
const announcementDialog = ref(false);
const showAddAnnouncement = ref(false);

// Announcements management
const selectedAnnouncements = ref([]);
const confirmDelete = ref(false);

const hotels = ref([]);
const selectedHotelId = ref(null);
const allChatRooms = ref([]);

// Chat type options for announcements
const chatTypeOptions = [
  { title: "단체 채팅방", value: "group" },
  { title: "개인 채팅방", value: "private" },
];

// const getMyHotel = async () => {
//   const { data } = await axios.get(
//     `${process.env.VUE_APP_API_BASE_URL}/chat/host/hotel`
//   );
//   console.log(data);
//   hotels.value = data.result;

//   if (hotels.value.length > 0) {
//     selectedHotelId.value = hotels.value[0].hotelId;
//   }
//   console.log(selectedHotelId.value);
// };

onMounted(async () => {
  // await getMyHotel();
  await getAllHostChats();
  await getAnnouncements();
});
const createGroupChat = async () => {
  await axios.post(`${process.env.VUE_APP_API_BASE_URL}/chat/host/create`);
  window.location.reload();
};

const groupChat = computed(() => {
  const chat = allChatRooms.value.find(
    (cr) => cr.hotelId === selectedHotelId.value && cr.isGroupChat === "Y"
  );
  if (!chat) return null;

  const instance = getCurrentInstance();
  if (!instance) return chat; // 안전하게 처리

  if (chat.timestamp) {
    const date =
      instance.appContext.config.globalProperties.$dateUtils.parseServerDate(
        chat.timestamp
      );
    if (!date) return null;

    const formatted =
      `${date.getMonth() + 1}월 ` +
      `${date.getDate()}일 ` +
      `${date.getHours()}시 ` +
      `${date.getMinutes()}분`;
    return { ...chat, timestamp: formatted };
  }

  return chat;
});

const conversations = computed(() =>
  allChatRooms.value
    .filter(
      (cr) => cr.hotelId === selectedHotelId.value && cr.isGroupChat === "N"
    )
    .map((cr) => {
      if (cr.timestamp) {
        return {
          ...cr,
          timestamp: formatTimestamp(cr.timestamp),
        };
      }
      return cr;
    })
);

const getAllHostChats = async () => {
  try {
    const { data } = await axios.get(
      `${process.env.VUE_APP_API_BASE_URL}/chat/host/all`
    );
    console.log(data);
    allChatRooms.value = data.result || [];
    if (allChatRooms.value.length > 0) {
  selectedHotelId.value = allChatRooms.value[0].hotelId;
}
  } catch (e) {
    console.error(e);
    allChatRooms.value = [];
  }
};

const getAnnouncements = async () => {
  const { data } = await axios.get(
    `${process.env.VUE_APP_API_BASE_URL}/chat/host/announcements`
  );
  groupAnnouncements.value = [
    ...data.result.map((a) => ({
      ...a,
      createdAtFormatted: formatTimestamp(a.createdAt),
    })),
    ...groupAnnouncements.value,
  ];
  console.log(data);
};
const formatTimestamp = (timestamp) => {
  const date =
    getCurrentInstance().appContext.config.globalProperties.$dateUtils.parseServerDate(
      timestamp
    );
  if (!date) return "";

  const month = date.getMonth() + 1;
  const day = date.getDate();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");

  const ampm = hours >= 12 ? "오후" : "오전";
  hours = hours % 12 || 12; // 12시간 형식으로 변환

  return `${month}월 ${day}일 ${ampm} ${hours}:${minutes}`;
};
const groupAnnouncements = ref([
  // Sample data - replace with actual API call
  // {
  //   id: "1",
  //   title: "체크인 안내",
  //   content:
  //     "체크인은 오후 3시부터 가능합니다. 더 일찍 도착하시면 짐을 맡아드릴 수 있어요.",
  //   isActive: true,
  //   chatType: "group",
  //   createdAt: "2024-08-15 14:30",
  // },
]);

const newAnnouncement = ref({
  title: "",
  content: "",
  chatType: "",
});

// Computed properties
const activeAnnouncementsCount = computed(
  () => groupAnnouncements.value.filter((a) => a.isActive).length
);

// Announcement management functions
const handleCreateAnnouncement = async (hotelId) => {
  if (!hotelId && groupChat.value) {
    hotelId = groupChat.value.id;
  }

  if (
    newAnnouncement.value.title.trim() &&
    newAnnouncement.value.content.trim() &&
    newAnnouncement.value.chatType
  ) {
    const announcement = {
      hotelId,
      title: newAnnouncement.value.title,
      content: newAnnouncement.value.content,
      chatType: newAnnouncement.value.chatType,
      isActive: "Y",
    };

    try {
      const { data } = await axios.post(
        `${process.env.VUE_APP_API_BASE_URL}/chat/host/announcement`,
        announcement
      );

      // Add to local state with generated ID
      const newItem = {
        ...data.result,
      };

      groupAnnouncements.value = [newItem, ...groupAnnouncements.value];
      closeAddAnnouncementDialog();
    } catch (error) {
      console.error("공지사항 생성 실패:", error);
    }
  }
};

const closeAddAnnouncementDialog = () => {
  newAnnouncement.value = { title: "", content: "", chatType: "" };
  showAddAnnouncement.value = false;
};

const handleActivateAnnouncements = async () => {
  try {
    // API call to activate announcements
    await axios.patch(
      `${process.env.VUE_APP_API_BASE_URL}/chat/host/announcements/activate`,
      { ids: selectedAnnouncements.value, isActive: "Y" }
    );

    // Update local state
    groupAnnouncements.value = groupAnnouncements.value.map((announcement) => {
      if (selectedAnnouncements.value.includes(announcement.id)) {
        return { ...announcement, isActive: "Y" };
      }
      return announcement;
    });

    selectedAnnouncements.value = [];
  } catch (error) {
    console.error("공지사항 활성화 실패:", error);
  }
};

const handleDeactivateAnnouncements = async () => {
  try {
    // API call to deactivate announcements
    console.log(selectedAnnouncements.value);
    await axios.patch(
      `${process.env.VUE_APP_API_BASE_URL}/chat/host/announcements/activate`,
      { ids: selectedAnnouncements.value, isActive: "N" }
    );

    // Update local state
    groupAnnouncements.value = groupAnnouncements.value.map((announcement) => {
      if (selectedAnnouncements.value.includes(announcement.id)) {
        return { ...announcement, isActive: "N" };
      }
      return announcement;
    });

    selectedAnnouncements.value = [];
  } catch (error) {
    console.error("공지사항 비활성화 실패:", error);
  }
};

const handleDeleteAnnouncements = async () => {
  try {
    // API call to delete announcements
    await axios.delete(
      `${process.env.VUE_APP_API_BASE_URL}/chat/announcements/delete`,
      { data: selectedAnnouncements.value }
    );

    // Update local state
    groupAnnouncements.value = groupAnnouncements.value.filter(
      (announcement) => !selectedAnnouncements.value.includes(announcement.id)
    );

    selectedAnnouncements.value = [];
    confirmDelete.value = false;
  } catch (error) {
    console.error("공지사항 삭제 실패:", error);
  }
};

// Navigation functions
const goToGroupChat = (roomId) => {
  router.push({ name: "ChatMain", params: { roomId } });
};

const goToChat = (roomId) => {
  router.push({ name: "ChatMain", params: { roomId } });
};

// Legacy group chat settings
const groupChatSettings = ref({
  image: groupChat.value?.image || "",
  imageFile: null,
  imagePreview: null,
  name: groupChat.value?.name || "",
  description: groupChat.value?.description || "",
});

const handleSaveGroupChatSettings = () => {
  console.log("저장할 정보:", groupChatSettings.value);
  groupChatManagementDialog.value = false;

  const idx = allChatRooms.value.findIndex(
    (cr) => cr.id === groupChat.value.id
  );
  if (idx !== -1) {
    allChatRooms.value[idx] = {
      ...allChatRooms.value[idx],
      ...groupChatSettings.value,
    };
  }
};
</script>

<style scoped>
.space-y-6 > * + * {
  margin-top: 24px;
}

.v-btn {
  color: grey-lighten-1 !important;
}

.border-b:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.gap-2 {
  gap: 8px;
}

/* 커스텀 탭 스타일 - 파란색 제거 */
.v-tab--selected {
  color: black !important;
}

.v-tab {
  color: #666 !important;
}

.v-tab:hover {
  color: black !important;
}

/* 탭 슬라이더 색상 */
.v-tabs-slider {
  background-color: black !important;
}

/* 선택된 탭 아이콘 색상 */
.v-tab--selected .v-icon {
  color: black !important;
}

/* 체크박스 선택 색상 */
.v-selection-control--dirty .v-selection-control__input {
  color: black !important;
}
</style>
