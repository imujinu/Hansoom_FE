<template>
  <v-container>
    <v-row class="align-center mb-4">
      <v-col cols="8">
        <h1>{{ modeConfig.title }}</h1>
        <p>{{ modeConfig.subtitle }}</p>
      </v-col>
      <v-col cols="4" class="text-end" v-if="!isReadonly">
        <Button
          label="+ 추가"
          :class="{ 'large-button': true }"
          @click="addRoom"
          :disabled="isLoading"
        />
      </v-col>
    </v-row>

    <v-row v-for="(room, index) in rooms" :key="index">
      <v-col cols="12">
        <v-card outlined class="pa-4 mb-4">
          <v-card-title class="d-flex align-center justify-space-between">
            <span>객실 정보 #{{ index + 1 }}</span>
            <span v-if="isReadonly && room.state === 'REMOVE'">삭제됨</span>
            <v-btn 
              v-if="!isReadonly && rooms.length > 1" 
              icon 
              color="error" 
              @click="removeRoom(index)"
              :disabled="isLoading"
            >
              <v-icon>mdi-trash-can-outline</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="5">
                <div 
                  class="upload-box" 
                  :class="{ 'readonly': isReadonly, 'disabled': isLoading, 'error-border': roomErrors[index]?.roomImages }"
                  @click="isReadonly || isLoading ? null : triggerFileInput(index)"
                >
                  <template v-if="room.roomImages.length > 0">
                    <div class="image-preview-container">
                      <div class="image-count-badge">
                        <v-icon small>mdi-camera</v-icon>
                        {{ room.roomImages.length }}/4
                      </div>
                      <div class="preview-list-vertical">
                        <div 
                          v-for="(img, i) in room.roomImages.slice(0, 4)" 
                          :key="i" 
                          class="preview-item-vertical"
                        >
                          <div class="preview-thumbnail">
                            <img :src="img.url" class="preview-image" />
                            <div
                              v-if="!isReadonly && !isLoading"
                              class="remove-btn-vertical"
                              @click.stop="removeImage(index, i)"
                            >
                              <v-icon x-small color="white">mdi-close</v-icon>
                            </div>
                          </div>
                          <div class="image-info">
                            <span class="image-name">{{ getImageName(img, i) }}</span>
                          </div>
                        </div>
                      </div>
                      <div v-if="room.roomImages.length > 4" class="more-images-text">
                        +{{ room.roomImages.length - 4 }}개 더 있음
                      </div>
                    </div>
                  </template>
                  <div v-else class="text-center">
                    <v-icon size="48" color="grey-lighten-1" class="mb-2">mdi-image-plus</v-icon>
                    <p class="upload-text">{{ isReadonly ? '이미지 없음' : '클릭하여 이미지를 업로드하거나 파일을 드래그해주세요' }}</p>
                    <small v-if="!isReadonly" class="upload-hint">PNG, JPG, GIF 파일 (최대 4개 선택 가능)</small>
                  </div>
                  <input
                    type="file"
                    :ref="el => fileInputs[index] = el"
                    multiple
                    style="display:none"
                    accept="image/*"
                    @change="onFileChange($event, index)"
                    :disabled="isReadonly || isLoading"
                  >
                </div>
                <!-- 이미지 오류 메시지 -->
                <div>
                  <div class="error-message" v-if="roomErrors[index]?.roomImages">
                    이미지를 등록해주세요.
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="7">
                <div class="form-field-container">
                  <label class="input-label">객실타입</label>
                  <InputText 
                    v-model="room.type" 
                    placeholder="예: 스탠다드룸, 디럭스룸" 
                    :readonly="isReadonly"
                    :disabled="isReadonly || isLoading"
                    @input="clearError(index, 'type')"
                    :class="{ 'p-invalid': roomErrors[index]?.type }"
                    class="w-full"
                  />
                  <!-- 객실타입 오류 메시지 -->
                  <div class="error-message-container">
                    <div class="error-message" v-if="roomErrors[index]?.type">
                      {{ roomErrors[index]?.type }}
                    </div>
                  </div>
                </div>

                <v-row>
                  <v-col cols="6">
                    <div class="form-field-container">
                      <label class="input-label">기준인원</label>
                      <InputText 
                        v-model.number="room.basePeople" 
                        type="number" 
                        :readonly="isReadonly"
                        :disabled="isReadonly || isLoading"
                        @input="emitChange"
                        class="w-full"
                      />
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <div class="form-field-container">
                      <label class="input-label">최대인원</label>
                      <InputText 
                        v-model.number="room.maxPeople" 
                        type="number" 
                        :readonly="isReadonly"
                        :disabled="isReadonly || isLoading"
                        @input="emitChange"
                        class="w-full"
                      />
                    </div>
                  </v-col>
                </v-row>

                <v-row>
                  <v-col cols="6">
                    <div class="form-field-container">
                      <label class="input-label">주중 가격</label>
                      <InputText 
                        v-model.number="room.weekPrice" 
                        type="number" 
                        :readonly="isReadonly"
                        :disabled="isReadonly || isLoading"
                        @input="clearError(index, 'weekPrice')"
                        :class="{ 'p-invalid': roomErrors[index]?.weekPrice }"
                        class="w-full"
                      />
                      <!-- 주중 가격 오류 메시지 -->
                      <div class="error-message-container">
                        <div class="error-message" v-if="roomErrors[index]?.weekPrice">
                          {{ roomErrors[index]?.weekPrice }}
                        </div>
                      </div>
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <div class="form-field-container">
                      <label class="input-label">주말 가격</label>
                      <InputText 
                        v-model.number="room.weekendPrice" 
                        type="number" 
                        :readonly="isReadonly"
                        :disabled="isReadonly || isLoading"
                        @input="clearError(index, 'weekendPrice')"
                        :class="{ 'p-invalid': roomErrors[index]?.weekendPrice }"
                        class="w-full"
                      />
                      <!-- 주말 가격 오류 메시지 -->
                      <div class="error-message-container">
                        <div class="error-message" v-if="roomErrors[index]?.weekendPrice">
                          {{ roomErrors[index]?.weekendPrice }}
                        </div>
                      </div>
                    </div>
                  </v-col>
                </v-row>
                
                <!-- PrimeVue DatePicker를 사용한 체크인/체크아웃 시간 -->
                <v-row>
                  <v-col cols="6">
                    <div class="form-field-container">
                      <div class="time-picker-container">
                        <label class="time-picker-label">체크인 시간</label>
                        <DatePicker 
                          v-model="room.checkInTime" 
                          timeOnly 
                          hourFormat="12"
                          showIcon 
                          iconDisplay="input"
                          :disabled="isReadonly || isLoading"
                          :class="{ 'p-invalid': roomErrors[index]?.checkIn }"
                          @update:modelValue="updateCheckInTime(index, $event)"
                        >
                          <template #inputicon="{ clickCallback }">
                            <i class="pi pi-clock" @click="clickCallback" style="cursor: pointer; color: #6b7280;"></i>
                          </template>
                        </DatePicker>
                      </div>
                      <!-- 체크인 시간 오류 메시지 -->
                      <div class="error-message-container">
                        <div class="error-message" v-if="roomErrors[index]?.checkIn">
                          {{ roomErrors[index]?.checkIn }}
                        </div>
                      </div>
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <div class="form-field-container">
                      <div class="time-picker-container">
                        <label class="time-picker-label">체크아웃 시간</label>
                        <DatePicker 
                          v-model="room.checkOutTime" 
                          timeOnly 
                          hourFormat="12"
                          showIcon 
                          iconDisplay="input"
                          :disabled="isReadonly || isLoading"
                          :class="{ 'p-invalid': roomErrors[index]?.checkOut }"
                          @update:modelValue="updateCheckOutTime(index, $event)"
                        >
                          <template #inputicon="{ clickCallback }">
                            <i class="pi pi-clock" @click="clickCallback" style="cursor: pointer; color: #6b7280;"></i>
                          </template>
                        </DatePicker>
                      </div>
                      <!-- 체크아웃 시간 오류 메시지 -->
                      <div class="error-message-container">
                        <div class="error-message" v-if="roomErrors[index]?.checkOut">
                          {{ roomErrors[index]?.checkOut }}
                        </div>
                      </div>
                    </div>
                  </v-col>
                </v-row>
                
                <div class="form-field-container">
                  <label class="input-label">객실 수</label>
                  <InputText 
                    v-model.number="room.roomCount" 
                    type="number" 
                    :readonly="isReadonly"
                    :disabled="isReadonly || isLoading"
                    @input="clearError(index, 'roomCount')"
                    :class="{ 'p-invalid': roomErrors[index]?.roomCount }"
                    class="w-full"
                  />
                  <!-- 객실 수 오류 메시지 -->
                  <div class="error-message-container">
                    <div class="error-message" v-if="roomErrors[index]?.roomCount">
                      {{ roomErrors[index]?.roomCount }}
                    </div>
                  </div>
                </div>

                <v-row>
                  <v-col cols="6">
                    <div class="form-field-container">
                      <label class="input-label">객실 옵션1</label>
                      <Select
                        v-model="room.roomOption1"
                        :options="roomOption1Items"
                        optionLabel="text"
                        optionValue="value"
                        placeholder="선택해주세요"
                        :disabled="isReadonly || isLoading"
                        clearable
                        @change="clearError(index, 'roomOption1')"
                        :class="{ 'p-invalid': roomErrors[index]?.roomOption1 }"
                        class="w-full"
                      />
                      <!-- 객실 옵션1 오류 메시지 -->
                      <div class="error-message-container">
                        <div class="error-message" v-if="roomErrors[index]?.roomOption1">
                          {{ roomErrors[index]?.roomOption1 }}
                        </div>
                      </div>
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <div class="form-field-container">
                      <label class="input-label">객실 옵션2</label>
                      <Select
                        v-model="room.roomOption2"
                        :options="roomOption2Items"
                        optionLabel="text"
                        optionValue="value"
                        placeholder="선택해주세요"
                        :disabled="isReadonly || isLoading"
                        clearable
                        @change="clearError(index, 'roomOption2')"
                        :class="{ 'p-invalid': roomErrors[index]?.roomOption2 }"
                        class="w-full"
                      />
                      <!-- 객실 옵션2 오류 메시지 -->
                      <div class="error-message-container">
                        <div class="error-message" v-if="roomErrors[index]?.roomOption2">
                          {{ roomErrors[index]?.roomOption2 }}
                        </div>
                      </div>
                    </div>
                  </v-col>
                </v-row>

                <div class="form-field-container">
                  <label class="input-label">객실설명</label>
                  <Textarea 
                    v-model="room.description" 
                    rows="4"
                    :readonly="isReadonly"
                    :disabled="isReadonly || isLoading"
                    @input="emitChange"
                    class="w-full"
                  />
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="6" v-if="showBackButton">
        <Button
          :label="modeConfig.backText"
          icon="pi pi-angle-left"
          iconPos="left"
          @click="handleBack"
          :disabled="isLoading"
          class="back-button"
        />
      </v-col>
      <v-col cols="6" class="text-end" v-if="showSubmitButton">
        <Button
          :label="isLoading ? '저장 중...' : modeConfig.submitText"
          icon="pi pi-save"
          iconPos="left"
          @click="handleSubmit"
          :disabled="isLoading"
          :loading="isLoading"
          class="submit-button"
        />
      </v-col>
    </v-row>

    <!-- 로딩 오버레이 -->
    <v-overlay 
      v-model="isLoading" 
      class="align-center justify-center"
      persistent
    >
      <v-progress-circular
        indeterminate
        size="64"
        color="primary"
      />
      <div class="text-center mt-4">
        <h3 class="text-white">저장 중입니다...</h3>
        <p class="text-white mt-2">잠시만 기다려주세요.</p>
      </div>
    </v-overlay>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'

