<template>
  <div class="container">
    <!-- 제목 -->
    <div class="title-section">
      <h1 class="title">{{ modeConfig.title }}</h1>
      <p class="subtitle">{{ modeConfig.subtitle }}</p>
    </div>

    <!-- 등록 카드 -->
    <div class="card">
      <div class="card-body">
        <div class="form-grid">
          <!-- 이미지 업로드 섹션 (왼쪽) -->
          <div class="upload-section">
            <div
              class="upload-box"
              :class="{ 'readonly': isReadonly, 'input-error-border': hasErrors && !displayImageUrl }"
              @click="handleImageUpload"
            >
              <template v-if="displayImageUrl">
                <img :src="displayImageUrl" alt="호텔 이미지" class="preview-image" />
                <!-- edit 모드일 때 이미지 위에 오버레이 표시 -->
                <div v-if="!isReadonly" class="image-overlay" @click.stop="handleImageUpload">
                  <div class="overlay-content">
                    <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    <p class="overlay-text">클릭하여 이미지 변경</p>
                  </div>
                </div>
              </template>
              <template v-else>
                <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <p class="upload-text">{{ isReadonly ? '이미지 없음' : '이미지 등록' }}</p>
                <p class="upload-subtext" v-if="!isReadonly">클릭하여 호텔 이미지를 업로드하세요</p>
              </template>
            </div>
            <!-- 이미지 아래에 표시될 에러 메시지 -->
            <p class="error-message" v-if="hasErrors && !displayImageUrl">호텔 이미지를 등록해주세요.</p>
          </div>

          <!-- 숨겨진 파일 입력 -->
          <input
            type="file"
            ref="fileInput"
            style="display: none"
            @change="onFileChange"
            accept="image/*"
            :disabled="isReadonly"
          />

          <!-- 입력 폼 섹션 (오른쪽) -->
          <div class="input-section">
            <label>호텔명</label>
            <input
              type="text"
              v-model="form.hotelName"
              placeholder="호텔명을 입력하세요"
              :readonly="isReadonly"
              :disabled="isReadonly"
              :class="{ 'input-error-border': hasErrors && !form.hotelName }"
              ref="hotelNameInput"
            />
            <p class="error-message" v-if="hasErrors && !form.hotelName">호텔명을 입력해주세요.</p>

            <label>주소</label>
            <input
              type="text"
              v-model="form.address"
              placeholder="호텔 주소를 입력하세요"
              :readonly="isReadonly"
              :disabled="isReadonly"
              :class="{ 'input-error-border': hasErrors && !form.address }"
              ref="addressInput"
            />
            <p class="error-message" v-if="hasErrors && !form.address">주소를 입력해주세요.</p>

            <label>전화번호</label>
            <input
              type="text"
              v-model="form.phoneNumber"
              placeholder="전화번호를 입력하세요"
              :readonly="isReadonly"
              :disabled="isReadonly"
              :class="{ 'input-error-border': hasErrors && !form.phoneNumber }"
              ref="phoneNumberInput"
            />
            <p class="error-message" v-if="hasErrors && !form.phoneNumber">전화번호를 입력해주세요.</p>

            <label>숙소 타입</label>
            <select
              v-model="form.type"
              :disabled="isReadonly"
            >
              <option value="HOTEL">호텔</option>
              <option value="MOTEL">모텔</option>
              <option value="PENSION">펜션</option>
            </select>
          </div>
        </div>

        <!-- 설명 -->
        <div class="description">
          <label>호텔 설명</label>
          <textarea
            v-model="form.description"
            placeholder="호텔에 대한 상세한 설명을 입력하세요..."
            :readonly="isReadonly"
            :disabled="isReadonly"
          ></textarea>
        </div>

        <!-- 버튼 -->
        <div class="button-group">
          <button
            v-if="showCancelButton"
            @click="handleCancel"
            class="btn-cancel"
          >
            {{ modeConfig.cancelText }}
          </button>
          <button
            v-if="showSubmitButton"
            @click="handleSubmit"
            class="btn-next"
          >
            {{ modeConfig.submitText }}
          </button>
        </div>
      </div>
    </div>

    <!-- 스낵바 -->
    <div v-if="showSnackbar" class="snackbar" :class="{ 'show': showSnackbar }">
      <div class="snackbar-content">
        <span class="snackbar-message" v-html="snackbarMessage.replace(/\n/g, '<br>')"></span>
        <button @click="hideSnackbar" class="snackbar-close">×</button>
      </div>
    </div>

    <!-- 하단 안내 -->
    <div class="footer-info" v-if="mode === 'create'">
      <strong>숙박의 필요한 모든 사람들에게,</strong>
      <p>한솜 접근을 제공하는 서비스와 함께라면 일상이 새로워질 거예요.</p>
      <p class="caption">정성으로 하나 하나씩 전하는 특송</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'view', 'edit'].includes(value)
  },
  initialData: {
    type: Object,
    default: () => ({})
  },
  hotelId: {
    type: [String, Number],
    default: null
  },
  hotelImages: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['next', 'save', 'cancel'])

