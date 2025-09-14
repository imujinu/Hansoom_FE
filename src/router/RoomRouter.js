import HostMyHotel from "@/views/Hotel/HostMyHotel.vue";
import HotelDetail from "@/views/Hotel/HotelDetail.vue";
import HotelRegister from "@/views/Hotel/HotelRegister.vue";
import MapUse from "@/views/Hotel/MapUse.vue";
import SearchHotel from "@/views/Hotel/SearchHotel.vue";
import RoomRegister from "@/views/Room/RoomRegister.vue";
import SearchRoom from "@/views/Room/SearchRoom.vue";


export const roomRouter = [
    {
        path: "/room/search",
        name: "SearchRoom",
        component: SearchRoom
    },
      {
        path: "/hotel/register",
        name: "HotelRegister",
        component: HotelRegister,
      },
      {
        path: "/room/register",
        name: "RoomRegister",
        component: RoomRegister,
      },
      {
        path: "/hotel/search",
        name: "SearchHotel",
        component: SearchHotel,
      },
      {
        path: "/hotel/detail/:id",
        name: "HotelDetail",
        component: HotelDetail,
      },
      {
        path: "/hotel/myhotel",
        name: "HostMyHotel",
        component: HostMyHotel,
      },
      {
        path: "/hotel/map",
        name: "KakaoMap",
        component: MapUse,
      },
]