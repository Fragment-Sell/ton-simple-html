// TON Transfer App - Simple & Working Version
class TONTransferApp {
    constructor() {
        this.tonConnectUI = null;
        this.init();
    }

    init() {
        try {
            // ✅ Inisialisasi TON Connect SDK
            this.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: window.location.origin + '/ton-simple-html/tonconnect-manifest.json'
            });

            // ✅ Daftarkan listener status di awal
            this.setupConnectionListener();
            
            // ✅ Setup event listeners untuk tombol
            this.setupEventListeners();
            
            console.log('TON Connect UI initialized successfully');
        } catch (error) {
            console.error('Failed to initialize TON Connect:', error);
            this.showStatus('Failed to initialize wallet connection', 'error');
        }
    }

    setupConnectionListener() {
        this.tonConnectUI.onStatusChange((wallet) => {
            if (wallet) {
                this.onWalletConnected(wallet);
            } else {
                this.onWalletDisconnected();
            }
        });
    }

    setupEventListeners() {
        document.getElementById('connectButton').addEventListener('click', () => {
            this.connectWallet();
        });

        document.getElementById('transferButton').addEventListener('click', () => {
            this.sendTransaction();
        });

        document.getElementById('disconnectButton').addEventListener('click', () => {
            this.disconnectWallet();
        });

        // Message counter
        document.getElementById('message').addEventListener('input', (e) => {
            document.querySelector('.char-count').textContent = e.target.value.length + '/100';
        });
    }

    async connectWallet() {
        this.showStatus('Opening wallet...', 'loading');
        // ✅ Panggil connectWallet tanpa await.
        // Hasilnya akan ditangani oleh listener yang sudah didaftarkan.
        this.tonConnectUI.connectWallet()
            .then(() => this.showStatus('Waiting for wallet approval...', 'info'))
            .catch((error) => this.showStatus('Connection failed: ' + error.message, 'error'));
    }

    onWalletConnected(wallet) {
        // Update UI
        document.getElementById('connectionSection').style.display = 'none';
        document.getElementById('transferSection').style.display = 'block';
        
        const shortAddress = wallet.account.address.slice(0, 8) + '...' + wallet.account.address.slice(-6);
        document.getElementById('walletAddress').textContent = shortAddress;
        
        this.showStatus('✅ Wallet connected!', 'success');
    }

    onWalletDisconnected() {
        document.getElementById('connectionSection').style.display = 'block';
        document.getElementById('transferSection').style.display = 'none';
        
        this.clearForm();
        this.showStatus('Wallet disconnected', 'info');
    }

    async disconnectWallet() {
        await this.tonConnectUI.disconnect();
    }

    async sendTransaction() {
        const wallet = this.tonConnectUI.getWallet();
        if (!wallet) {
            this.showStatus('Please connect wallet first', 'error');
            return;
        }

        const recipient = document.getElementById('recipient').value.trim();
        const amount = document.getElementById('amount').value.trim();

        if (!recipient) {
            this.showStatus('Please enter recipient address', 'error');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            this.showStatus('Please enter a valid amount', 'error');
            return;
        }

        try {
            this.showStatus('Preparing transaction...', 'loading');
            const btn = document.getElementById('transferButton');
            btn.disabled = true;
            btn.textContent = 'Processing...';

            const amountInNano = (parseFloat(amount) * 1000000000).toString();

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 300,
                messages: [{
                    address: recipient,
                    amount: amountInNano
                }]
            };

            const result = await this.tonConnectUI.sendTransaction(transaction);
            this.showStatus('✅ Transaction successful!', 'success');
            this.clearForm();
            console.log('Transaction result:', result);
            
        } catch (error) {
            console.error('Transaction failed:', error);
            this.showStatus('❌ Transaction failed: ' + error.message, 'error');
        } finally {
            const btn = document.getElementById('transferButton');
            btn.disabled = false;
            btn.textContent = 'Send TON';
        }
    }

    clearForm() {
        document.getElementById('recipient').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('message').value = '';
        document.querySelector('.char-count').textContent = '0/100';
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('statusMessage');
        statusEl.textContent = message;
        statusEl.className = `status-message status-${type}`;
        statusEl.style.display = 'block';
        
        if (type === 'success' || type === 'error') {
            setTimeout(() => statusEl.style.display = 'none', 5000);
        }
    }
}

// Initialize when ready
if (typeof TON_CONNECT_UI !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tonApp = new TONTransferApp();
    });
} else {
    console.error('TON Connect UI library not loaded');
}