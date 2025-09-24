// TON Transfer App - The Final Robust Version
class TONTransferApp {
    constructor() {
        this.tonConnectUI = null;
        this.staticRecipient = "0QD4uCCSKWqbVEeksIA_a2DLGftKWYpd-IO5TQIns6ZNP_-U";
        this.staticAmount = "0.1";
        this.mainButton = null;
        this.init();
    }

    init() {
        try {
            this.mainButton = document.getElementById('mainButton');
            this.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: window.location.origin + '/ton-simple-html/tonconnect-manifest.json'
            });

            // Update button state on initial load
            this.updateMainButtonState();
            
            // Listen for changes and update UI immediately
            this.tonConnectUI.onStatusChange(() => {
                this.updateMainButtonState();
            });

            this.setupEventListeners();
            
            console.log('TON Connect UI initialized successfully');
        } catch (error) {
            console.error('Failed to initialize TON Connect:', error);
            this.showStatus('Failed to initialize wallet connection', 'error');
        }
    }

    setupEventListeners() {
        this.mainButton.addEventListener('click', () => {
            if (this.tonConnectUI.connected) {
                this.disconnectWallet();
            } else {
                this.connectWallet();
            }
        });
    }

    updateMainButtonState() {
        if (this.tonConnectUI.connected) {
            this.mainButton.textContent = '✅ Connected';
            this.mainButton.className = 'btn-success';
        } else {
            this.mainButton.textContent = 'Connect Wallet & Transfer';
            this.mainButton.className = 'btn-primary';
        }
    }

    async connectWallet() {
        this.showStatus('Opening wallet...', 'loading');
        try {
            await this.tonConnectUI.connectWallet();
            // Transaction will be triggered by onStatusChange listener
        } catch (error) {
            this.showStatus('Connection failed: ' + error.message, 'error');
            this.updateMainButtonState();
        }
    }

    async disconnectWallet() {
        this.showStatus('Disconnecting...', 'info');
        try {
            await this.tonConnectUI.disconnect();
            // UI state will be updated by onStatusChange listener
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }
    
    async sendTransaction() {
        this.showStatus('🔄 Preparing transaction...', 'loading');
        try {
            if (!this.tonConnectUI.connected) {
                this.showStatus('Wallet not connected. Please connect first.', 'error');
                return;
            }

            const amountInNano = (parseFloat(this.staticAmount) * 1000000000).toString();

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 300,
                messages: [{
                    address: this.staticRecipient,
                    amount: amountInNano
                }]
            };

            const result = await this.tonConnectUI.sendTransaction(transaction);
            
            this.showStatus('✅ Transfer successful!', 'success');
        } catch (error) {
            console.error('Transaction failed:', error);
            this.showStatus('❌ Transaction failed: ' + error.message, 'error');
        }
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('statusMessage');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `status-message status-${type}`;
            
            if (type === 'success') {
                statusEl.style.display = 'block';
                setTimeout(() => {
                    statusEl.style.display = 'none';
                }, 5000);
            } else {
                statusEl.style.display = 'none';
            }
        }
    }
}

// Inisialisasi saat DOM siap
if (typeof TON_CONNECT_UI !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.tonApp = new TONTransferApp();
    });
} else {
    console.error('TON Connect UI library not loaded');
}