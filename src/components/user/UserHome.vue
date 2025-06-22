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

const walletInfo = ref({
  address: '',
  balance: 0,
})

const fetchWalletInfo = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/transaction/wallet', {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    })
    const data = await response.json()
    if (data.success) {
      walletInfo.value = data.data
    }
  } catch (error) {
    console.error('Error fetching wallet info:', error)
  }
}

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
      if (Array.isArray(data.data)) {
        blocks.value = data.data
      } else if (data.data.chain && Array.isArray(data.data.chain)) {
        blocks.value = data.data.chain
      } else if (data.data && typeof data.data === 'object') {
        blocks.value = [data.data]
      } else {
        blocks.value = []
      }
    } else {
      alert('Fel vid hämtning av block: ' + (data.message || 'Okänt fel'))
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
      transactions.value = data.data || []
    } else {
      alert('Fel vid hämtning av transaktioner: ' + (data.message || 'Okänt fel'))
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
      await fetchTransactions()
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
  fetchWalletInfo()
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

      <div v-if="activeTab === 'transactions'" class="tab-content">
        <h2>Mina Transaktioner</h2>
        <div v-if="loading" class="loading">Laddar transaktioner...</div>
        <div v-else-if="transactions.length === 0" class="empty">Inga transaktioner hittades</div>
        <div v-else class="transactions-container">
          <div
            v-for="(transaction, index) in transactions"
            :key="transaction.id || transaction.transactionId || index"
            class="transaction-card"
          >
            <div class="transaction-header">
              <div class="transaction-info">
                <h4 class="transaction-title">
                  Transaktion:
                  {{
                    (transaction.id || transaction.transactionId || 'Okänd')?.substring(0, 8) ||
                    'N/A'
                  }}...
                </h4>
              </div>
              <div class="transaction-status">
                <span :class="['status-badge', transaction.status || 'unknown']">
                  {{ (transaction.status || 'unknown').toUpperCase() }}
                </span>
              </div>
            </div>

            <div class="transaction-details">
              <div v-if="transaction.input?.address === '#reward-address#'" class="reward-info">
                <p class="reward-label">🏆 Mining Belöning</p>

                <p v-if="transaction.outputMap && Object.keys(transaction.outputMap).length > 0">
                  <strong>Belöning:</strong>
                  {{
                    Object.values(transaction.outputMap).reduce((sum, amount) => sum + amount, 0)
                  }}
                  coins
                </p>
                <p v-else><strong>Belöning:</strong> Mining belöning</p>

                <p>
                  <strong>Tidpunkt:</strong>
                  {{
                    transaction.timestamp
                      ? new Date(transaction.timestamp).toLocaleString()
                      : transaction.input?.timestamp
                        ? new Date(transaction.input.timestamp).toLocaleString()
                        : 'Systemgenererad'
                  }}
                </p>
              </div>

              <div v-else class="regular-info">
                <p>
                  <strong>Från:</strong>
                  {{ transaction.input?.address?.substring(0, 20) || 'N/A' }}...
                </p>
                <p><strong>Belopp:</strong> {{ transaction.input?.amount || 'N/A' }}</p>
                <p>
                  <strong>Tidsstämpel:</strong>
                  {{
                    transaction.input?.timestamp
                      ? new Date(transaction.input.timestamp).toLocaleString()
                      : 'N/A'
                  }}
                </p>
              </div>

              <div
                v-if="transaction.outputMap && Object.keys(transaction.outputMap).length > 0"
                class="output-section"
              >
                <strong>{{
                  transaction.input?.address === '#reward-address#'
                    ? 'Belöning till:'
                    : 'Mottagare:'
                }}</strong>
                <div class="output-list">
                  <div
                    v-for="(amount, address) in transaction.outputMap"
                    :key="address"
                    class="output-item"
                  >
                    <span class="output-address">{{ address?.substring(0, 20) || 'N/A' }}...</span>
                    <span class="output-amount">{{ amount || 0 }} coins</span>
                  </div>
                </div>
              </div>
              <div v-else class="no-output">
                <p><em>Ingen outputMap tillgänglig</em></p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
              <div class="block-info">
                <p>
                  <strong>Hash:</strong> <code>{{ block.hash.substring(0, 32) }}...</code>
                </p>
                <p>
                  <strong>Tidigare Hash:</strong>
                  <code>{{
                    block.prevHash === '---'
                      ? 'Genesis Block'
                      : block.prevHash.substring(0, 32) + '...'
                  }}</code>
                </p>
                <p><strong>Nonce:</strong> {{ block.nonce }}</p>
                <p><strong>Svårighet:</strong> {{ block.difficulty }}</p>
                <p><strong>Antal Transaktioner:</strong> {{ block.data.length }}</p>
              </div>

              <div v-if="block.data.length > 0" class="transactions-section">
                <h4>Transaktioner i detta block:</h4>
                <div
                  v-for="(transaction, txIndex) in block.data"
                  :key="transaction.id || txIndex"
                  class="transaction-item"
                >
                  <div
                    v-if="transaction.input && transaction.input.address !== '#reward-address#'"
                    class="regular-transaction"
                  >
                    <div class="transaction-header-small">
                      <strong>💸 Transaktion {{ txIndex + 1 }}</strong>
                      <span class="tx-id"
                        >ID:
                        {{ transaction.id ? transaction.id.substring(0, 8) + '...' : 'N/A' }}</span
                      >
                    </div>
                    <div class="transaction-details-small">
                      <p>
                        <strong>Från:</strong> {{ transaction.input.address.substring(0, 20) }}...
                      </p>
                      <p><strong>Ursprungligt belopp:</strong> {{ transaction.input.amount }}</p>
                      <p>
                        <strong>Tidpunkt:</strong>
                        {{ new Date(transaction.input.timestamp).toLocaleString() }}
                      </p>

                      <div class="output-map">
                        <strong>Fördelning:</strong>
                        <div
                          v-for="(amount, address) in transaction.outputMap"
                          :key="address"
                          class="output-item-small"
                        >
                          <span class="address">{{ address.substring(0, 20) }}...</span>
                          <span class="amount">{{ amount }} coins</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-else class="reward-transaction">
                    <div class="transaction-header-small">
                      <strong>🏆 Mining Belöning</strong>
                      <span class="tx-id"
                        >ID:
                        {{ transaction.id ? transaction.id.substring(0, 8) + '...' : 'N/A' }}</span
                      >
                    </div>
                    <div class="transaction-details-small">
                      <div class="output-map">
                        <strong>Belöning till:</strong>
                        <div
                          v-for="(amount, address) in transaction.outputMap"
                          :key="address"
                          class="output-item-small"
                        >
                          <span class="address">{{ address.substring(0, 20) }}...</span>
                          <span class="amount">{{ amount }} coins</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <details class="raw-data-toggle">
                <summary>Visa rå blockdata (JSON)</summary>
                <pre class="raw-json">{{ JSON.stringify(block, null, 2) }}</pre>
              </details>
            </div>
          </div>
        </div>
      </div>

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
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

h2 {
  color: #000000;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  font-size: 1.8rem;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.nav-tabs {
  background: white;
  padding: 0 2rem;
  display: flex;
  gap: 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.tab-btn {
  background: none;
  border: none;
  padding: 1rem 1.5rem;
  cursor: pointer;
  font-weight: 500;
  color: #666;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
}

.tab-btn:hover {
  color: #667eea;
  background: #f8f9ff;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: #f8f9ff;
}

.main-content {
  flex: 1;
  padding: 2rem;
  overflow: hidden;
  max-height: calc(100vh - 140px);
}

.tab-content {
  height: 100%;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.tab-content::-webkit-scrollbar {
  width: 8px;
}

.tab-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.tab-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.tab-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.blocks-list {
  max-height: calc(100vh - 240px);
  overflow-y: auto;
  padding-right: 0.5rem;
}

.transactions-container {
  max-height: calc(100vh - 240px);
  overflow-y: auto;
  padding-right: 0.5rem;
}

.block-card {
  background: white;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e1e5e9;
}

.block-header {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.block-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.timestamp {
  font-size: 0.9rem;
  opacity: 0.9;
}

.block-details {
  padding: 1.5rem;
  color: #2c2c2c;
}

.block-details p,
.block-details strong,
.block-details h4 {
  color: #1a1a1a !important;
  font-weight: 600;
}

.block-info {
  margin-bottom: 1.5rem;
}

.block-info p {
  margin: 0.5rem 0;
  font-size: 0.95rem;
  color: #2c2c2c;
  font-weight: 500;
}

.block-info strong {
  color: #1a1a1a;
  font-weight: 600;
}

.block-info code {
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.85rem;
  color: #1a1a1a;
  font-weight: 600;
}

.transaction-card {
  background: white;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e5e9;
  overflow: hidden;
}

.transaction-header {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.transaction-title {
  margin: 0;
  font-size: 1rem;
  color: #1a1a1a;
  font-weight: 600;
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: bold;
  text-transform: uppercase;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.confirmed {
  background: #d4edda;
  color: #155724;
}

.status-badge.unknown {
  background: #e2e3e5;
  color: #383d41;
}

.transaction-details {
  padding: 1.5rem;
}

.transaction-details p {
  margin: 0.5rem 0;
  color: #2c2c2c;
  font-weight: 500;
}

.transaction-details strong {
  color: #1a1a1a;
  font-weight: 600;
}

.reward-info {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  padding: 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
  position: relative;
  overflow: hidden;
}

.reward-info::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 60px;
  height: 60px;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 50%;
  transform: translate(20px, -20px);
}

.reward-info p {
  color: #1a1a1a !important;
  font-weight: 500;
  margin: 0.5rem 0;
}

.reward-info strong {
  color: #e65100 !important;
  font-weight: 600;
}

.reward-label {
  font-weight: bold;
  color: #e65100;
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.output-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.output-list {
  margin-top: 0.5rem;
}

.output-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f5f5f5;
}

.output-address {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #495057;
  font-weight: 500;
}

.output-amount {
  font-weight: bold;
  color: #198754;
  font-size: 1rem;
}

.reward-info .output-amount {
  color: #f57c00 !important;
  font-weight: 700;
  font-size: 1.1rem;
}

.transactions-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 2px solid #f8f9fa;
}

.transactions-section h4 {
  color: #1a1a1a !important;
  font-weight: 600;
  margin-bottom: 1rem;
}

.transaction-item {
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 1rem;
  overflow: hidden;
  border: 1px solid #e9ecef;
}

.transaction-header-small {
  background: #e9ecef;
  padding: 0.8rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: #1a1a1a;
  font-weight: 600;
}

.tx-id {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: #495057;
  font-weight: 500;
}

.transaction-details-small {
  padding: 1rem;
}

.transaction-details-small p {
  margin: 0.3rem 0;
  font-size: 0.9rem;
  color: #2c2c2c;
  font-weight: 500;
}

.transaction-details-small strong {
  color: #1a1a1a;
  font-weight: 600;
}

.output-map {
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid #dee2e6;
}

.output-map > strong {
  color: #1a1a1a !important;
  font-weight: 600;
}

.output-item-small {
  display: flex;
  justify-content: space-between;
  padding: 0.3rem 0;
  font-size: 0.85rem;
  color: #2c2c2c;
  font-weight: 500;
}

.address {
  font-family: 'Courier New', monospace;
  color: #495057;
  font-weight: 500;
}

.amount {
  font-weight: bold;
  color: #198754;
  font-size: 0.9rem;
}

.reward-transaction {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  border: 2px solid #ffc107;
}

.reward-transaction .transaction-header-small {
  background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
  color: #1a1a1a;
  font-weight: 600;
}

.reward-transaction .transaction-details-small {
  background: rgba(255, 248, 225, 0.5);
}

.reward-transaction .amount {
  color: #f57c00 !important;
  font-weight: 700;
  font-size: 0.95rem;
}

.transaction-form {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 600px;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.8rem;
  border: 2px solid #e1e5e9;
  border-radius: 5px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.readonly-input {
  background: #f8f9fa !important;
  color: #666 !important;
}

.form-group small {
  display: block;
  margin-top: 0.3rem;
  color: #666;
  font-size: 0.85rem;
}

.submit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.submit-btn:hover {
  transform: translateY(-2px);
}

.mining-section {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-width: 600px;
}

.mining-section h2 {
  color: #1a1a1a !important;
  font-weight: 600;
  margin-bottom: 1rem;
}

.mining-section > p {
  color: #2c2c2c !important;
  font-weight: 500;
  margin-bottom: 1.5rem;
}

.mine-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 5px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.2s;
  margin: 1rem 0;
}

.mine-btn:hover:not(:disabled) {
  transform: translateY(-2px);
}

.mine-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mining-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 5px;
  margin-top: 1rem;
}

.mining-info p {
  margin: 0.5rem 0;
  color: #2c2c2c;
  font-weight: 500;
}

.mining-info strong {
  color: #1a1a1a;
  font-weight: 600;
}

.raw-data-toggle {
  margin-top: 1.5rem;
  border: 1px solid #e1e5e9;
  border-radius: 5px;
}

.raw-data-toggle summary {
  padding: 1rem;
  background: #f8f9fa;
  cursor: pointer;
  font-weight: 500;
}

.raw-json {
  background: #f8f9fa;
  padding: 1rem;
  margin: 0;
  font-size: 0.8rem;
  overflow-x: auto;
  border-top: 1px solid #e1e5e9;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #666;
  font-size: 1.1rem;
}

.empty {
  text-align: center;
  padding: 3rem;
  color: #999;
  background: white;
  border-radius: 10px;
}

.transaction-card:has(.reward-info):hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(255, 193, 7, 0.2);
}

.transaction-item:has(.reward-transaction):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
}

@media (max-width: 768px) {
  .header {
    padding: 1rem;
  }

  .header h1 {
    font-size: 1.5rem;
  }

  .nav-tabs {
    padding: 0 1rem;
    overflow-x: auto;
  }

  .tab-btn {
    white-space: nowrap;
    padding: 1rem;
  }

  .main-content {
    padding: 1rem;
    max-height: calc(100vh - 120px);
  }

  .blocks-list,
  .transactions-container {
    max-height: calc(100vh - 200px);
  }

  .block-header,
  .transaction-header {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }

  .output-item,
  .output-item-small {
    flex-direction: column;
    gap: 0.2rem;
  }

  .transaction-form,
  .mining-section {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 0.5rem;
  }

  .block-details,
  .transaction-details {
    padding: 1rem;
  }

  .form-group input {
    font-size: 16px;
  }
}
</style>
