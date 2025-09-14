<template>
  <div class="page-container">
    <div v-if="loading" class="loading">
      데이터를 불러오는 중...
    </div>
    <div v-else-if="error" class="error">
      {{ error }}
    </div>
    <div v-else>
      <!-- 호텔 정보 수정 -->
      <div class="form-section">
        <h3 class="section-title">🏨 호텔 정보 수정</h3>
        <HotelForm 
          ref="hotelFormComponent"
          mode="edit" 
          :hotel-id="hotelId" 
          :initial-data="hotelData"
          @save="handleHotelSave"
          @cancel="handleCancel"
        />
      </div>

      <!-- 객실 정보 수정 -->
      <div class="form-section">
        <h3 class="section-title">🛏️ 객실 정보 수정</h3>
        <RoomForm 
          ref="roomFormComponent"
          mode="edit" 
          :hotel-data="hotelData"
          :initial-rooms="roomData"
          :hotel-id="hotelId"
          @save="handleRoomSave"
          @back="handleCancel"
        />
      </div>
    </div>

    <!-- Vue 방식의 스낵바 -->
    <div 
      :class="['snackbar', { 'show': snackbar.visible }]"
      v-if="snackbar.message"
    >
      {{ snackbar.message }}
    </div>

    <!-- 하단 버튼 -->
    <div class="button-container">
      <button @click="handleCancel" class="btn btn-secondary">
        이전
      </button>
      <button @click="handleSaveAll" :disabled="saving" class="btn btn-primary">
        {{ saving ? '저장 중...' : '저장' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import HotelForm from './HotelForm.vue'
import RoomForm from '../Room/RoomForm.vue'
import axios from 'axios'

const router = useRouter()

// 상태 관리
const hotelData = ref({})
const roomData = ref([])
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const hotelId = ref(null)

// 스낵바 상태 관리
const snackbar = ref({
  visible: false,
  message: '',
  timeout: null
})

// Template Refs
const hotelFormComponent = ref(null)
const roomFormComponent = ref(null)

// 자식 컴포넌트에서 받은 데이터 저장
const hotelFormData = ref({})
const roomFormData = ref([])

// 초기 데이터 로드
onMounted(async () => {
  try {
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/hotel/myhotel`)
    const result = response.data.result
    
    hotelData.value = result
    roomData.value = result.roomDetailResponseDtoList || []
    hotelId.value = result.id || result.hotelId
    
    // 초기값 설정
    hotelFormData.value = { ...result }
    roomFormData.value = [...roomData.value]
    
    loading.value = false
    console.log('초기 데이터 로드 완료:', { hotelData: hotelData.value, roomData: roomData.value })
    
  } catch (err) {
    console.error('호텔 정보 조회 실패:', err)
    error.value = '호텔 정보를 불러올 수 없습니다.'
    router.push("/myhostpage/hotel")
    loading.value = false
  }
})

// Vue 방식의 스낵바 표시 함수
const showSnackbar = (message, duration = 3000) => {
  // 기존 타이머가 있다면 제거
  if (snackbar.value.timeout) {
    clearTimeout(snackbar.value.timeout)
  }
  
  // 스낵바 설정 및 표시
  snackbar.value.message = message
  snackbar.value.visible = true
  
  // 지정된 시간 후 숨기기
  snackbar.value.timeout = setTimeout(() => {
    snackbar.value.visible = false
    // 애니메이션 완료 후 메시지 제거
    setTimeout(() => {
      if (!snackbar.value.visible) {
        snackbar.value.message = ''
      }
    }, 200) // CSS 애니메이션 시간과 맞춤
  }, duration)
}

// 이벤트 핸들러들
const handleCancel = () => {
  router.push('/')
}

const handleHotelSave = (data) => {
  hotelFormData.value = data
  console.log('호텔 데이터 업데이트:', data)
}

const handleRoomSave = (data) => {
  roomFormData.value = data
  console.log('객실 데이터 업데이트:', data)
}

// 메인 저장 함수
const handleSaveAll = async () => {
  if (saving.value) return
  
  try {
    saving.value = true
    console.log('=== 저장 프로세스 시작 ===')

    // 1. 최신 데이터 수집
    const finalHotelData = await getFinalHotelData()
    const finalRoomData = await getFinalRoomData()
    
    console.log('최종 호텔 데이터:', finalHotelData)
    console.log('최종 객실 데이터:', finalRoomData)

    // 2. 데이터 검증
    validateData(finalHotelData, finalRoomData)

    // 3. 서버 전송 데이터 구성
    const formData = createFormData(finalHotelData, finalRoomData)

    // 4. 서버 전송
    await axios.put(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/hotel/myhotel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    showSnackbar('호텔 및 객실 정보가 성공적으로 수정되었습니다!', 4000);
    
    // 페이지 새로고침 전 잠시 대기
    setTimeout(() => {
      window.location.reload();
    }, 500);
    
  } catch (error) {
    console.error('저장 실패:', error)
    const errorMessage = error.response?.data?.message || error.message || '호텔 및 객실 정보 수정에 실패했습니다.'
    showSnackbar(`저장 실패: ${errorMessage}`, 5000);
  } finally {
    saving.value = false
  }
}

// 최종 호텔 데이터 수집
const getFinalHotelData = async () => {
  let data = null
  
  // 1. 자식 컴포넌트에서 getData 시도
  if (hotelFormComponent.value?.getData) {
    try {
      data = await hotelFormComponent.value.getData()
      console.log('HotelForm getData 성공')
    } catch (error) {
      console.warn('HotelForm getData 실패:', error)
    }
  }
  
  // 2. fallback: emit 데이터 또는 원본 데이터
  if (!data) {
    data = {
      ...hotelData.value,
      ...hotelFormData.value
    }
    console.log('HotelForm fallback 데이터 사용')
  }
  
  return data
}

// 최종 객실 데이터 수집
const getFinalRoomData = async () => {
  let data = null
  
  // 1. 자식 컴포넌트에서 getData 시도
  if (roomFormComponent.value?.getData) {
    try {
      data = await roomFormComponent.value.getData()
      console.log('RoomForm getData 성공')
    } catch (error) {
      console.warn('RoomForm getData 실패:', error)
    }
  }
  
  // 2. fallback: emit 데이터 또는 원본 데이터
  if (!data || !Array.isArray(data)) {
    data = roomFormData.value.length > 0 ? roomFormData.value : roomData.value
    console.log('RoomForm fallback 데이터 사용')
  }
  
  // 3. 각 객실 데이터 보정
  return data.map((room, index) => {
    const originalRoom = roomData.value[index] || {}
    
    return {
      // 원본 데이터 기본값
      ...originalRoom,
      // 수정된 데이터 덮어쓰기
      ...room,
      // 필수 필드 보장
      roomId: room.roomId || originalRoom.roomId,
      type: room.type || originalRoom.type || 'STANDARD',
      roomCount: room.roomCount || originalRoom.roomCount || 1,
      basePeople: room.basePeople || room.standardPeople || originalRoom.standardPeople || originalRoom.basePeople || 2,
      maxPeople: room.maxPeople || room.maximumPeople || originalRoom.maximumPeople || originalRoom.maxPeople || 4,
      weekPrice: room.weekPrice || originalRoom.weekPrice || 0,
      weekendPrice: room.weekendPrice || originalRoom.weekendPrice || 0,
      checkIn: room.checkIn || originalRoom.checkIn || '15:00',
      checkOut: room.checkOut || originalRoom.checkOut || '11:00',
      roomKey: room.roomKey || `room${index + 1}`,
      // 이미지 처리
      roomImages: room.roomImages || originalRoom.roomImages || [],
      roomImageFiles: room.roomImageFiles || []
    }
  })
}

// 데이터 검증
const validateData = (hotelData, roomData) => {
  // 호텔 데이터 검증
  if (!hotelData) {
    throw new Error('호텔 정보가 없습니다.')
  }
  
  if (!hotelData.hotelName?.trim()) {
    throw new Error('호텔명을 입력해주세요.')
  }
  
  if (!hotelData.address?.trim()) {
    throw new Error('주소를 입력해주세요.')
  }
  
  // 객실 데이터 검증
  if (!roomData || !Array.isArray(roomData) || roomData.length === 0) {
    throw new Error('객실 정보가 없습니다.')
  }
  
  // 각 객실별 검증
  for (let i = 0; i < roomData.length; i++) {
    const room = roomData[i]
    const roomNum = i + 1
    
    if (!room.type) {
      throw new Error(`객실 ${roomNum}: 객실 유형을 선택해주세요.`)
    }
    
    if (!room.weekPrice || room.weekPrice < 1000) {
      throw new Error(`객실 ${roomNum}: 평일 가격 1000원 이상 입력해주세요.`)
    }
    
    if (!room.weekendPrice || room.weekendPrice < 1000) {
      throw new Error(`객실 ${roomNum}: 주말 가격 1000원 이상 입력해주세요.`)
    }
    
    // 이미지 검증 - 새 이미지 파일 또는 기존 이미지 URL이 있어야 함
    const hasNewImages = room.roomImageFiles && room.roomImageFiles.length > 0
    const hasExistingImages = room.roomImages && room.roomImages.length > 0
    
    if (!hasNewImages && !hasExistingImages) {
      throw new Error(`객실 ${roomNum}: 이미지를 등록해주세요.`)
    }
  }
  
  console.log('데이터 검증 완료')
}

// FormData 생성
const createFormData = (hotelData, roomData) => {
  const formData = new FormData()
  const imageUrls = []
  
  // 1. 호텔 DTO 구성
  const hotelDto = {
    hotelName: hotelData.hotelName,
    address: hotelData.address,
    phoneNumber: hotelData.phoneNumber || '',
    description: hotelData.description || '',
    type: hotelData.type,
    rooms: roomData.map((room, index) => ({
      roomId: room.roomId,
      type: room.type,
      roomCount: parseInt(room.roomCount) || 1,
      roomOption1: room.roomOption1 || '',
      roomOption2: room.roomOption2 || '',
      description: room.description || '',
      weekPrice: parseInt(room.weekPrice) || 0,
      weekendPrice: parseInt(room.weekendPrice) || 0,
      standardPeople: parseInt(room.basePeople) || 2,
      maximumPeople: parseInt(room.maxPeople) || 4,
      checkIn: room.checkIn || '15:00',
      checkOut: room.checkOut || '11:00',
      roomKey: room.roomKey || `room${index + 1}`
    }))
  }
  
  console.log('서버 전송용 DTO:', hotelDto)
  formData.append('hotelUpdateDto', new Blob([JSON.stringify(hotelDto)], { type: 'application/json' }))
  
  // 2. 호텔 이미지 처리
  if (hotelData.imageFile instanceof File) {
    // 새로운 파일이 선택된 경우
    formData.append('hotelImage', hotelData.imageFile)
    console.log('호텔 이미지: 새 파일 업로드', hotelData.imageFile.name)
  } else if (typeof hotelData.image === 'string' && hotelData.image && !hotelData.imageFile) {
    // 기존 URL이 있고 새 파일이 없는 경우
    imageUrls.push({
      imageUrl: hotelData.image,
      key: 'hotel'
    })
    console.log('호텔 이미지: 기존 URL 유지', hotelData.image)
  } else {
    console.log('호텔 이미지: 이미지 없음')
  }
  
  // 3. 객실 이미지 처리
  roomData.forEach((room, roomIndex) => {
    const roomKey = room.roomKey || `room${roomIndex + 1}`
    
    // 새 이미지 파일들
    if (room.roomImageFiles && room.roomImageFiles.length > 0) {
      room.roomImageFiles.forEach((file, fileIndex) => {
        if (file instanceof File) {
          const ext = file.name.split('.').pop()
          const fileName = `${roomKey}_${Date.now()}_${fileIndex}.${ext}`
          const renamedFile = new File([file], fileName, { type: file.type })
          formData.append('roomImages', renamedFile)
          console.log(`${roomKey}: 새 이미지 파일 추가 - ${fileName}`)
        }
      })
    }
    
    // 기존 이미지 URLs
    if (room.roomImages && room.roomImages.length > 0) {
      room.roomImages.forEach((imageData) => {
        let imageUrl = null
        
        if (typeof imageData === 'string') {
          imageUrl = imageData
        } else if (imageData && typeof imageData === 'object') {
          imageUrl = imageData.imageUrl || imageData.url || imageData.src
        }
        
        if (imageUrl) {
          imageUrls.push({
            imageUrl: imageUrl,
            key: roomKey
          })
          console.log(`${roomKey}: 기존 이미지 URL 유지 - ${imageUrl}`)
        }
      })
    }
  })
  
  // 4. imageUrls 추가
  if (imageUrls.length > 0) {
    formData.append('imageUrls', new Blob([JSON.stringify(imageUrls)], { type: 'application/json' }))
    console.log('전송할 imageUrls:', imageUrls)
  }
  
  return formData
}
</script>

<style scoped>
/* 전체 페이지 배경 */
.page-container {
  background-color: #a0a1a167; /* 연한 회색 배경 */
  min-height: 100vh;
  padding: 2rem;
}

/* 섹션 카드 스타일 */
.form-section {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

/* 섹션 제목 */
.section-title {
  font-size: 1.3rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
  color: #343a40;
  border-left: 4px solid #007bff;
  padding-left: 0.5rem;
}

/* 로딩 / 에러 */
.loading, .error {
  padding: 2rem;
  text-align: center;
  font-size: 1.2rem;
}
.error {
  color: #dc3545;
}

/* 버튼 컨테이너 */
.button-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e0e0e0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  position: sticky;
  bottom: 0;
  margin-top: 2rem;
}

/* 버튼 공통 */
.btn {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-primary {
  background: linear-gradient(135deg, #4c4c4c 0%, #363636 100%);
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0056b3 0%, #003d82 100%);
  transform: translateY(-2px);
}
.btn-secondary {
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
  color: white;
}
.btn-secondary:hover {
  background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
  transform: translateY(-2px);
}

/* Vue 방식의 스낵바 스타일 */
.snackbar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  min-width: 300px;
  max-width: 500px;
  background-color: #5c5e5c;
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
}

.snackbar.show {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
  pointer-events: auto;
}

/* 에러 메시지용 스타일 추가 */
.snackbar.error {
  background-color: #dc3545;
}

.snackbar.success {
  background-color: #28a745;
}

.snackbar.warning {
  background-color: #ffc107;
  color: #212529;
}

.snackbar.info {
  background-color: #17a2b8;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .snackbar {
    min-width: 280px;
    max-width: 90vw;
    left: 5vw;
    right: 5vw;
    transform: none;
    bottom: 20px;
  }
  
  .snackbar.show {
    transform: none;
  }
}
</style>