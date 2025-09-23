// TON Transfer App - Fixed Version
class TONTransferApp {
    constructor() {
        this.tonConnectUI = null;
        this.init();
    }

    init() {
        try {
            this.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: window.location.origin + '/ton-simple-html/tonconnect-manifest.json'
            });

            this.setupConnectionListener();
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

        document.getElementById('message').addEventListener('input', (e) => {
            document.querySelector('.char-count').textContent = e.target.value.length + '/100';
        });
    }

    async connectWallet() {
        try {
            this.showStatus('Opening wallet...', 'loading');
            await this.tonConnectUI.connectWallet();
        } catch (error) {
            this.showStatus('Connection failed: ' + error.message, 'error');
        }
    }

    onWalletConnected(wallet) {
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
        // ✅ FIX: Gunakan property yang benar
        const wallet = this.tonConnectUI.wallet; // atau this.tonConnectUI.connected
        
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
            
        } catch (error) {
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

// Initialize
if (typeof TON_CONNECT_UI !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tonApp = new TONTransferApp();
    });
} else {
    console.error('TON Connect UI library not loaded');
}