<template>
  <div
    ref="mapContainer"
    style="width: 100%; height: 100%;"
  />
</template>

<script>
export default {
  name: "KakaoMapComponent",
  props: {
    lat: {
      type: Number,
      default: 37.5665, // 기본 위도 (서울시청)
    },
    lng: {
      type: Number,
      default: 126.9780, // 기본 경도 (서울시청)
    },
    level: {
      type: Number,
      default: 3,
    },
    hotels: {
      type: Array,
      default: () => []
    },
    disableZoom: {
      type: Boolean,
      default: false,
    },
    disableHotelClick: {
      type: Boolean,
      default: false, // HotelDetail에서 true로 설정
    },
    disablePanning: {
      type: Boolean,
      default: false, // HotelDetail에서 true로 설정하면 지도 이동 비활성화
    }
  },
  data() {
    return {
      map: null,
      hotelMarkers: [] // 호텔 마커들만 유지
    };
  },
  watch: {
    // lat, lng props 변경 감지
    lat() {
      this.updateMapCenter();
    },
    lng() {
      this.updateMapCenter();
    },
    // hotels 배열 변경 감지
    hotels: {
      handler() {
        this.updateHotelMarkers();
      },
      deep: true
    }
  },
  mounted() {
    if (typeof window.kakao === "undefined") {
      const script = document.createElement("script");
      script.src =
        "//dapi.kakao.com/v2/maps/sdk.js?autoload=false&appkey=da0bee5c987dcc7440d32a0fb73b4fac";
      script.onload = () => {
        window.kakao.maps.load(() => {
          this.initMap();
        });
      };
      document.head.appendChild(script);
    } else {
      window.kakao.maps.load(() => {
        this.initMap();
      });
    }
  },

  beforeUnmount() {
    // 컴포넌트 해제 시 마커들 정리
    this.clearHotelMarkers();
  },
  methods: {
    initMap() {
      const container = this.$refs.mapContainer;
      const options = {
        center: new window.kakao.maps.LatLng(this.lat, this.lng),
        level: this.level,
      };
      this.map = new window.kakao.maps.Map(container, options);
      
      // 마우스 휠 줌 비활성화
      if (this.disableZoom) {
        this.map.setZoomable(false);
      }
      
      // 지도 드래그(패닝) 비활성화
      if (this.disablePanning) {
        this.map.setDraggable(false);
      }
      
      // 호텔 마커만 생성 (중심 마커 제거)
      this.createHotelMarkers();
    },

    // 지도 중심 위치 업데이트 (마커 없이 시점만 이동)
    updateMapCenter() {
      if (this.map) {
        const moveLatLng = new window.kakao.maps.LatLng(this.lat, this.lng);
        
        // 부드러운 지도 이동
        this.map.panTo(moveLatLng);
      }
    },

    // 확대/축소 메서드 추가
    zoomIn() {
      if (this.map) {
        const level = this.map.getLevel();
        this.map.setLevel(level - 1);
      }
    },

    zoomOut() {
      if (this.map) {
        const level = this.map.getLevel();
        this.map.setLevel(level + 1);
      }
    },

    // 호텔 상세 페이지로 이동
    navigateToHotelDetail(hotelId) {
      this.$router.push(`/hotel/detail/${hotelId}`);
    },

    // 강제로 지도 중심 이동 (props 변경과 무관하게)
    focusTo(lat, lng, level) {
      if (!this.map || lat == null || lng == null) return;
      
      if (typeof level === 'number') {
        this.map.setLevel(level);
      }
      
      const target = new window.kakao.maps.LatLng(lat, lng);
      this.map.panTo(target);
    },

    // 위치 아이콘 마커 이미지 생성
    createLocationMarkerImage(size = 40) {
      // SVG 위치 아이콘 생성
      const svgString = `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" 
                fill="#111827" stroke="#374151" stroke-width="1"/>
          <circle cx="12" cy="9" r="2.5" fill="#FFFFFF"/>
        </svg>
      `;
      
      // SVG를 Data URL로 변환
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(svgBlob);
      
      // 마커 이미지 생성
      const imageSize = new window.kakao.maps.Size(size, size);
      const imageOption = { offset: new window.kakao.maps.Point(size/2, size) }; // 중앙 하단 기준점
      
      const markerImage = new window.kakao.maps.MarkerImage(url, imageSize, imageOption);
      
      // 메모리 누수 방지를 위해 URL 해제
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
      return markerImage;
    },

    createHotelMarkers() {
      if (!this.map || !this.hotels || this.hotels.length === 0) return;

      this.hotels.forEach((hotel) => {
        // 호텔 좌표가 있는지 확인
        if (!hotel.lat || !hotel.lng) return;

        // 위치 아이콘 마커 생성 (SVG 기반)
        const markerImage = this.createLocationMarkerImage();
        
        const markerPosition = new window.kakao.maps.LatLng(hotel.lat, hotel.lng);
        
        const marker = new window.kakao.maps.Marker({
          position: markerPosition,
          image: markerImage
        });
        
        marker.setMap(this.map);

        // disableHotelClick이 false일 때만 클릭 이벤트와 CustomOverlay 기능 활성화
        if (!this.disableHotelClick) {
          // CustomOverlay 콘텐츠 생성
          const infoWindowId = `hotel-info-${hotel.id}`;
          const infoContent = `
            <div id="${infoWindowId}"
                 style="
                   width:200px;font-size:12px;border-radius:8px;overflow:hidden;
                   box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;background:#fff;
                   transform: translateY(-40px);   /* 🔹 마커 높이만큼 위로 띄우기 */
                   will-change: transform;          /* 부드러운 렌더링 */
                 ">
              <div style="width:100%;height:120px;overflow:hidden;">
                <img src="${hotel.image}" style="width:100%;height:100%;object-fit:cover;display:block;" />
              </div>
              <div style="padding:8px;box-sizing:border-box;">
                <div style="font-weight:bold;font-size:13px;color:#111827;margin-bottom:4px;">
                  ${hotel.name || '호텔'}
                </div>
                <div style="color:#6b7280;margin-bottom:4px;">
                  ${hotel.location || '주소 정보 없음'}
                </div>
                <div style="color:#FF6600;font-weight:bold;">
                  ${hotel.price ? `₩${hotel.price.toLocaleString()}` : ''}<span style="font-size:11px;color:#9ca3af;">/박</span>
                </div>
                <div style="font-size:10px;color:#888;margin-top:4px;text-align:center;">
                  클릭하여 자세히 보기
                </div>
              </div>
            </div>
          `;
          
          // ✅ InfoWindow 대신 CustomOverlay
          const overlay = new window.kakao.maps.CustomOverlay({
            position: markerPosition,
            content: infoContent,
            xAnchor: 0.5,        // 가로 중앙 정렬 (0.5 = 50%)
            yAnchor: 1,          // 마커 위에 배치 (1 = 위쪽)
            zIndex: 3,
            clickable: true,     // ✅ 지도 클릭으로 전파되지 않게
          });
          
          // 마커의 hover 상태 추적을 위한 변수
          let isMarkerArea = false;
          
          // 마커 hover 이벤트
          window.kakao.maps.event.addListener(marker, 'mouseover', () => {
            isMarkerArea = true;
          });
          
          window.kakao.maps.event.addListener(marker, 'mouseout', () => {
            setTimeout(() => {
              isMarkerArea = false;
            }, 100);
          });
          
          // 마커 클릭 이벤트
          window.kakao.maps.event.addListener(marker, 'click', () => {
            // 부모 컴포넌트에 호텔 클릭 이벤트 전달
            this.$emit('hotel-marker-click', hotel);
            
            // 열려있는 오버레이 닫기
            this.hotelMarkers.forEach(m => m.overlay && m.overlay.setMap(null));
            
            // 현재 오버레이 열기
            overlay.setMap(this.map);
            
            // DOM 붙은 뒤 이벤트 바인딩
            setTimeout(() => {
              const infoElement = document.getElementById(infoWindowId);
              console.log('DOM 요소 찾기:', infoElement); // 디버깅용
              
              if (infoElement) {
                // 기존 이벤트 리스너 제거 (중복 방지)
                infoElement.removeEventListener('click', infoElement._clickHandler);
                
                // 클릭 핸들러 함수 정의
                const clickHandler = (e) => {
                  console.log('카드 클릭됨!', hotel.id); // 디버깅용
                  window.kakao.maps.event.preventMap();  // ✅ 지도 이벤트로의 전파 차단
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // 라우터가 있는지 확인
                  if (this.$router) {
                    this.navigateToHotelDetail(hotel.id);
                  } else {
                    console.error('라우터가 없습니다');
                    // 대안: window.location 사용
                    window.location.href = `/hotel/detail/${hotel.id}`;
                  }
                };
                
                // 이벤트 리스너 추가
                infoElement.addEventListener('click', clickHandler);
                infoElement._clickHandler = clickHandler; // 참조 저장

                // hover 효과 추가 (기존 translateY 유지)
                infoElement.onmouseenter = () => {
                  infoElement.style.transform = 'translateY(-40px) scale(1.02)';
                  infoElement.style.transition = 'transform 0.2s ease';
                };
                
                infoElement.onmouseleave = () => {
                  infoElement.style.transform = 'translateY(-40px) scale(1)';
                };
                
                console.log('이벤트 리스너 등록 완료'); // 디버깅용
              } else {
                console.log('DOM 요소를 찾을 수 없음:', infoWindowId); // 디버깅용
              }
            }, 100); // CustomOverlay DOM 생성 대기 시간 증가
          });

          // 마커 정보 저장 (hover 상태도 함께 저장)
          this.hotelMarkers.push({
            marker: marker,
            overlay: overlay,          // ✅ infowindow 대신 overlay 저장
            hotelData: hotel,
            isMarkerArea: () => isMarkerArea  // 함수로 저장하여 실시간 상태 확인
          });
        } else {
          // disableHotelClick이 true인 경우, overlay 없이 마커만 저장
          this.hotelMarkers.push({
            marker: marker,
            overlay: null,
            hotelData: hotel,
            isMarkerArea: () => false
          });
        }
      });

      // 지도 클릭 시 모든 호텔 오버레이 닫기 (마커 영역이 아닌 경우에만)
      window.kakao.maps.event.addListener(this.map, 'click', () => {
        // 어떤 마커 영역에도 마우스가 없을 때만 오버레이들 닫기
        const isAnyMarkerHovered = this.hotelMarkers.some(markerInfo => 
          markerInfo.isMarkerArea && markerInfo.isMarkerArea()
        );
        
        if (!isAnyMarkerHovered) {
          this.hotelMarkers.forEach(markerInfo => {
            if (markerInfo.overlay && markerInfo.overlay.getMap()) {
              markerInfo.overlay.setMap(null);
            }
          });
        }
      });
    },

    // 호텔 마커들 업데이트
    updateHotelMarkers() {
      // 기존 호텔 마커들 제거
      this.clearHotelMarkers();
      
      // 새로운 호텔 마커들 생성
      if (this.map) {
        this.createHotelMarkers();
      }
    },

    // 호텔 마커들 제거
    clearHotelMarkers() {
      this.hotelMarkers.forEach(markerInfo => {
        if (markerInfo.overlay) {
          markerInfo.overlay.setMap(null);
        }
        markerInfo.marker.setMap(null);
      });
      this.hotelMarkers = [];
    },

    // 모든 호텔이 보이도록 지도 범위 조정
    fitBoundsToHotels() {
      if (!this.map || !this.hotels || this.hotels.length === 0) return;

      const bounds = new window.kakao.maps.LatLngBounds();
      
      // 검색 위치도 포함
      bounds.extend(new window.kakao.maps.LatLng(this.lat, this.lng));
      
      // 모든 호텔 위치 포함
      this.hotels.forEach(hotel => {
        if (hotel.lat && hotel.lng) {
          bounds.extend(new window.kakao.maps.LatLng(hotel.lat, hotel.lng));
        }
      });

      this.map.setBounds(bounds);
    },

    // 특정 호텔의 마커 크기 변경
    highlightHotelMarker(hotelId, isHighlight = true) {
      const markerInfo = this.hotelMarkers.find(m => m.hotelData.id === hotelId);
      if (!markerInfo) return;

      // 기존 마커 제거
      markerInfo.marker.setMap(null);

      // 새로운 크기의 마커 이미지 생성
      const newSize = isHighlight ? 50 : 40;
      const newMarkerImage = this.createLocationMarkerImage(newSize);

      // 새로운 마커 생성
      const newMarker = new window.kakao.maps.Marker({
        position: markerInfo.marker.getPosition(),
        image: newMarkerImage
      });

      newMarker.setMap(this.map);

      // 기존 이벤트 리스너들을 새 마커에 복사
      if (!this.disableHotelClick) {
        // CustomOverlay 콘텐츠 생성
        const infoWindowId = `hotel-info-${markerInfo.hotelData.id}`;
        const infoContent = `
          <div id="${infoWindowId}"
               style="
                 width:200px;font-size:12px;border-radius:8px;overflow:hidden;
                 box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;background:#fff;
                 transform: translateY(-40px);
                 will-change: transform;
               ">
            <div style="width:100%;height:120px;overflow:hidden;">
              <img src="${markerInfo.hotelData.image}" style="width:100%;height:100%;object-fit:cover;display:block;" />
            </div>
            <div style="padding:8px;box-sizing:border-box;">
              <div style="font-weight:bold;font-size:13px;color:#111827;margin-bottom:4px;">
                ${markerInfo.hotelData.name || '호텔'}
              </div>
              <div style="color:#6b7280;margin-bottom:4px;">
                ${markerInfo.hotelData.location || '주소 정보 없음'}
              </div>
              <div style="color:#FF6600;font-weight:bold;">
                ${markerInfo.hotelData.price ? `₩${markerInfo.hotelData.price.toLocaleString()}` : ''}<span style="font-size:11px;color:#9ca3af;">/박</span>
              </div>
              <div style="font-size:10px;color:#888;margin-top:4px;text-align:center;">
                클릭하여 자세히 보기
              </div>
            </div>
          </div>
        `;
        
        const overlay = new window.kakao.maps.CustomOverlay({
          position: markerInfo.marker.getPosition(),
          content: infoContent,
          xAnchor: 0.5,
          yAnchor: 1,
          zIndex: 3,
          clickable: true,
        });

        // 마커의 hover 상태 추적을 위한 변수
        let isMarkerArea = false;
        
        // 마커 hover 이벤트
        window.kakao.maps.event.addListener(newMarker, 'mouseover', () => {
          isMarkerArea = true;
        });
        
        window.kakao.maps.event.addListener(newMarker, 'mouseout', () => {
          setTimeout(() => {
            isMarkerArea = false;
          }, 100);
        });
        
        // 마커 클릭 이벤트
        window.kakao.maps.event.addListener(newMarker, 'click', () => {
          this.$emit('hotel-marker-click', markerInfo.hotelData);
          
          // 열려있는 오버레이 닫기
          this.hotelMarkers.forEach(m => m.overlay && m.overlay.setMap(null));
          
          // 현재 오버레이 열기
          overlay.setMap(this.map);
          
          // DOM 붙은 뒤 이벤트 바인딩
          setTimeout(() => {
            const infoElement = document.getElementById(infoWindowId);
            
            if (infoElement) {
              // 기존 이벤트 리스너 제거 (중복 방지)
              infoElement.removeEventListener('click', infoElement._clickHandler);
              
              // 클릭 핸들러 함수 정의
              const clickHandler = (e) => {
                window.kakao.maps.event.preventMap();
                e.preventDefault();
                e.stopPropagation();
                
                if (this.$router) {
                  this.navigateToHotelDetail(markerInfo.hotelData.id);
                } else {
                  window.location.href = `/hotel/detail/${markerInfo.hotelData.id}`;
                }
              };
              
              // 이벤트 리스너 추가
              infoElement.addEventListener('click', clickHandler);
              infoElement._clickHandler = clickHandler;

              // hover 효과 추가
              infoElement.onmouseenter = () => {
                infoElement.style.transform = 'translateY(-40px) scale(1.02)';
                infoElement.style.transition = 'transform 0.2s ease';
              };
              
              infoElement.onmouseleave = () => {
                infoElement.style.transform = 'translateY(-40px) scale(1)';
              };
            }
          }, 100);
        });

        // 마커 정보 업데이트
        markerInfo.marker = newMarker;
        markerInfo.overlay = overlay;
        markerInfo.isMarkerArea = () => isMarkerArea;
      } else {
        // disableHotelClick이 true인 경우
        markerInfo.marker = newMarker;
        markerInfo.overlay = null;
        markerInfo.isMarkerArea = () => false;
      }
    }
  }
};
</script>