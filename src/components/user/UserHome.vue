<script setup lang="ts">
import { onMounted, ref } from 'vue'

const blocks = ref([])
const transactions = ref([])
const loading = ref(false)
const mining = ref(false)
const activeTab = ref('create')

const newTransaction = ref({
  from: '',
  to: '',
  amount: 0,
})

const getToken = () => localStorage.getItem('token')

const fetchBlocks = async () => {
  try {
    loading.value = true
    const response = await fetch('http://localhost:3000/api/blocks/', {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    const data = await response.json()
    if (data.success) {
      blocks.value = data.data.chain || data.data
    }
  } catch (error) {
    console.error('Error fetching blocks:', error)
    alert('Fel vid hämtning av block')
  } finally {
    loading.value = false
  }
}

const fetchTransactions = async () => {
  try {
    loading.value = true
    const response = await fetch('http://localhost:3000/api/transaction/', {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    const data = await response.json()
    if (data.success) {
      transactions.value = data.data
    }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    alert('Fel vid hämtning av transaktioner')
  } finally {
    loading.value = false
  }
}

const createTransaction = async () => {
  if (!newTransaction.value.to || newTransaction.value.amount <= 0) {
    alert('Mottagare och belopp måste fyllas i och beloppet måste vara större än 0')
    return
  }

  try {
    const response = await fetch('http://localhost:3000/api/transaction/addTransaction', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        recipient: newTransaction.value.to,
        amount: newTransaction.value.amount,
      }),
    })

    const data = await response.json()
    if (data.success) {
      alert('Transaktion skapad!')
      newTransaction.value = { from: '', to: '', amount: 0 }
      fetchTransactions()
    } else {
      alert('Fel vid skapande av transaktion: ' + data.error)
    }
  } catch (error) {
    console.error('Error creating transaction:', error)
    alert('Fel vid skapande av transaktion')
  }
}

const mineBlock = async () => {
  try {
    mining.value = true
    const response = await fetch('http://localhost:3000/api/blocks/mine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({}),
    })

    const data = await response.json()
    if (data.success) {
      alert('Block har grävts framgångsrikt!')
      fetchBlocks()
      fetchTransactions()
    } else {
      alert('Fel vid grävning av block: ' + data.message)
    }
  } catch (error) {
    console.error('Error mining block:', error)
    alert('Fel vid grävning av block')
  } finally {
    mining.value = false
  }
}

const logout = () => {
  localStorage.removeItem('token')
  window.location.href = '/'
}

onMounted(() => {
  fetchBlocks()
  fetchTransactions()
})
</script>

