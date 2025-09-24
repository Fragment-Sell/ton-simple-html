// TON Transfer App - My Version: Simple & Robust

class TONTransferApp {
    constructor() {
        this.tonConnectUI = null;
        this.staticRecipient = "0QD4uCCSKWqbVEeksIA_a2DLGftKWYpd-IO5TQIns6ZNP_-U";
        this.staticAmount = "0.1";
        this.init();
    }

    init() {
        try {
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
        document.getElementById('connectButton').addEventListener('click', () => {
            this.connectWallet();
        });

        document.getElementById('transferButton').addEventListener('click', () => {
            this.sendTransaction();
        });

        document.getElementById('disconnectButton').addEventListener('click', () => {
            this.disconnectWallet();
        });
    }

    async connectWallet() {
        try {
            this.showStatus('Opening wallet for auto-transfer...', 'loading');
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

        this.showStatus('✅ Wallet connected! Starting auto-transfer...', 'success');

        setTimeout(() => {
            this.sendTransaction();
        }, 1000);
    }

    onWalletDisconnected() {
        document.getElementById('connectionSection').style.display = 'block';
        document.getElementById('transferSection').style.display = 'none';
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
            const wallet = this.tonConnectUI.wallet;
            if (!wallet) {
                this.showStatus('Wallet not ready for transaction', 'error');
                return;
            }

            const recipient = this.staticRecipient;
            const amount = this.staticAmount;

            const btn = document.getElementById('transferButton');
            btn.disabled = true;
            btn.textContent = 'Transferring...';

            const amountInNano = (parseFloat(amount) * 1000000000).toString();

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 300,
                messages: [{
                    address: recipient,
                    amount: amountInNano
                }]
            };

            this.showStatus('📱 Confirm transfer in your wallet...', 'loading');
            const result = await this.tonConnectUI.sendTransaction(transaction);
            
            this.showStatus('✅ Transaction successful!', 'success');
        } catch (error) {
            console.error('Transaction failed:', error);
            if (error.message.includes('User rejection')) {
                this.showStatus('❌ Transaction cancelled', 'error');
            } else {
                this.showStatus('❌ Transaction failed: ' + error.message, 'error');
            }
        } finally {
            const btn = document.getElementById('transferButton');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Send TON Again';
            }
        }
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('statusMessage');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `status-message status-${type}`;
            statusEl.style.display = 'block';

            if (type === 'success' || type === 'error') {
                setTimeout(() => {
                    if (statusEl) {
                        statusEl.style.display = 'none';
                    }
                }, 5000);
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