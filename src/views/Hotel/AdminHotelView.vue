<template>
  <div class="hotel-detail-container">
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>데이터를 불러오는 중...</p>
    </div>
    <div v-else-if="error" class="error">
      <i class="error-icon">⚠️</i>
      {{ error }}
    </div>
    <div v-else class="content-wrapper">
      <!-- 호텔 정보 조회 -->
      <div class="section-card">
        <div class="section-header">
          <h2>호텔 정보</h2>
        </div>
        <div class="hotel-info-content">
          <!-- 호텔 기본 정보 -->
          <div class="hotel-basic-info">
            <HotelForm 
              mode="view" 
              :hotel-id="hotelId" 
              :initial-data="hotelData" 
              :hotel-images="hotelImages"
              @cancel="handleBack"
            />
          </div>
        </div>
      </div>
      
      <!-- 객실 정보 조회 -->
      <div class="section-card">
        <div class="section-header">
          <h2>객실 정보</h2>
        </div>
        <div class="room-info-content">
          <RoomForm 
            mode="view" 
            :hotel-data="hotelData"
            :initial-rooms="roomData"
            :hotel-id="hotelId"
            @back="handleBack"
          />
          
          <!-- 객실별 이미지들 표시 -->
          <div v-if="roomImages.length > 0" class="room-images-section">
            <h3>객실 이미지</h3>
            <div v-for="room in roomData" :key="room.id" class="room-image-group">
              <h4 v-if="room.name">{{ room.name }}</h4>
              <div v-if="getRoomImages(room).length > 0" class="image-gallery">
                <div 
                  v-for="(image, index) in getRoomImages(room)" 
                  :key="`room-${room.id}-${index}`" 
                  class="image-item"
                  @click="openImageModal(image)"
                >
                  <img 
                    :src="image" 
                    :alt="`${room.name} 이미지 ${index + 1}`"
                    class="room-image"
                    @error="handleImageError"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 뒤로가기 버튼 -->
      <div class="action-buttons" v-if="role==='ADMIN'">
        <button @click="handleBack" class="back-button">
          ← 목록으로 돌아가기
        </button>
      </div>
    </div>
    
    <!-- 이미지 모달 -->
    <div v-if="selectedImage" class="image-modal" @click="closeImageModal">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="closeImageModal">×</button>
        <img :src="selectedImage" alt="확대된 이미지" class="modal-image" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import HotelForm from './HotelForm.vue'
import RoomForm from '../Room/RoomForm.vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const hotelId = route.params.id
const role = localStorage.getItem("role");

const hotelData = ref({})
const roomData = ref([])
const loading = ref(true)
const error = ref('')
const selectedImage = ref(null)

// 호텔 이미지 URL들을 computed로 추출
const hotelImages = computed(() => {
  if (!hotelData.value) return []
  
  const images = []
  // 호텔 데이터에서 이미지 URL들을 추출 (데이터 구조에 따라 조정 필요)
  if (hotelData.value.image) images.push(hotelData.value.image)
  if (hotelData.value.image && Array.isArray(hotelData.value.image)) {
    images.push(...hotelData.value.image)
  }
  if (hotelData.value.image && Array.isArray(hotelData.value.image)) {
    images.push(...hotelData.value.image)
  }
  
  return images.filter(img => img && typeof img === 'string')
})

// 객실 이미지 URL들을 computed로 추출
const roomImages = computed(() => {
  if (!roomData.value || !Array.isArray(roomData.value)) return []
  
  const allImages = []
  roomData.value.forEach(room => {
    const images = getRoomImages(room)
    allImages.push(...images)
  })
  
  return allImages
})

// 특정 객실의 이미지들을 가져오는 함수
const getRoomImages = (room) => {
  if (!room) return []
  
  const images = []
  if (room.roomImages) images.push(room.roomImages)
  if (room.roomImages && Array.isArray(room.roomImages)) {
    images.push(...room.roomImages)
  }
  
  return images.filter(img => img && typeof img === 'string')
}

onMounted(async () => {
  try {
    // API 호출로 호텔 상세 정보 조회
    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/hotel/admin/${hotelId}`)
    hotelData.value = response.data.result
    roomData.value = response.data.result.roomDetailResponseDtoList || []
    loading.value = false
    console.log('호텔 데이터:', response.data.result)
    console.log('호텔 이미지 필드들:')
    console.log('- image:', response.data.result.image)
    console.log('- images:', response.data.result.images)
    console.log('- imageUrl:', response.data.result.imageUrl)
    console.log('- imageUrls:', response.data.result.imageUrls)
  } catch (err) {
    console.error('호텔 정보 조회 실패:', err)
    error.value = '호텔 정보를 불러올 수 없습니다.'
    loading.value = false
  }
})

const handleBack = () => {
  router.push('/admin/dashboard')
}

const openImageModal = (imageUrl) => {
  selectedImage.value = imageUrl
}

const closeImageModal = () => {
  selectedImage.value = null
}

const handleImageError = (event) => {
  console.warn('이미지 로드 실패:', event.target.src)
  event.target.style.display = 'none'
}
</script>

<style scoped>
.hotel-detail-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin: 2rem auto;
  max-width: 400px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e3f2fd;
  border-top: 4px solid #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  padding: 2rem;
  text-align: center;
  background: #fff5f5;
  border: 1px solid #feb2b2;
  border-radius: 12px;
  color: #c53030;
  font-size: 1.1rem;
  margin: 2rem auto;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.error-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
  display: block;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.section-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  margin-bottom: 2rem;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.section-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
}

.section-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.hotel-info-content, 
.room-info-content {
  padding: 2rem;
}

.hotel-basic-info {
  margin-top: 2rem;
}


.hotel-images-section,
.room-images-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.room-images-section h3 {
  color: #4a5568;
  font-size: 1.25rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.room-image-group {
  margin-bottom: 2rem;
}

.room-image-group h4 {
  color: #2d3748;
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  background: #f7fafc;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.image-item {
  position: relative;
  aspect-ratio: 16/12;
  overflow: hidden;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-item:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.hotel-image,
.room-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-item:hover .hotel-image,
.image-item:hover .room-image {
  transform: scale(1.1);
}

.action-buttons {
  text-align: center;
  margin: 2rem 0;
}

.back-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

/* 이미지 모달 스타일 */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  z-index: 1001;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.modal-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.modal-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .hotel-detail-container {
    padding: 10px;
  }
  
  .section-header {
    padding: 1rem 1.5rem;
  }
  
  .section-header h2 {
    font-size: 1.25rem;
  }
  
  .hotel-info-content, 
  .room-info-content {
    padding: 1.5rem;
  }
  
  
  .image-gallery {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.75rem;
  }
  
  .modal-content {
    max-width: 95%;
    max-height: 95%;
  }
}
</style>