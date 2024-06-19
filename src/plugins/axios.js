import Vue from 'vue';
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:3000', // Cambia esto por la URL base de tu API
  timeout: 1000,
  headers: { 'Content-Type': 'application/json' }
});

Vue.prototype.$axios = instance;

export default instance;
