import { findIndex, equals, isNil } from 'ramda';
import Vue from 'vue';

const appStore = {
  state: {
    sidebarCollapse: true,
    tagsContainer: {},
    user: null  // Nuevo estado para el usuario
  },
  getters: {
    sidebarCollapse: (state) => {
      return state.sidebarCollapse;
    },
    tagsContainer: (state) => {
      return state.tagsContainer;
    },
    user: (state) => {
      return state.user;
    },
    isAuthenticated: (state) => {
      return !isNil(state.user);
    }
  },
  mutations: {
    setSidebarCollapse: (state, collapse) => {
      state.sidebarCollapse = collapse;
    },
    DELETE_TAG: (state, tag) => {
      const { name } = tag;
      Vue.delete(state.tagsContainer, name);
    },
    ADD_TAG: (state, tag) => {
      const { name } = tag;
      if (isNil(state.tagsContainer[name])) {
        Vue.set(state.tagsContainer, name, tag);
      }
    },
    SET_USER: (state, user) => {
      state.user = user;
    },
    CLEAR_USER: (state) => {
      state.user = null;
    }
  },
  actions: {
    addOneTagToContainer: ({ commit, state }, tag) => {
      const { name } = tag;
      commit('ADD_TAG', tag);
      return findIndex(equals(name), Object.keys(state.tagsContainer));
    },
    deleteOneTagFromContainer: ({ commit }, tag) => {
      commit('DELETE_TAG', tag);
    },
    setUser: ({ commit }, user) => {
      commit('SET_USER', user);
    },
    clearUser: ({ commit }) => {
      commit('CLEAR_USER');
    },
    loginUser: async ({ commit }, { email, password }) => {
      try {
        const response = await Vue.prototype.$http.post('http://localhost:3000/login', { email, password });
        const { token, username } = response.data;
        Vue.prototype.$http.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        commit('SET_USER', { username, token });
        return username;
      } catch (error) {
        console.error('Error logging in:', error);
        throw error;
      }
    },
    registerUser: async ({ dispatch }, { username, email, password }) => {
      try {
        await Vue.prototype.$http.post('http://localhost:3000/register', { username, email, password });
        await dispatch('loginUser', { email, password });
      } catch (error) {
        console.error('Error registering:', error);
        throw error;
      }
    }
  }
};

export default appStore;