const props = defineProps({
  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'view', 'edit'].includes(value)
  },
  hotelData: {
    type: Object,
    default: () => ({})
  },
  initialRooms: {
    type: Array,
    default: () => []
  },
  hotelId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['save', 'back'])

const isLoading = ref(false)
const rooms = ref([])
const fileInputs = ref([])
const roomErrors = ref([])

const roomOption1Items = [
  { text: '🛏️ 싱글 침대', value: 'single' },
  { text: '🛏️ 더블 침대', value: 'double' },
  { text: '🛏️ 퀸 침대', value: 'queen' },
  { text: '🛏️ 킹 침대', value: 'king' },
  { text: '🛏️ 이층 침대', value: 'bunk' },
  { text: '♨️ 온돌룸', value: 'ondol' }
]

const roomOption2Items = [
 { text: '🌊 오션뷰', value: 'ocean' },
 { text: '🏙️ 시티뷰', value: 'city' },
 { text: '⛰️ 마운틴뷰', value: 'mountain' },
 { text: '🏞️ 리버뷰', value: 'river' },
 { text: '🪴 가든뷰', value: 'garden' },
 { text: '🏞️ 레이크뷰', value: 'lake' },
];

const modeConfig = computed(() => {
  const configs = {
    create: {
      title: '객실 정보 관리',
      subtitle: '숙박업소의 객실 정보를 등록해주세요.',
      backText: '이전',
      submitText: '저장'
    },
    view: {
      title: '객실 정보 조회',
      subtitle: '등록된 객실 정보를 확인하세요.',
      backText: null,
      submitText: null
    },
    edit: {
      title: '객실 정보 수정',
      subtitle: '객실 정보를 수정하세요.',
      backText: null,
      submitText: null
    }
  }
  return configs[props.mode]
})

