import { io } from 'socket.io-client';

const socket = io(import.meta.env.VITE_ORIGIN, {
  transports: ['websocket']
});

export default socket;