const form = ref({
  hotelName: '',
  address: '',
  phoneNumber: '',
  description: '',
  type: 'HOTEL',
})

const fileInput = ref(null)
const hotelNameInput = ref(null)
const addressInput = ref(null)
const phoneNumberInput = ref(null)
const previewUrl = ref(null)
const selectedFile = ref(null)
const hasErrors = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref('')

const displayImageUrl = computed(() => {
  // 1. 업로드된 미리보기 이미지가 있으면 사용
  if (previewUrl.value) {
    return previewUrl.value
  }
  // 2. hotelImages props에서 이미지가 있으면 첫 번째 이미지 사용
  if (props.hotelImages && props.hotelImages.length > 0) {
    return props.hotelImages[0]
  }
  // 3. initialData에 이미지가 있으면 사용
  if (props.initialData && props.initialData.image) {
    return props.initialData.image
  }
  return null
})

// 모드별 설정
const modeConfig = computed(() => {
  const configs = {
    create: {
      title: '호텔 등록',
      subtitle: '당신의 호텔을 등록해 보세요',
      cancelText: '취소',
      submitText: '다음'
    },
    view: {
      title: '호텔 정보 조회',
      subtitle: '등록된 호텔 정보를 확인하세요.',
      cancelText: null,
      submitText: null
    },
    edit: {
      title: '호텔 정보 수정',
      subtitle: '호텔 정보를 수정하세요.',
      cancelText: null,
      submitText: null
    }
  }
  return configs[props.mode]
})

const isReadonly = computed(() => props.mode === 'view')
const showCancelButton = computed(() => modeConfig.value.cancelText !== null)
const showSubmitButton = computed(() => modeConfig.value.submitText !== null)

// 초기 데이터 로드
watch(() => props.initialData, (newData) => {
  if (newData && Object.keys(newData).length > 0) {
    if (newData.form) {
      // 로컬스토리지 형태 (create 모드)
      form.value = { ...newData.form }
      if (newData.imagePreview) {
        previewUrl.value = newData.imagePreview
      }
    } else {
      // API 응답 형태 (view/edit 모드)
      form.value = {
        hotelName: newData.hotelName || '',
        address: newData.address || '',
        phoneNumber: newData.phoneNumber || '',
        description: newData.description || '',
        type: newData.type || '',
      }
      if (newData.hotelImage) {
        previewUrl.value = newData.hotelImage
      }
    }
  }
}, { immediate: true, deep: true })

// 생성 모드에서 로컬스토리지 로드
onMounted(() => {
  if (props.mode === 'create') {
    const savedData = localStorage.getItem('hotelRegistrationData')
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        form.value = parsed.form || form.value
        if (parsed.imagePreview) {
          previewUrl.value = parsed.imagePreview
        }
      } catch (e) {
        console.error('저장된 호텔 정보 파싱 실패:', e)
      }
    }
  }
})

const handleImageUpload = async (event) => {
  if (isReadonly.value) {
    return
  }
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  await nextTick()
  if (fileInput.value) {
    fileInput.value.click()
  } else {
    console.error('fileInput이 존재하지 않음')
  }
}

const onFileChange = (event) => {
  if (isReadonly.value) {
    return
  }
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    const reader = new FileReader()
    reader.onload = () => {
      previewUrl.value = reader.result
    }
    reader.onerror = (error) => {
      console.error('파일 읽기 실패:', error)
    }
    reader.readAsDataURL(file)
  } else {
    selectedFile.value = null
  }
  event.target.value = ''
}

const handleCancel = () => {
  emit('cancel')
}

// 주소 검증 함수
const validateAddress = (address) => {
  if (!address || !address.trim()) {
    return false;
  }
  
  const trimmedAddress = address.trim();
  
  // 공백으로 나눈 후 빈 문자열 제거
  const parts = trimmedAddress.split(' ').filter(part => part.length > 0);
  
  // 최소 3개 이상의 구성요소가 있어야 함 (시/도, 시/군/구, 상세주소 등)
  if (parts.length < 3) {
    return false;
  }
  
  // 각 구성요소가 1글자 이상이어야 함
  return parts.every(part => part.length >= 1);
}

// 스낵바 메시지 표시
const showSnackbarMessage = (message) => {
  snackbarMessage.value = message;
  showSnackbar.value = true;
  
  // 4초 후 자동으로 숨김 (메시지가 길어서 시간 연장)
  setTimeout(() => {
    hideSnackbar();
  }, 4000);
};

// 스낵바 숨김
const hideSnackbar = () => {
  showSnackbar.value = false;
};

