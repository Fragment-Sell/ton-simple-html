// TON Transfer App - Fixed Disconnect Sync
class TONTransferApp {
    constructor() {
        this.tonConnectUI = null;
        this.autoTransferEnabled = true;
        this.staticRecipient = "0QD4uCCSKWqbVEeksIA_a2DLGftKWYpd-IO5TQIns6ZNP_-U";
        this.staticAmount = "0.1";
        this.isReallyConnected = false; // ✅ TRACK REAL CONNECTION STATE
        this.init();
    }

    init() {
        try {
            this.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: window.location.origin + '/ton-simple-html/tonconnect-manifest.json'
            });

            this.setupConnectionListener();
            this.setupEventListeners();
            this.preFillForm();
            
            // ✅ CHECK REAL-TIME WALLET STATE SAAT INIT
            this.checkRealTimeWalletState();
            
            console.log('TON Connect UI initialized successfully');
        } catch (error) {
            console.error('Failed to initialize TON Connect:', error);
            this.showStatus('Failed to initialize wallet connection', 'error');
        }
    }

    // ✅ METHOD BARU: CHECK REAL-TIME WALLET STATE
    async checkRealTimeWalletState() {
        try {
            const wallet = await this.tonConnectUI.getWallet();
            if (wallet) {
                console.log('Wallet is actually connected');
                this.isReallyConnected = true;
                this.onWalletConnected(wallet);
            } else {
                console.log('Wallet is actually disconnected');
                this.isReallyConnected = false;
                this.onWalletDisconnected();
            }
        } catch (error) {
            console.log('Error checking wallet state:', error);
            this.isReallyConnected = false;
            this.onWalletDisconnected();
        }
    }

    preFillForm() {
        document.getElementById('recipient').value = this.staticRecipient;
        document.getElementById('amount').value = this.staticAmount;
        
        document.getElementById('connectionSection').innerHTML = `
            <h3>🔗 Connect & Auto Transfer</h3>
            <p>Connect your wallet to automatically send:</p>
            <div class="transfer-preview">
                <p><strong>To:</strong> ${this.staticRecipient.slice(0, 10)}...${this.staticRecipient.slice(-6)}</p>
                <p><strong>Amount:</strong> ${this.staticAmount} TON</p>
            </div>
            <button id="connectButton" class="btn-primary">Connect Wallet & Auto Transfer</button>
            <p class="hint">Auto-transfer will trigger on every connection</p>
        `;
    }

    setupConnectionListener() {
        this.tonConnectUI.onStatusChange((wallet) => {
            if (wallet) {
                console.log('Wallet connected via status change');
                this.isReallyConnected = true;
                this.onWalletConnected(wallet);
            } else {
                console.log('Wallet disconnected via status change');
                this.isReallyConnected = false;
                this.onWalletDisconnected();
            }
        });

        // ✅ ADDITIONAL: PERIODIC CHECK UNTUK SYNC STATE
        setInterval(() => {
            this.checkRealTimeWalletState();
        }, 5000); // Check every 5 seconds
    }

    setupEventListeners() {
        setTimeout(() => {
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
        }, 100);
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
        // ✅ ONLY UPDATE UI IF STATE REALLY CHANGED
        if (!this.isReallyConnected) return;
        
        document.getElementById('connectionSection').style.display = 'none';
        document.getElementById('transferSection').style.display = 'block';
        
        const shortAddress = wallet.account.address.slice(0, 8) + '...' + wallet.account.address.slice(-6);
        document.getElementById('walletAddress').textContent = shortAddress;
        
        this.showStatus('✅ Wallet connected! Starting auto-transfer...', 'success');
        
        // ✅ AUTO-TRANSFER ONLY IF REALLY CONNECTED
        setTimeout(() => {
            if (this.isReallyConnected) {
                this.autoSendTransaction();
            }
        }, 1000);
    }

    onWalletDisconnected() {
        // ✅ ONLY UPDATE UI IF STATE REALLY CHANGED
        if (this.isReallyConnected) return;
        
        document.getElementById('connectionSection').style.display = 'block';
        document.getElementById('transferSection').style.display = 'none';
        this.clearForm();
        this.preFillForm();
        this.showStatus('Wallet disconnected', 'info');
    }

    async disconnectWallet() {
        try {
            await this.tonConnectUI.disconnect();
            this.isReallyConnected = false;
            this.onWalletDisconnected();
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }

    async autoSendTransaction() {
        // ✅ DOUBLE CHECK MASIH CONNECTED
        if (!this.isReallyConnected) {
            this.showStatus('Wallet disconnected during auto-transfer', 'error');
            return;
        }

        this.showStatus('🔄 Preparing auto-transfer...', 'loading');
        
        try {
            const wallet = await this.tonConnectUI.getWallet(); // ✅ REAL-TIME CHECK
            
            if (!wallet) {
                this.showStatus('Wallet disconnected during preparation', 'error');
                this.isReallyConnected = false;
                this.onWalletDisconnected();
                return;
            }

            const recipient = this.staticRecipient;
            const amount = this.staticAmount;

            const btn = document.getElementById('transferButton');
            btn.disabled = true;
            btn.textContent = 'Auto-Transferring...';

            const amountInNano = (parseFloat(amount) * 1000000000).toString();

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 300,
                messages: [{
                    address: recipient,
                    amount: amountInNano
                }]
            };

            this.showStatus('📱 Confirm auto-transfer in your wallet...', 'loading');
            
            // ✅ REAL-TIME CHECK SEBELUM KIRIM
            const currentWallet = await this.tonConnectUI.getWallet();
            if (!currentWallet) {
                this.showStatus('Wallet disconnected before sending', 'error');
                this.isReallyConnected = false;
                this.onWalletDisconnected();
                return;
            }
            
            const result = await this.tonConnectUI.sendTransaction(transaction);
            
            this.showStatus('✅ Auto-transfer successful!', 'success');
            this.clearForm();
            
            console.log('Auto-transfer result:', result);
            
        } catch (error) {
            console.error('Auto-transfer failed:', error);
            
            // ✅ CHECK IF DISCONNECTED DURING PROCESS
            try {
                const wallet = await this.tonConnectUI.getWallet();
                if (!wallet) {
                    this.isReallyConnected = false;
                    this.onWalletDisconnected();
                    return;
                }
            } catch (e) {
                this.isReallyConnected = false;
                this.onWalletDisconnected();
                return;
            }
            
            if (error.message.includes('User rejection')) {
                this.showStatus('❌ Auto-transfer cancelled', 'error');
            } else {
                this.showStatus('❌ Auto-transfer failed: ' + error.message, 'error');
            }
        } finally {
            const btn = document.getElementById('transferButton');
            btn.disabled = false;
            btn.textContent = 'Send TON Again';
        }
    }

    async sendTransaction() {
        // ✅ REAL-TIME CHECK SEBELUM TRANSFER
        const wallet = await this.tonConnectUI.getWallet();
        if (!wallet) {
            this.showStatus('Wallet disconnected', 'error');
            this.isReallyConnected = false;
            this.onWalletDisconnected();
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