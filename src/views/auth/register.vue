<template>
  <div>
    <h2>Register</h2>
    <form @submit.prevent="submit">
      <div>
        <label for="username">Username:</label>
        <input type="text" v-model="username" required>
      </div>
      <div>
        <label for="email">Email:</label>
        <input type="email" v-model="email" required>
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" v-model="password" required>
      </div>
      <div>
        <label for="confirmPassword">Confirm Password:</label>
        <input type="password" v-model="confirmPassword" required>
      </div>
      <button type="submit">Register</button>
      <router-link to="/login">Already have an account? Login</router-link>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
  },
  methods: {
    async submit() {
      if (this.password !== this.confirmPassword) {
        alert("Passwords do not match!");
        return;
      }
      try {
        await this.$store.dispatch('registerUser', {
          username: this.username,
          email: this.email,
          password: this.password
        });
        this.$router.push('/welcome');
      } catch (error) {
        console.error('Registration failed:', error);
      }
    }
  }
};
</script>
