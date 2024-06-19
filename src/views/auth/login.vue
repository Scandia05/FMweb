<template>
  <div>
    <h2>Login</h2>
    <el-form ref="form" :model="form" @submit.native.prevent="submit">
      <el-form-item label="Email">
        <el-input v-model="form.email"></el-input>
      </el-form-item>
      <el-form-item label="Password">
        <el-input type="password" v-model="form.password"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submit">Login</el-button>
        <el-button @click="goToRegister">Register</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        email: '',
        password: ''
      }
    };
  },
  methods: {
    async submit() {
      try {
        await this.$store.dispatch('loginUser', this.form);
        this.$router.push('/welcome');
      } catch (error) {
        console.error('Login failed:', error);
      }
    },
    goToRegister() {
      this.$router.push('/register');
    }
  }
};
</script>
