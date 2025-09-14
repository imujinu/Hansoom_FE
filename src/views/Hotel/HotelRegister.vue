<template>
  <HotelForm mode="create" @next="handleNext" @cancel="handleCancel" />
</template>

<script setup>
import HotelForm from './HotelForm.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const handleNext = (formData) => {
  // 로컬스토리지에 저장
  localStorage.setItem('hotelRegistrationData', JSON.stringify(formData))
  router.push('/myhostpage/room')
}

const handleCancel = () => {
  if (confirm('정말 취소하시겠습니까? 입력한 정보가 모두 삭제됩니다.')) {
    localStorage.removeItem('hotelRegistrationData')
    router.push('/')
  }
}
</script>