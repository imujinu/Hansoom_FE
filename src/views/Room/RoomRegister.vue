<template>
  <RoomForm 
    mode="create" 
    :hotel-data="hotelData"
    @save="handleSave" 
    @back="handleBack" 
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import RoomForm from './RoomForm.vue'
import axios from 'axios'

const router = useRouter()
const hotelData = ref(null)

// 로컬스토리지에서 호텔 정보 로드
onMounted(() => {
  const savedHotel = localStorage.getItem('hotelRegistrationData')
  if (savedHotel) {
    hotelData.value = JSON.parse(savedHotel)
  } else {
    alert('호텔 정보가 없습니다. 먼저 호텔을 등록해주세요.')
    router.push('/myhostpage/hotel')
  }
})

const handleBack = () => {
  router.push('/myhostpage/hotel')
}


// base64 → File 변환 함수 개선
function base64ToFile(base64, filename) {
  console.log('base64ToFile 호출됨:', { base64Type: typeof base64, base64Preview: base64?.substring?.(0, 50) })
  
  // base64가 문자열이 아닌 경우
  if (typeof base64 !== 'string') {
    throw new Error(`base64 데이터가 문자열이 아닙니다. 타입: ${typeof base64}`)
  }
  
  // base64 문자열이 비어있는 경우
  if (!base64 || base64.trim() === '') {
    throw new Error('base64 데이터가 비어있습니다.')
  }
  
  // data URL 형태가 아닌 경우 처리
  if (!base64.includes(',')) {
    throw new Error('올바른 base64 형태가 아닙니다. data URL 형태여야 합니다.')
  }
  
  try {
    const arr = base64.split(',')
    if (arr.length !== 2) {
      throw new Error('base64 형태가 올바르지 않습니다.')
    }
    
    const mimeMatch = arr[0].match(/:(.*?);/)
    if (!mimeMatch) {
      throw new Error('MIME 타입을 찾을 수 없습니다.')
    }
    
    const mime = mimeMatch[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    
    const file = new File([u8arr], filename, { type: mime })
    console.log('base64 변환 성공:', { filename, size: file.size, type: mime })
    return file
  } catch (error) {
    console.error('base64 변환 중 오류:', error)
    throw new Error(`base64 변환 실패: ${error.message}`)
  }
}

const handleSave = async ({ hotelData, rooms }) => {
  console.log('handleSave 호출됨:', { hotelData, rooms })
  
  if(!rooms || rooms.length === 0) {
    alert('최소 1개의 객실 정보가 필요합니다.');
    return;
  }
  
  try {
    const formData = new FormData()
    
    // 파일 크기 및 개수 제한 설정
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_TOTAL_FILES = 50;
    let totalFileSize = 0;
    let totalImageCount = 0;
    let hasValidationError = false;

    // 객실 DTO 생성
    const roomDtos = rooms.map((room, index) => {
      console.log(`Room ${index + 1} DTO 생성:`, room)
      return {
        type: room.type,
        roomCount: room.roomCount,
        roomOption1: room.roomOption1,
        roomOption2: room.roomOption2,
        description: room.description,
        weekPrice: room.weekPrice,
        weekendPrice: room.weekendPrice,
        standardPeople: room.basePeople,
        maximumPeople: room.maxPeople,
        checkIn: room.checkIn,
        checkOut: room.checkOut
      }
    })

    // 전체 DTO 합치기
    const hotelDto = {
      hotelName: hotelData.form.hotelName,
      address: hotelData.form.address,
      phoneNumber: hotelData.form.phoneNumber,
      description: hotelData.form.description,
      type: hotelData.form.type,
      rooms: roomDtos
    }

    console.log('호텔 DTO:', hotelDto)

    // JSON DTO 추가
    formData.append(
      'hotelRegisterDto',
      new Blob([JSON.stringify(hotelDto)], { type: 'application/json' })
    )

    // 호텔 이미지 처리
    console.log('호텔 이미지 처리 시작')
    if (hotelData.image) {
      try {
        let hotelImgFile
        
        if (hotelData.image instanceof File) {
          console.log('File 객체 감지 - 직접 사용')
          hotelImgFile = hotelData.image
        } else if (typeof hotelData.image === 'string') {
          console.log('문자열 감지 - base64 변환 시도')
          hotelImgFile = base64ToFile(hotelData.image, 'hotelImage.png')
        } else {
          throw new Error(`지원하지 않는 이미지 타입: ${typeof hotelData.image}`)
        }
        
        // 호텔 이미지 파일 크기 검증
        if (hotelImgFile.size > MAX_FILE_SIZE) {
          alert(`호텔 이미지 파일 크기는 10MB를 초과할 수 없습니다. (현재: ${(hotelImgFile.size / 1024 / 1024).toFixed(2)}MB)`)
          return
        }
        
        formData.append('hotelImage', hotelImgFile)
        totalFileSize += hotelImgFile.size
        console.log('호텔 이미지 추가 성공:', hotelImgFile.name, hotelImgFile.size)
        
      } catch (error) {
        console.error('호텔 이미지 처리 실패:', error)
        alert(`호텔 이미지 처리 중 오류: ${error.message}`)
        return
      }
    } else {
      console.warn('호텔 이미지가 없습니다.')
      // 빈 파일 추가하지 않음 - 백엔드에서 optional로 처리되어야 함
    }

    // 객실 이미지 파일 추가 및 검증
    rooms.forEach((room, roomIndex) => {
      console.log(`Room ${roomIndex + 1} 이미지 처리:`, {
        roomImageFiles: room.roomImageFiles?.length || 0,
        roomImages: room.roomImages?.length || 0
      })
      
      // roomImageFiles 처리
      if (room.roomImageFiles && room.roomImageFiles.length > 0) {
        room.roomImageFiles.forEach((file, imgIndex) => {
          if (hasValidationError) return; // 이미 오류가 발생한 경우 중단
          
          if (file instanceof File) {
            // 파일 크기 검증
            if (file.size > MAX_FILE_SIZE) {
              alert(`객실 이미지 파일 크기는 10MB를 초과할 수 없습니다: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
              hasValidationError = true
              return
            }
            
            // 총 파일 개수 검증
            if (totalImageCount >= MAX_TOTAL_FILES) {
              alert(`이미지는 최대 ${MAX_TOTAL_FILES}개까지 업로드 가능합니다.`)
              hasValidationError = true
              return
            }
            
            try {
              const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
              
              // 파일 확장자 검증
              const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
              if (!allowedExtensions.includes(ext)) {
                alert(`지원하지 않는 이미지 형식입니다: ${file.name}`)
                hasValidationError = true
                return
              }
              
              const newName = `room${roomIndex + 1}_${imgIndex + 1}.${ext}`
              const renamedFile = new File([file], newName, { type: file.type })
              formData.append('roomImages', renamedFile)
              totalImageCount++
              totalFileSize += file.size
              console.log(`객실 이미지 추가됨: ${newName}, 크기: ${file.size}`)
            } catch (error) {
              console.error(`Room ${roomIndex + 1}, Image ${imgIndex + 1} 처리 오류:`, error)
              hasValidationError = true
            }
          } else {
            console.warn(`Room ${roomIndex + 1}, Image ${imgIndex + 1}: 유효하지 않은 파일 객체`, file)
          }
        })
      }
      
      // roomImages의 새 이미지 처리
      if (room.roomImages && room.roomImages.length > 0 && !hasValidationError) {
        room.roomImages.forEach((imgObj, imgIndex) => {
          if (hasValidationError) return;
          
          if (imgObj.isNew && imgObj.file instanceof File) {
            const file = imgObj.file
            
            // 파일 크기 검증
            if (file.size > MAX_FILE_SIZE) {
              alert(`객실 이미지 파일 크기는 10MB를 초과할 수 없습니다: ${file.name}`)
              hasValidationError = true
              return
            }
            
            // 총 파일 개수 검증
            if (totalImageCount >= MAX_TOTAL_FILES) {
              alert(`이미지는 최대 ${MAX_TOTAL_FILES}개까지 업로드 가능합니다.`)
              hasValidationError = true
              return
            }
            
            try {
              const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
              
              // 파일 확장자 검증
              const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
              if (!allowedExtensions.includes(ext)) {
                alert(`지원하지 않는 이미지 형식입니다: ${file.name}`)
                hasValidationError = true
                return
              }
              
              const newName = `room${roomIndex + 1}_new_${imgIndex + 1}.${ext}`
              const renamedFile = new File([file], newName, { type: file.type })
              formData.append('roomImages', renamedFile)
              totalImageCount++
              totalFileSize += file.size
              console.log(`새 객실 이미지 추가됨: ${newName}, 크기: ${file.size}`)
            } catch (error) {
              console.error(`Room ${roomIndex + 1} 새 이미지 처리 오류:`, error)
              hasValidationError = true
            }
          }
        })
      }
    })
    
    // 검증 오류가 있으면 중단
    if (hasValidationError) {
      return
    }
    
    // 총 파일 크기 검증 (예: 100MB 제한)
    const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB
    if (totalFileSize > MAX_TOTAL_SIZE) {
      alert(`전체 파일 크기는 100MB를 초과할 수 없습니다. (현재: ${(totalFileSize / 1024 / 1024).toFixed(2)}MB)`)
      return
    }
    
    console.log(`총 ${totalImageCount}개의 객실 이미지가 추가되었습니다. (총 크기: ${(totalFileSize / 1024 / 1024).toFixed(2)}MB)`)

    // FormData 내용 확인
    console.log('FormData 내용:')
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: ${value.name} (${value.size} bytes, ${value.type})`)
      } else if (value instanceof Blob) {
        console.log(`${key}: Blob (${value.size} bytes, ${value.type})`)
      } else {
        console.log(`${key}: ${value}`)
      }
    }

    // 서버 전송 - Content-Type 헤더 제거!
    console.log('서버로 전송 중...')
    const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/hotel/create`, formData, {
      timeout: 60000, // 60초 타임아웃
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    })
    console.log('서버 응답:', response.data)
    alert('등록 성공!')
    localStorage.removeItem('hotelRegistrationData')
    window.location.href = '/myhostpage';
    
  } catch (err) {
    console.error('등록 실패:', err)
    
    if (err.response) {
      console.error('서버 응답:', err.response.data)
      console.error('응답 상태:', err.response.status)
      
      if (err.response.status === 413) {
        alert('파일 크기가 너무 큽니다. 이미지 크기를 줄여서 다시 시도해주세요.')
        window.location.reload();
      } else if (err.response.status === 400) {
        const errorMessage = err.response.data?.status_message || '잘못된 요청입니다.'
        localStorage.removeItem("hotelRegistrationData")
        alert(`등록 실패: ${errorMessage}`)
        window.location.href = "/hotel/register"
      } else {
        const errorMessage = err.response.data?.status_message || '서버 오류가 발생했습니다.'
        alert(`등록 실패: ${errorMessage}`)
        window.location.reload();
      }
    } else if (err.code === 'ECONNABORTED') {
      alert('요청 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.')
      window.location.reload();
    } else if (err.message) {
      alert(`등록 실패: ${err.message}`)
      window.location.reload();
    } else {
      alert('등록 실패: 알 수 없는 오류가 발생했습니다.')
      window.location.reload();
    }
  }
}
</script>