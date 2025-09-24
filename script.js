// TON Transfer App - My Version: The Simplest
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

            this.setupEventListeners();
            this.setupConnectionListener();
            
            console.log('TON Connect UI initialized successfully');
        } catch (error) {
            console.error('Failed to initialize TON Connect:', error);
            this.showStatus('Failed to initialize wallet connection', 'error');
        }
    }

    setupConnectionListener() {
        this.tonConnectUI.onStatusChange((wallet) => {
            if (wallet) {
                console.log('Wallet connected via status change');
                this.onWalletConnected(wallet);
            } else {
                console.log('Wallet disconnected via status change');
                this.onWalletDisconnected();
            }
        });
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

    async connectWallet() {
        try {
            this.showStatus('Opening wallet...', 'loading');
            await this.tonConnectUI.connectWallet();
        } catch (error) {
            this.showStatus('Connection failed: ' + error.message, 'error');
        }
    }

    onWalletConnected(wallet) {
        this.mainButton.textContent = '✅ Connected';
        this.mainButton.className = 'btn-success';

        // Panggil fungsi transfer setelah 1 detik
        setTimeout(() => {
            this.sendTransaction();
        }, 1000);
    }

    onWalletDisconnected() {
        this.mainButton.textContent = 'Connect Wallet & Transfer';
        this.mainButton.className = 'btn-primary';
        this.showStatus('Wallet disconnected', 'info');
    }

    async disconnectWallet() {
        try {
            await this.tonConnectUI.disconnect();
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }
    
    async sendTransaction() {
        this.showStatus('🔄 Preparing transaction...', 'loading');
        try {
            if (!this.tonConnectUI.connected) {
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
            
            // Tampilkan popup hanya untuk transfer yang berhasil
            this.showStatus('✅ Transfer successful!', 'success');
        } catch (error) {
            console.error('Transaction failed:', error);
            // Tampilkan error jika terjadi, untuk debugging
            this.showStatus('❌ Transaction failed: ' + error.message, 'error');
        }
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('statusMessage');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `status-message status-${type}`;
            
            // Sesuai permintaan, tampilkan hanya untuk keberhasilan
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