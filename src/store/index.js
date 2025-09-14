import { defineStore } from "pinia";

export const userStompStore = defineStore("stomp", {
    state : ()=> ({stompClient:null}),
    actions:{
        setClient(stompClient) { this.stompClient = stompClient}
    }
})