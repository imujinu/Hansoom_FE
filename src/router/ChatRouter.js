import ChatGroup from "@/views/Chat/ChatGroup.vue";
import ChatHost from "@/views/Chat/ChatHost.vue";
import ChatMain from "@/views/Chat/ChatMain.vue";

export const chatRouter = [
  {
    path: "/chat",
    name: "ChatMain",
    component: ChatMain,
  },
  {
    path: "/groupChat/:roomId",
    name: "GroupChat",
    component: ChatGroup,
    props: true,
  },
  {
    path: "/chat/host",
    name: "ChatHost",
    component: ChatHost,
  },
];
