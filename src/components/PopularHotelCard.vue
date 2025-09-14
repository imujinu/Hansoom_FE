<template>
  <article class="ph-card" @click="$emit('click')">
    <div class="ph-photo">
      <img :src="img" :alt="title" loading="lazy" />
      <!-- ✅ 왼쪽-아래 사선 오버레이 (흰색) -->
      <svg class="ph-wave" viewBox="0 0 260 220" aria-hidden="true">
        <!-- 왼쪽 아래 모서리만 둥근 사각형으로 자르는 모양 -->
        <rect
          x="-30"
          y="160"
          width="80"
          height="80"
          fill="#fff"
          rx="20"
          ry="20"
        />
        <!-- 반달 모양의 원 (중앙에 추가) -->
        <circle
          cx="36"
          cy="211"
          r="50"
          fill="#fff"
        />
      </svg>
      <!-- ✅ 큰 순위 숫자 -->
      <div class="ph-rank" :data-rank="rank">{{ rank }}</div>
    </div>

    <div class="ph-info">
      <h3 class="ph-title">{{ title }}</h3>
      <div class="ph-meta">
        <span class="ph-price">{{ price }}</span>
        <span class="ph-dot" aria-hidden="true">·</span>
        <span class="ph-rate">★ {{ rating }} ({{ reviews }})</span>
      </div>
    </div>
  </article>
</template>

<script setup>
defineProps({
  rank: { type: [Number, String], required: true },
  img: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: String, required: true },   // 예: "₩140,000~"
  rating: { type: [Number, String], default: "4.7" },
  reviews: { type: [Number, String], default: "0" }
});
</script>

<style scoped>
/* 카드 틀 */
.ph-card{
  width: 280px;
  background:#fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,.08);
  cursor:pointer;
  transition: transform .25s ease, box-shadow .25s ease;
  flex: 0 0 280px;
}
.ph-card:hover{
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0,0,0,.12);
}

/* 이미지 영역 */
.ph-photo{
  position:relative;
  height: 360px;
  background:#f3f3f3;
  overflow:hidden;
}
.ph-photo img{
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
  transform: scale(1.02);
}

/* ✅ 왼쪽-아래 사선 패치(SVG 오버레이) */
.ph-wave{
  position:absolute;
  left:0; bottom:0;
  width: 140%;          /* 더 큰 영역을 덮도록 */
  height: auto;
  pointer-events: none;
  filter: drop-shadow(0 6px 14px rgba(0,0,0,.10));
}

/* ✅ 큰 순위 숫자 */
.ph-rank{
  position:absolute;
  left: 16px;   /* 12 → 16 */
  bottom: 12px; /*  8 → 12  */
  font-weight: 900;
  font-size: 96px;           /* 필요 시 조절 */
  line-height: .9;
  color:#111;
  letter-spacing: -2px;
  z-index: 2;
  /* 살짝 들어간 느낌 */
  text-shadow:
    0 1px 0 #fff,
    0 14px 24px rgba(0,0,0,.18);
}

/* 본문 정보 */
.ph-info{
  padding: 14px 16px 18px;
}
.ph-title{
  font-size: 1.06rem;
  font-weight: 700;
  color:#222;
  margin: 0 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ph-meta{
  font-size:.95rem;
  color:#555;
  display:flex;
  align-items:center;
  gap:6px;
}
.ph-price{
  font-weight:800;
  color:#111;
}
.ph-dot{ opacity:.5; }

/* 반응형 살짝 톤다운 */
@media (max-width: 480px){
  .ph-card{ 
    width: 240px; 
    flex: 0 0 240px;
  }
  .ph-photo{ height: 300px; }
  .ph-rank{ font-size: 80px; left: 14px; bottom: 12px; }
  .ph-wave{ width: 65%; }
}
</style>
