import ReservationDetail from "@/views/Reservation/ReservationDetail.vue";
import ReservationForm from "@/views/Reservation/ReservationForm.vue";
import ReservationList from "@/views/Reservation/ReservationList.vue";

export const reservationRouter = [
  {
    path: "/reservation",
    name: "ReservationForm",
    component: ReservationForm,
  },
  {
    path: "/reservations",
    name: "ReservationList",
    component: ReservationList,
  },
  {
    path: "/reservations/:id",
    name: "ReservationDetail",
    component: ReservationDetail,
    props: true,
  },
];
