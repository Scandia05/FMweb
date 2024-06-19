// src/socket.js

import io from 'socket.io-client';
import store from '@/store/module/appStore';

// Obtén el token del almacenamiento local o del estado de Vuex
const token = localStorage.getItem('token') || store.state.user.token;

const socket = io('http://localhost:3000', {
  query: {
    token: token
  }
});

export default socket;

