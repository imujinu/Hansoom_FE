<template>
  <div
    class="single-hotel-card"
    :class="{ selected: isSelected }"
    @click="onCardClick"
  >
    <div class="hotel-image-wrapper">
      <img :src="img" :alt="title" class="hotel-image" />
      <div class="hotel-rank">{{ rank }}</div>
    </div>
    <div class="hotel-info">
      <h3 class="hotel-title">{{ title }}</h3>
      <div class="hotel-rating">
        <div class="stars">
          <i
            v-for="n in 5"
            :key="n"
            class="fas fa-star"
            :class="{ filled: n <= Math.round(rating) }"
          ></i>
        </div>
        <span class="rating-text">{{ rating }}</span>
        <span class="reviews-count">({{ reviews }}개 리뷰)</span>
      </div>
      <div class="hotel-price">{{ price }}</div>
      <div class="hotel-actions">
        <button class="action-btn primary" @click.stop="goToHotelDetail">
          상세보기
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { useRouter } from "vue-router";

export default {
  name: "SingleHotelCard",
  props: {
    id: {
      type: [String, Number],
      required: true,
    },
    rank: {
      type: Number,
      required: true,
    },
    img: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    isSelected: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["click"],
  setup(props, { emit }) {
    const router = useRouter();

    const onCardClick = () => {
      emit("click", {
        id: props.id,
        rank: props.rank,
        img: props.img,
        title: props.title,
        price: props.price,
        rating: props.rating,
        reviews: props.reviews,
      });
    };

    const goToHotelDetail = () => {
      router.push(`/hotel/detail/${props.id}`);
    };

    const goToBooking = () => {
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      router.push({
        path: `/hotel/detail/${props.id}`,
        query: {
          checkIn: today.toISOString().split("T")[0],
          checkOut: tomorrow.toISOString().split("T")[0],
          people: 2,
        },
      });
    };

    return {
      onCardClick,
      goToHotelDetail,
      goToBooking,
    };
  },
};
</script>

<style scoped>
.single-hotel-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  cursor: pointer;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.single-hotel-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.single-hotel-card.selected {
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.hotel-image-wrapper {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
}

.hotel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;


  border-radius: 0px;

}

.single-hotel-card:hover .hotel-image {
  transform: scale(1.05);
}

.hotel-rank {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hotel-info {
  padding: 24px;
}

.hotel-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 16px 0;
  line-height: 1.3;
}

.hotel-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.stars {
  display: flex;
  gap: 2px;
}

.stars i {
  color: #d1d5db;
  font-size: 16px;
}

.stars i.filled {
  color: #facc15;
}

.rating-text {
  font-weight: 600;
  color: #111827;
  font-size: 16px;
}

.reviews-count {
  color: #6b7280;
  font-size: 14px;
}

.hotel-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 24px;
}

.hotel-actions {
  display: flex;
}

.action-btn {
  width: 100%;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.action-btn.primary {
  background: #111827;
  color: white;
}

.action-btn.primary:hover {
  background: #374151;
  transform: translateY(-1px);
}

.action-btn.secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.action-btn.secondary:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

/* 반응형 */
@media (max-width: 768px) {
  .hotel-image-wrapper {
    height: 250px;
  }

  .hotel-info {
    padding: 20px;
  }

  .hotel-title {
    font-size: 1.25rem;
  }

  .action-btn {
    padding: 14px 20px;
  }
}
</style>
