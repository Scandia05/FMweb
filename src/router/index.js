import Vue from 'vue';
import Router from 'vue-router';
import WelcomeView from '@/views/welcome/index.vue';
import FMwebView from '@/views/fmWeb/index.vue';
import VariAtionView from '@/views/variation/index.vue';
import LayoutComponent from '@/components/layout/index.vue';
import RegisterView from '@/views/auth/register.vue';
import LoginView from '@/views/auth/login.vue';
import store from '@/store'; // Asegúrate de importar el store correctamente

Vue.use(Router)

export const viewsRouter = [
  {
    path: 'welcome',
    name: 'welcome',
    meta: {
      title: 'Welcome',
      icon: require('@/assets/icon/home.png'),
      requiresAuth: true
    },
    component: WelcomeView
  },
  {
    path: 'fmWeb',
    name: 'fmWeb',
    meta: {
      title: 'FMWeb',
      icon: require('@/assets/icon/fmweb.png'),
      requiresAuth: true
    },
    component: FMwebView
  },
  {
    path: 'variation',
    name: 'variation',
    meta: {
      title: 'Vari::Ation',
      icon: require('@/assets/icon/variation.png'),
      requiresAuth: true
    },
    component: VariAtionView
  }
]

export const globalRouter = [
  {
    path: '/',
    name: 'home',
    redirect: '/login',
    component: LayoutComponent,
    children: [
      ...viewsRouter
    ]
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  }
]

const router = new Router({
  routes: [...globalRouter]
});

// Navigation guard to check for auth
router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // this route requires auth, check if logged in
    // if not, redirect to login page.
    if (!store.getters.isAuthenticated) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      });
    } else {
      next();
    }
  } else {
    next(); // make sure to always call next()!
  }
});

export default router;
