import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";
const socket = io(new URL(apiUrl).origin, { autoConnect: false, withCredentials: true });

export default socket;
