import AdminDashboard from "@/views/Admin/AdminDashboard.vue";
import AdminHotelView from "@/views/Hotel/AdminHotelView.vue";

export const adminRouter = [
    {
        path: "/admin/dashboard",
        name: "AdminDashboard",
        component: AdminDashboard,
    },
    {
        path: "/admin/hotel/:id",
        name: "AdminHotelView",
        component: AdminHotelView,
      },
];  
