<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const password = ref('')

const handleSignUp = async () => {
  const user = {
    email: email.value,
    password: password.value,
  }

  console.log(user)

  const response = await fetch('http://localhost:3000/api/user/sign-up', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(user),
  })

  console.log(response)
}
</script>

<template>
  <form class="sign-up-form" @submit.prevent="handleSignUp">
    <label>Registrera</label>
    <input type="email" placeholder="E-mailadress" v-model="email" />
    <input type="password" placeholder="Lösenord" v-model="password" />

    <button type="submit">Registrera</button>
  </form>
</template>

<style lang="css" scoped>
.sign-up-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
