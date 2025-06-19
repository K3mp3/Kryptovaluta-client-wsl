<script setup lang="ts">
import { createPublicClient, formatEther, http } from 'viem'
import { localhost } from 'viem/chains'
import { computed, ref } from 'vue'

const address = ref()
const balance = ref<bigint>()

const formattedBalance = computed(() => {
  if (!balance.value) return '0'
  return parseFloat(formatEther(balance.value)).toFixed(2)
})

const client = createPublicClient({
  chain: localhost,
  transport: http('http://localhost:7545'),
})

const handleViewAmount = async () => {
  try {
    balance.value = await client.getBalance({
      address: address.value,
    })
  } catch (error) {
    console.error('Error fetching balance:', error)
  }
}
</script>

<template>
  <input type="text" v-model="address" placeholder="Address" />
  <button type="button" @click="handleViewAmount">View amount</button>
  <p>Current amount is: {{ balance! > 0 ? formattedBalance : 0 }} ETH</p>
</template>
