// src/plugins/axios.js

import Vue from 'vue';
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:3000'; // Configura la URL base para axios

Vue.prototype.$http = axios;