const isReadonly = computed(() => props.mode === 'view')
const showBackButton = computed(() => modeConfig.value.backText !== null)
const showSubmitButton = computed(() => modeConfig.value.submitText !== null)

// 시간 문자열을 Date 객체로 변환하는 함수
const timeStringToDate = (timeString) => {
  if (!timeString) return null
  
  const [hours, minutes] = timeString.split(':')
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0)
  return date
}

// Date 객체를 24시간 형식 문자열로 변환하는 함수
const dateToTimeString = (date) => {
  if (!date) return ''
  
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// 체크인 시간 업데이트
const updateCheckInTime = (index, date) => {
  rooms.value[index].checkIn = dateToTimeString(date)
  clearError(index, 'checkIn')
  emitChange()
}

// 체크아웃 시간 업데이트
const updateCheckOutTime = (index, date) => {
  rooms.value[index].checkOut = dateToTimeString(date)
  clearError(index, 'checkOut')
  emitChange()
}

const processRoomImages = (images) => {
  if (!images || !Array.isArray(images)) return []
  
  return images.map(img => {
    if (typeof img === 'string') {
      return { url: img, imageUrl: img, isNew: false }
    } else if (img && typeof img === 'object') {
      return {
        url: img.imageUrl || img.url || img.src,
        imageUrl: img.imageUrl || img.url || img.src,
        id: img.id,
        isNew: false,
        ...img
      }
    }
    return null
  }).filter(Boolean)
}

watch(() => props.initialRooms, (newRooms) => {
  console.log('=== RoomForm initialRooms 변경 ===')
  console.log('새로운 initialRooms:', newRooms)
  
  if (newRooms && newRooms.length > 0) {
    rooms.value = newRooms.map((room, index) => {
      console.log(`Room ${index + 1} 원본 데이터:`, room)
      
      const processedRoom = {
        roomId: room.roomId,
        type: room.type || '',
        basePeople: room.standardPeople || room.basePeople || 2,
        maxPeople: room.maximumPeople || room.maxPeople || 4,
        weekPrice: room.weekPrice || 0,
        weekendPrice: room.weekendPrice || 0,
        checkIn: room.checkIn || '14:00',
        checkOut: room.checkOut || '11:00',
        checkInTime: timeStringToDate(room.checkIn || '14:00'),
        checkOutTime: timeStringToDate(room.checkOut || '11:00'),
        roomCount: room.roomCount || 1,
        roomOption1: room.roomOption1 || '',
        roomOption2: room.roomOption2 || '',
        description: room.description || '',
        roomKey: room.roomKey || `room${index + 1}`,
        state: room.state || null,
        
        roomImages: processRoomImages(room.roomImages || []),
        roomImageFiles: []
      }
      
      console.log(`Room ${index + 1} 처리된 데이터:`, processedRoom)
      return processedRoom
    })
  } else if (props.mode === 'create') {
    rooms.value = [createRoom()]
  }
  
  nextTick(() => {
    emitChange()
  })
}, { immediate: true, deep: true })

const emitChange = () => {
  console.log('=== emitChange 호출 ===')
  console.log('현재 rooms:', rooms.value)
  if(props.mode === 'edit') {
    emit('save', rooms.value)
  }
}

onMounted(() => {
  console.log('=== RoomForm 마운트 ===')
  console.log('mode:', props.mode)
  console.log('initialRooms:', props.initialRooms)
  
  if (props.mode === 'create' && (!rooms.value || rooms.value.length === 0)) {
    rooms.value = [createRoom()]
    emitChange()
  }
})

function createRoom() {
  const newRoom = {
    type: '',
    basePeople: 2,
    maxPeople: 4,
    weekPrice: 0,
    weekendPrice: 0,
    checkIn: '14:00',
    checkOut: '11:00',
    checkInTime: timeStringToDate('14:00'),
    checkOutTime: timeStringToDate('11:00'),
    roomCount: 10,
    roomOption1: '',
    roomOption2: '',
    description: '',
    roomImages: [],
    roomImageFiles: [],
    state: null
  }
  console.log('새 객실 생성:', newRoom)
  return newRoom
}

function addRoom() {
  if (!isReadonly.value && !isLoading.value) {
    rooms.value.push(createRoom())
    emitChange()
  }
}

function removeRoom(index) {
  if (!isReadonly.value && !isLoading.value && rooms.value.length > 1) {
    rooms.value.splice(index, 1)
    fileInputs.value.splice(index, 1)
    emitChange()
  }
}

function triggerFileInput(index) {
  if (!isReadonly.value && !isLoading.value && fileInputs.value[index]) {
    fileInputs.value[index].click()
  }
}

function onFileChange(event, index) {
  if (isReadonly.value || isLoading.value) return

  const files = event.target.files
  if (files && files.length > 0) {
    const currentImageCount = rooms.value[index].roomImages.length
    const maxImages = 4
    const availableSlots = maxImages - currentImageCount
    
    if (availableSlots <= 0) {
      alert(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`)
      event.target.value = ''
      return
    }
    
    const filesToProcess = Math.min(files.length, availableSlots)
    
    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i]
      const url = URL.createObjectURL(file)
      
      rooms.value[index].roomImageFiles.push(file)
      
      rooms.value[index].roomImages.push({ 
        url, 
        file,
        isNew: true,
        name: file.name,
        size: file.size,
        type: file.type
      })
    }
    
    if (files.length > availableSlots) {
      alert(`${availableSlots}개의 이미지만 업로드되었습니다. (최대 ${maxImages}개 제한)`)
    }
    
    event.target.value = ''
    
    console.log(`Room ${index + 1} 파일 추가 후:`, {
      roomImageFiles: rooms.value[index].roomImageFiles,
      roomImages: rooms.value[index].roomImages
    })
    
    // 이미지 업로드 시 이미지 관련 에러 메시지 초기화
    if (roomErrors.value[index] && roomErrors.value[index].roomImages) {
      delete roomErrors.value[index].roomImages
    }
    
    emitChange()
  }
}

// 이미지 이름 가져오기 함수 추가
const getImageName = (img, index) => {
  if (img.name) {
    return img.name.length > 15 ? img.name.substring(0, 15) + '...' : img.name
  }
  return `이미지 ${index + 1}`
}

function removeImage(roomIndex, imgIndex) {
  if (!isReadonly.value && !isLoading.value) {
    const room = rooms.value[roomIndex]
    const imageToRemove = room.roomImages[imgIndex]
    
    if (imageToRemove.isNew && imageToRemove.file) {
      const fileIndex = room.roomImageFiles.findIndex(f => f === imageToRemove.file)
      if (fileIndex > -1) {
        room.roomImageFiles.splice(fileIndex, 1)
        console.log(`Room ${roomIndex + 1}에서 파일 제거됨, 남은 파일 수:`, room.roomImageFiles.length)
      }
      URL.revokeObjectURL(imageToRemove.url)
    }
    
    room.roomImages.splice(imgIndex, 1)
    
    console.log(`Room ${roomIndex + 1} 이미지 삭제 후:`, {
      roomImageFiles: room.roomImageFiles,
      roomImages: room.roomImages
    })
    
    // 이미지를 모두 삭제한 경우 다시 에러 메시지 표시
    if (room.roomImages.length === 0) {
      if (!roomErrors.value[roomIndex]) {
        roomErrors.value[roomIndex] = {}
      }
      roomErrors.value[roomIndex].roomImages = true
    }
    
    emitChange()
  }
}

function clearError(index, field) {
  // roomErrors[index]가 존재하는지 확인
  if (roomErrors.value[index]) {
    // 해당 필드의 오류 메시지를 삭제
    delete roomErrors.value[index][field]
  }
  emitChange()
}

const validateRooms = () => {
  roomErrors.value = rooms.value.map(() => ({}))
  let isValid = true

  rooms.value.forEach((room, index) => {
    if (!room.type?.trim()) {
      roomErrors.value[index].type = '객실 타입을 입력해주세요.'
      isValid = false
    }
    if (!room.weekPrice || room.weekPrice < 1000) {
      roomErrors.value[index].weekPrice = '평일 가격 1000원 이상을 입력해주세요.'
      isValid = false
    }
    if (!room.weekendPrice || room.weekendPrice < 1000) {
      roomErrors.value[index].weekendPrice = '주말 가격 1000원 이상을 입력해주세요.'
      isValid = false
    }
    if (!room.roomCount || room.roomCount <= 0) {
      roomErrors.value[index].roomCount = '객실 수를 입력해주세요.'
      isValid = false
    }
    if (!room.roomOption1?.trim()) {
      roomErrors.value[index].roomOption1 = '객실 옵션1을 선택해주세요.'
      isValid = false
    }
    if (!room.roomOption2?.trim()) {
      roomErrors.value[index].roomOption2 = '객실 옵션2를 선택해주세요.'
      isValid = false
    }
    if (!room.checkIn?.trim()) {
      roomErrors.value[index].checkIn = '체크인 시간을 선택해주세요.'
      isValid = false
    }
    if (!room.checkOut?.trim()) {
      roomErrors.value[index].checkOut = '체크아웃 시간을 선택해주세요.'
      isValid = false
    }
    
    const hasNewImages = room.roomImageFiles && room.roomImageFiles.length > 0
    const hasExistingImages = room.roomImages && room.roomImages.filter(img => !img.isNew).length > 0
    
    if (!hasNewImages && !hasExistingImages) {
      roomErrors.value[index].roomImages = true
      isValid = false
    }
  })
  
  return isValid
}

const getData = () => {
  console.log('=== RoomForm getData 호출 ===')
  console.log('현재 rooms.value:', rooms.value)

  validateRooms();
  
  const result = rooms.value.map((room, index) => {
    console.log(`Processing room ${index + 1}:`)
    console.log('- roomImageFiles:', room.roomImageFiles)
    console.log('- roomImages:', room.roomImages)
    
    const processedRoom = {
      roomId: room.roomId,
      type: room.type,
      basePeople: room.basePeople,
      maxPeople: room.maxPeople,
      weekPrice: room.weekPrice,
      weekendPrice: room.weekendPrice,
      checkIn: room.checkIn,
      checkOut: room.checkOut,
      roomCount: room.roomCount,
      roomOption1: room.roomOption1,
      roomOption2: room.roomOption2,
      description: room.description,
      roomKey: room.roomKey || `room${index + 1}`,
      
      roomImageFiles: room.roomImageFiles || [],
      
      roomImages: (room.roomImages || [])
        .filter(img => !img.isNew)
        .map(img => ({
          url: img.url,
          imageUrl: img.imageUrl || img.url,
          id: img.id
        }))
    }
    
    console.log(`Room ${index + 1} 최종 데이터:`, {
      새파일: processedRoom.roomImageFiles.length,
      기존이미지: processedRoom.roomImages.length
    })
    
    return processedRoom
  })
  
  console.log('=== getData 최종 결과 ===', result)
  return result
}

defineExpose({
  getData,
  setLoading: (loading) => { isLoading.value = loading }
})

const handleBack = () => {
  if (!isLoading.value) {
    emit('back')
  }
}

const handleSubmit = async () => {
  if (isLoading.value) return
  
  console.log('=== RoomForm handleSubmit 호출 ===')
  
  const isValid = validateRooms()
  
  if (!isValid) {
    console.log('유효성 검사 실패')
    return
  }
  
  isLoading.value = true
  
  try {
    const roomsData = getData()
    console.log('RoomForm에서 저장 요청 시작')
    emit('save', {
      hotelData: props.hotelData,
      rooms: roomsData
    })
  } catch (error) {
    console.error('저장 중 오류:', error)
    isLoading.value = false
  }
}
</script>

<style scoped>
/* 폼 필드 일정한 간격을 위한 컨테이너 */
.form-field-container {
  margin-bottom: 2px;
}

/* PrimeVue InputText 라벨 스타일 */
.input-label {
  display: block;
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 400;
  margin-bottom: 4px;
  line-height: 1;
}

/* PrimeVue InputText 기본 스타일 - Vuetify와 유사하게 맞춤 */
:deep(.p-inputtext) {
  width: 100%;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.38);
  border-radius: 4px;
  font-size: 1rem;
  background-color: #ffffff;
  transition: all 0.2s ease;
  height: 56px;
  box-sizing: border-box;
}

:deep(.p-inputtext:hover) {
  border-color: rgba(0, 0, 0, 0.87);
}

:deep(.p-inputtext:focus) {
  border-color: #1976d2;
  border-width: 2px;
  outline: none;
  box-shadow: none;
}

/* 비활성화 상태 */
:deep(.p-inputtext:disabled) {
  background-color: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.38);
  cursor: not-allowed;
  opacity: 1;
}

/* 읽기 전용 상태 */
:deep(.p-inputtext[readonly]) {
  background-color: rgba(0, 0, 0, 0.04);
  cursor: default;
}

/* 에러 상태 */
:deep(.p-invalid .p-inputtext) {
  border-color: #e3342f !important;
  border-width: 2px;
}

:deep(.p-invalid .p-inputtext:focus) {
  border-color: #e3342f !important;
}

/* PrimeVue Select 기본 스타일 */
:deep(.p-select) {
  width: 100%;
  height: 56px;
}

:deep(.p-select .p-select-label) {
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.38);
  border-radius: 4px;
  font-size: 1rem;
  background-color: #ffffff;
  transition: all 0.2s ease;
  height: 56px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

:deep(.p-select:hover .p-select-label) {
  border-color: rgba(0, 0, 0, 0.87);
}

:deep(.p-select.p-focus .p-select-label) {
  border-color: #1976d2;
  border-width: 2px;
  outline: none;
  box-shadow: none;
}

/* Select 비활성화 상태 */
:deep(.p-select:disabled .p-select-label) {
  background-color: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.38);
  cursor: not-allowed;
  opacity: 1;
}

/* Select 에러 상태 */
:deep(.p-invalid .p-select .p-select-label) {
  border-color: #e3342f !important;
  border-width: 2px;
}

:deep(.p-invalid .p-select.p-focus .p-select-label) {
  border-color: #e3342f !important;
}

/* Select 드롭다운 화살표 */
:deep(.p-select .p-select-dropdown) {
  border: none;
  background: transparent;
  color: rgba(0, 0, 0, 0.54);
  right: 12px;
}

/* PrimeVue Textarea 기본 스타일 */
:deep(.p-textarea) {
  width: 100%;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.38);
  border-radius: 4px;
  font-size: 1rem;
  background-color: #ffffff;
  transition: all 0.2s ease;
  min-height: 100px;
  box-sizing: border-box;
  resize: vertical;
}

:deep(.p-textarea:hover) {
  border-color: rgba(0, 0, 0, 0.87);
}

:deep(.p-textarea:focus) {
  border-color: #1976d2;
  border-width: 2px;
  outline: none;
  box-shadow: none;
}

/* Textarea 비활성화 상태 */
:deep(.p-textarea:disabled) {
  background-color: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.38);
  cursor: not-allowed;
  opacity: 1;
  resize: none;
}

/* Textarea 읽기 전용 상태 */
:deep(.p-textarea[readonly]) {
  background-color: rgba(0, 0, 0, 0.04);
  cursor: default;
  resize: none;
}

/* 오류 메시지 컨테이너 - 입력창 바로 아래 붙이기 */
.error-message-container {
  min-height: 0;
  margin-top: 0px;
  margin-bottom: 10px;
  padding-top: 4px;
}

/* 실제 에러 메시지 텍스트 */
.error-message {
  color: #e3342f;
  font-size: 0.75rem;
  line-height: 1.2;
}

.large-button {
  padding: 0.5rem 0.75rem;
  font-size: 1.0rem;
  height: auto;
  background-color: #121212 !important;
  border: 1px solid #121212 !important;
  color: #ffffff !important;
}

.large-button:hover {
  background-color: #000000 !important;
  border-color: #000000 !important;
}

.large-button[disabled] {
  background-color: #cccccc !important;
  border-color: #cccccc !important;
  color: #666666 !important;
  cursor: not-allowed;
}

.back-button {
  border: 1px solid #000000;
  background-color: white !important;
  color: #333333 !important;
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
}

.back-button:hover {
  background-color: #e0e0e0 !important;
}

.back-button[disabled] {
  background-color: white !important;
  border-color: #000000 !important;
  color: #666666 !important;
  cursor: not-allowed;
}

.submit-button {
  padding: 0.75rem 1.25rem;
  font-size: 1.1rem;
  height: auto;
  background-color: #121212 !important;
  border: 1px solid #121212 !important;
  color: #ffffff !important;
}

.submit-button:hover {
  background-color: #000000 !important;
  border-color: #000000 !important;
}

.submit-button[disabled] {
  background-color: #cccccc !important;
  border-color: #cccccc !important;
  color: #666666 !important;
  cursor: not-allowed;
}

/* 시간 선택기 컨테이너 간격 조정 */
.time-picker-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
}

.time-picker-label {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 400;
  margin-top: 0%;
  margin-bottom: 0;
  line-height: 1;
}

/* 이미지 업로드 박스 스타일 */
.upload-box {
  border: 2px dashed #ccc;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  min-height: 200px;
  transition: all 0.3s ease;
  border-radius: 8px;
  position: relative;
}

.upload-box.readonly,
.upload-box.disabled {
  cursor: default;
  border-color: #e5e7eb;
  background-color: #f9fafb;
  opacity: 0.6;
}

.upload-box.disabled {
  pointer-events: none;
}

.upload-box.error-border {
  border-color: #e3342f !important;
}

.upload-text {
  margin: 8px 0 4px 0;
  color: #666;
  font-size: 0.9rem;
}

.upload-hint {
  color: #999;
  font-size: 0.8rem;
}

/* 이미지 미리보기 컨테이너 */
.image-preview-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 180px;
}

.image-count-badge {
  position: absolute;
  top: -8px;
  left: -8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0px;
  z-index: 10;
}

/* 세로 미리보기 리스트 */
.preview-list-vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
}

.preview-item-vertical {
  display: flex;
  align-items: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 8px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.preview-item-vertical:hover {
  background-color: #f1f3f4;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.preview-thumbnail {
  position: relative;
  width: 50px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  background-color: #e9ecef;
  flex-shrink: 0;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.remove-btn-vertical {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: rgba(244, 67, 54, 0.8);
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0;
}

.preview-item-vertical:hover .remove-btn-vertical {
  opacity: 1;
}

.remove-btn-vertical:hover {
  background-color: rgba(244, 67, 54, 1);
  transform: scale(1.1);
}

.image-info {
  margin-left: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.image-name {
  font-size: 0.8rem;
  color: #495057;
  font-weight: 500;
  line-height: 1.2;
}

.more-images-text {
  text-align: center;
  color: #6c757d;
  font-size: 0.8rem;
  margin-top: 8px;
  font-style: italic;
}

/* 스크롤바 스타일 */
.preview-list-vertical::-webkit-scrollbar {
  width: 4px;
}

.preview-list-vertical::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.preview-list-vertical::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.preview-list-vertical::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* PrimeVue DatePicker 기본 스타일 */
:deep(.p-datepicker) {
  width: 100%;
}

:deep(.p-datepicker-input) {
  width: 100%;
  padding: 16px 40px 16px 16px;
  border: 1px solid rgba(0, 0, 0, 0.38);
  border-radius: 4px;
  font-size: 1rem;
  background-color: #ffffff;
  transition: all 0.2s ease;
  position: relative;
  height: 56px;
  box-sizing: border-box;
}

:deep(.p-datepicker-input:hover) {
  border-color: rgba(0, 0, 0, 0.87);
}

:deep(.p-datepicker-input:focus) {
  border-color: #1976d2;
  border-width: 2px;
  outline: none;
}

/* 비활성화 상태 */
:deep(.p-datepicker-input:disabled) {
  background-color: rgba(0, 0, 0, 0.04);
  color: rgba(0, 0, 0, 0.38);
  cursor: not-allowed;
  opacity: 1;
}

/* 에러 상태 */
:deep(.p-invalid .p-datepicker-input) {
  border-color: #f44336 !important;
  border-width: 2px;
}

:deep(.p-invalid .p-datepicker-input:focus) {
  border-color: #f44336 !important;
}

/* 아이콘 위치 조정 */
:deep(.p-datepicker .p-inputicon) {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  color: rgba(0, 0, 0, 0.54);
  z-index: 1;
}

:deep(.p-datepicker .p-inputicon:hover) {
  color: rgba(0, 0, 0, 0.87);
}

/* 시간 선택 패널 스타일 - 배경과 그림자 추가 */
:deep(.p-datepicker-panel) {
  background-color: #ffffff !important;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2), 
              0 8px 10px 1px rgba(0, 0, 0, 0.14), 
              0 3px 14px 2px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  overflow: hidden;
}

:deep(.p-timepicker) {
  padding: 20px;
  background-color: #ffffff;
  min-width: 250px;
}

:deep(.p-hour-picker, .p-minute-picker, .p-ampm-picker) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

:deep(.p-link) {
  color: #1976d2;
  text-decoration: none;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 36px;
  min-height: 36px;
}

:deep(.p-link:hover) {
  background-color: rgba(25, 118, 210, 0.04);
}

:deep(.p-timepicker-text) {
  font-size: 1.5rem;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.87);
  min-width: 60px;
  text-align: center;
  padding: 12px;
  border: none;
  border-radius: 4px;
  background-color: transparent;
  user-select: none;
}

/* AM/PM 버튼 스타일 */
:deep(.p-ampm-picker .p-link) {
  background-color: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.12);
  min-width: 60px;
  min-height: 40px;
  text-align: center;
  font-weight: 500;
  border-radius: 4px;
  color: rgba(0, 0, 0, 0.87);
}

:deep(.p-ampm-picker .p-link:hover) {
  background-color: rgba(25, 118, 210, 0.04);
  border-color: #1976d2;
}

/* 시간/분 증감 버튼 스타일 */
:deep(.p-hour-picker .p-link, .p-minute-picker .p-link) {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background-color: transparent;
  color: #1976d2;
  font-size: 1.2rem;
  font-weight: bold;
}

:deep(.p-hour-picker .p-link:hover, .p-minute-picker .p-link:hover) {
  background-color: rgba(25, 118, 210, 0.04);
  color: #1976d2;
}

/* 시간 패널 레이아웃 */
:deep(.p-timepicker) {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  background-color: #ffffff;
}

:deep(.p-separator) {
  font-size: 1.5rem;
  font-weight: normal;
  color: rgba(0, 0, 0, 0.87);
  margin: 0 8px;
}

/* DatePicker 팝업 위치 조정 */
:deep(.p-datepicker-panel) {
  z-index: 9999;
  margin-top: 4px;
}

/* 포커스 링 제거 */
:deep(.p-datepicker-input:focus) {
  box-shadow: none;
}

/* 오버레이 배경 추가 */
:deep(.p-datepicker-mask) {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  z-index: 999;
}

.v-text-field:disabled,
.v-select:disabled,
.v-textarea:disabled {
  opacity: 0.6;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .form-field-container {
    margin-bottom: 0px;
  }
  
  .time-picker-container {
    margin-bottom: 0;
  }
  
  :deep(.p-datepicker-input) {
    padding: 14px 36px 14px 14px;
    font-size: 0.9rem;
    height: 50px;
  }
  
  :deep(.p-inputtext) {
    padding: 14px;
    font-size: 0.9rem;
    height: 50px;
  }
  
  :deep(.p-select .p-select-label) {
    padding: 14px;
    font-size: 0.9rem;
    height: 50px;
  }
  
  :deep(.p-textarea) {
    padding: 14px;
    font-size: 0.9rem;
  }
  
  .time-picker-label,
  .input-label {
    font-size: 0.7rem;
  }
  
  :deep(.p-timepicker) {
    padding: 16px;
    gap: 20px;
  }
}
</style>