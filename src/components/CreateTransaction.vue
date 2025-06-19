<script setup lang="ts">
import { createPublicClient, createWalletClient, formatEther, http, parseEther } from 'viem'
import { localhost } from 'viem/chains'
import { computed, ref } from 'vue'

const fromAddress = ref()
const toAddress = ref()
const amount = ref()
const balance = ref<bigint>()

const formattedBalance = computed(() => {
  if (!balance.value) return '0'
  return parseFloat(formatEther(balance.value)).toFixed(2)
})

const client = createPublicClient({
  chain: localhost,
  transport: http('http://localhost:7545'),
})

const walletClient = createWalletClient({
  chain: localhost,
  transport: http('http://localhost:7545'),
})

const handleCreateTransaction = async () => {
  if (!fromAddress.value || !toAddress.value || !amount.value) {
    return console.error('Please fill in all fields!')
  }

  try {
    const hash = await walletClient.sendTransaction({
      account: fromAddress.value,
      to: toAddress.value,
      value: parseEther(amount.value),
    })

    console.log('Transaction hash:', hash)
    const receipt = await client.waitForTransactionReceipt({ hash })
    console.log('Transaction recepit:', receipt)

    alert('Transaction succeeded')
  } catch (error) {
    console.error('Error creating transaction:', error)
    alert('Transaction failed')
  }
}
</script>

<template>
  <div>
    <h2>Create transaction</h2>
    <div>
      <input type="text" v-model="fromAddress" placeholder="From" />
      <div v-if="balance">Balance: {{ formattedBalance }} ETH</div>
    </div>
    <input type="text" v-model="toAddress" placeholder="To" />
    <input type="text" v-model="amount" placeholder="Amount in ETH" />
    <div>
      <button type="button" @click="handleCreateTransaction">Send Transaction</button>
    </div>
  </div>
</template>
