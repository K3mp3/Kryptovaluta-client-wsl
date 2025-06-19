<script setup lang="ts">
import { createPublicClient, http } from 'viem'
import { localhost } from 'viem/chains'
import { ref } from 'vue'

const blockCount = ref<bigint>()

const client = createPublicClient({
  chain: localhost,
  transport: http('http://localhost:7545'),
})

const getBlockAmount = async () => {
  try {
    blockCount.value = await client.getBlockNumber()
  } catch (error) {
    console.error('Error getting block count:', error)
  }
}
</script>

<template>
  <div>
    <h2>View amount of blocks</h2>
    <p>{{ blockCount }}</p>
    <div>
      <button type="button" @click="getBlockAmount">View</button>
    </div>
  </div>
</template>