<template>
  <div class="user-home">
    <header class="header">
      <h1>Kryptovaluta Dashboard</h1>
      <button @click="logout" class="logout-btn">Logga ut</button>
    </header>

    <nav class="nav-tabs">
      <button
        @click="activeTab = 'create'"
        :class="{ active: activeTab === 'create' }"
        class="tab-btn"
      >
        Skapa Transaktion
      </button>
      <button
        @click="activeTab = 'transactions'"
        :class="{ active: activeTab === 'transactions' }"
        class="tab-btn"
      >
        Mina Transaktioner
      </button>
      <button
        @click="activeTab = 'blocks'"
        :class="{ active: activeTab === 'blocks' }"
        class="tab-btn"
      >
        Blockchain
      </button>
      <button @click="activeTab = 'mine'" :class="{ active: activeTab === 'mine' }" class="tab-btn">
        Gräv Block
      </button>
    </nav>

    <main class="main-content">
      <!-- Skapa Transaktion -->
      <div v-if="activeTab === 'create'" class="tab-content">
        <h2>Skapa Ny Transaktion</h2>
        <form @submit.prevent="createTransaction" class="transaction-form">
          <div class="form-group">
            <label for="from">Från (din wallet):</label>
            <input
              id="from"
              type="text"
              value="Din wallet (automatisk)"
              readonly
              class="readonly-input"
            />
            <small>Transaktioner skickas automatiskt från din nodes wallet</small>
          </div>

          <div class="form-group">
            <label for="to">Till (mottagarens adress):</label>
            <input
              id="to"
              type="text"
              v-model="newTransaction.to"
              placeholder="Mottagarens offentliga nyckel/adress"
              required
            />
          </div>

          <div class="form-group">
            <label for="amount">Belopp:</label>
            <input
              id="amount"
              type="number"
              v-model.number="newTransaction.amount"
              placeholder="Ange belopp"
              min="0.01"
              step="0.01"
              required
            />
          </div>

          <button type="submit" class="submit-btn">Skapa Transaktion</button>
        </form>
      </div>

      <!-- Transaktioner -->
      <div v-if="activeTab === 'transactions'" class="tab-content">
        <h2>Mina Transaktioner</h2>
        <div v-if="loading" class="loading">Laddar transaktioner...</div>
        <div v-else-if="transactions.length === 0" class="empty">Inga transaktioner hittades</div>
        <div v-else class="transactions-list">
          <div v-for="transaction in transactions" :key="transaction.id" class="transaction-card">
            <div class="transaction-header">
              <h4>Transaktion: {{ transaction.id.substring(0, 8) }}...</h4>
              <span :class="['status', transaction.status]">{{ transaction.status }}</span>
            </div>
            <div class="transaction-details">
              <p><strong>Från:</strong> {{ transaction.input.address.substring(0, 20) }}...</p>
              <p><strong>Belopp:</strong> {{ transaction.input.amount }}</p>
              <p>
                <strong>Tidsstämpel:</strong>
                {{ new Date(transaction.input.timestamp).toLocaleString() }}
              </p>
              <div v-if="transaction.outputMap">
                <strong>Mottagare:</strong>
                <ul>
                  <li v-for="(amount, address) in transaction.outputMap" :key="address">
                    {{ address.substring(0, 20) }}... : {{ amount }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Blockchain -->
      <div v-if="activeTab === 'blocks'" class="tab-content">
        <h2>Blockchain</h2>
        <div v-if="loading" class="loading">Laddar block...</div>
        <div v-else-if="blocks.length === 0" class="empty">Inga block hittades</div>
        <div v-else class="blocks-list">
          <div v-for="(block, index) in blocks" :key="block.hash" class="block-card">
            <div class="block-header">
              <h3>Block #{{ index }}</h3>
              <span class="timestamp">{{ new Date(block.timestamp).toLocaleString() }}</span>
            </div>
            <div class="block-details">
              <p>
                <strong>Hash:</strong> <code>{{ block.hash }}</code>
              </p>
              <p>
                <strong>Tidigare Hash:</strong> <code>{{ block.prevHash }}</code>
              </p>
              <p><strong>Nonce:</strong> {{ block.nonce }}</p>
              <p><strong>Svårighet:</strong> {{ block.difficulty }}</p>
              <p><strong>Antal Transaktioner:</strong> {{ block.data.length }}</p>
              <div v-if="block.data.length > 0">
                <strong>Transaktioner:</strong>
                <pre>{{ JSON.stringify(block.data, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mining -->
      <div v-if="activeTab === 'mine'" class="tab-content">
        <div class="mining-section">
          <h2>Gräv Block</h2>
          <p>Gräv ett nytt block med pending transaktioner för att få belöning</p>

          <button @click="mineBlock" :disabled="mining" class="mine-btn">
            {{ mining ? 'Gräver...' : 'Gräv Block' }}
          </button>

          <div class="mining-info">
            <p><strong>Status:</strong> {{ mining ? 'Gräver block...' : 'Redo att gräva' }}</p>
            <p>
              <strong>Pending Transaktioner:</strong>
              {{ transactions.filter((t) => t.status === 'pending').length }}
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.user-home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.header h1 {
  color: #ffffff;
  margin: 0;
}

.logout-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.logout-btn:hover {
  background: #c82333;
}

.nav-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
  border-bottom: 1px solid #ddd;
}

.tab-btn {
  background: none;
  border: none;
  padding: 12px 20px;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
  color: #fff;
}

.tab-btn:hover {
  background: #f8f9fa;
  color: #000;
}

.tab-btn.active {
  border-bottom-color: #007bff;
  color: #007bff;
  font-weight: bold;
}

.main-content {
  min-height: 400px;
}

.readonly-input {
  background-color: #f8f9fa !important;
  color: #6c757d !important;
  cursor: not-allowed !important;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #6c757d;
  font-size: 0.85em;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #666;
}

.blocks-list,
.transactions-list {
  display: grid;
  gap: 20px;
}

.block-card,
.transaction-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.block-header h3 {
  margin: 0;
  color: #333;
}

.timestamp {
  color: #666;
  font-size: 0.9em;
}

.block-details p {
  margin: 8px 0;
  word-break: break-all;
}

.block-details code {
  background: #f8f9fa;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 0.9em;
}

.block-details pre {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.8em;
}

.transaction-form {
  max-width: 500px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.submit-btn,
.mine-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  width: 100%;
}

.submit-btn:hover,
.mine-btn:hover {
  background: #218838;
}

.mine-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.mining-section {
  text-align: center;
  max-width: 400px;
  margin: 0 auto;
}

.mining-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.status {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 0.8em;
  text-transform: uppercase;
}

.pending {
  background: #fff3cd;
  color: #856404;
}

.confirmed {
  background: #d4edda;
  color: #155724;
}
</style>