const handleSubmit = () => {
  hasErrors.value = false
  if (!form.value.hotelName || !form.value.address || !form.value.phoneNumber || !displayImageUrl.value) {
    hasErrors.value = true
    return
  }

  // 주소 형식 검증 추가
  if (!validateAddress(form.value.address)) {
    showSnackbarMessage("적합한 주소가 아닙니다\n예시) 서울시 동작구 보라매로 87");
    return;
  }

  const eventName = props.mode === 'create' ? 'next' : 'save'

  if (selectedFile.value) {
    emit(eventName, {
      form: form.value,
      image: previewUrl.value,
      imagePreview: previewUrl.value,
      imageFile: selectedFile.value
    })
  } else {
    emit(eventName, {
      form: form.value,
      image: displayImageUrl.value,
      imagePreview: previewUrl.value
    })
  }
}

const getData = () => {
  if (!form.value.hotelName?.trim()) {
    throw new Error('호텔명을 입력해주세요.')
  }
  if (!form.value.address?.trim()) {
    throw new Error('주소를 입력해주세요.')
  }
  if (!form.value.type) {
    throw new Error('호텔 타입을 선택해주세요.')
  }
  if (!displayImageUrl.value) {
     throw new Error('호텔 이미지를 등록해주세요.');
  }

  return {
    ...form.value,
    image: displayImageUrl.value,
    imagePreview: previewUrl.value,
    imageFile: selectedFile.value
  }
}

defineExpose({
  getData
})
</script>

<style scoped>
.container {
  padding: 2rem;
  max-width: 960px;
  margin: auto;
}
.title-section {
  text-align: center;
  margin-bottom: 2rem;
}
.title {
  font-size: 2rem;
  font-weight: bold;
}
.subtitle {
  color: #666;
}
.card {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 0 10px rgba(0,0,0,0.05);
}
.form-grid {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

/* 새로운 이미지 업로드 섹션 컨테이너 */
.upload-section {
  flex: 1;
  min-width: 240px;
  display: flex;
  flex-direction: column;
}

/* 업로드 박스 스타일 */
.upload-box {
  width: 100%;
  height: 220px;
  border: 2px dashed #ccc;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  transition: border-color 0.3s ease;
}

.upload-box:hover:not(.readonly) {
  border-color: #2563eb;
  background-color: #f8faff;
}

.upload-box.readonly {
  cursor: default;
  border-color: #e5e7eb;
  background-color: #f9fafb;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-icon {
  width: 40px;
  height: 40px;
  color: #888;
  margin-bottom: 0.5rem;
}

.upload-text {
  font-weight: bold;
  margin: 0.5rem 0;
  color: #333;
}

.upload-subtext {
  font-size: 0.875rem;
  color: #777;
  margin: 0;
}

/* 이미지 오버레이 스타일 */
.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.upload-box:hover .image-overlay {
  opacity: 1;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  pointer-events: none; /* 클릭 이벤트가 부모로 전달되도록 */
}

.overlay-content .upload-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 8px;
  color: white;
}

.overlay-text {
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
}

.input-section {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.input-section input,
.input-section select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}
.input-section input:disabled,
.input-section select:disabled,
.input-section input[readonly],
.input-section select[readonly] {
  background-color: #f9fafb;
  cursor: not-allowed;
}
.description textarea {
  width: 100%;
  height: 100px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  margin-top: 1rem;
  resize: vertical;
}
.description textarea:disabled,
.description textarea[readonly] {
  background-color: #f9fafb;
  cursor: not-allowed;
}
.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}
.btn-cancel {
  padding: 0.5rem 1.5rem;
  border: 1px solid #ccc;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-cancel:hover {
  background-color: #f5f5f5;
}
.btn-next {
  padding: 0.5rem 1.5rem;
  background: #000000;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.btn-next:hover {
  background-color: #393939;
}
.footer-info {
  background: #eef4ff;
  padding: 1.5rem;
  text-align: center;
  border-radius: 6px;
  margin-top: 2rem;
}
.footer-info .caption {
  font-size: 0.875rem;
  color: #666;
}

/* 유효성 검사 에러 스타일 */
.input-error-border {
  border-color: #e3342f !important;
  box-shadow: 0 0 0 1px #e3342f;
}
.error-message {
  color: #e3342f;
  font-size: 0.8rem;
  line-height: 1.2;
}

.debug-info {
  font-family: monospace;
  line-height: 1.4;
}
.debug-info p {
  margin: 0.2rem 0;
}

/* 스낵바 스타일 */
.snackbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(100px);
  background: #6b7280;
  color: white;
  padding: 0;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  opacity: 0;
  transition: all 0.3s ease;
  max-width: 400px;
}

.snackbar.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.snackbar-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16px 20px;
  gap: 12px;
}

.snackbar-message {
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.snackbar-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s;
  flex-shrink: 0;
}

.snackbar-close:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>