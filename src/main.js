import 'element-ui/lib/theme-chalk/index.css';
import '@/style/mxgraph.css';
import '@/style/style.scss';
import './plugins/axios'; // Importa el archivo de configuración de Axios

import Vue from 'vue';
import App from '@/App.vue';
import router from '@/router';
import store from '@/store';

// Importa Element UI y sus estilos
import ElementUI from 'element-ui';
import locale from 'element-ui/lib/locale/lang/en';

Vue.use(ElementUI, { locale });

import * as R from 'ramda';

Vue.prototype.R = R;

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');
