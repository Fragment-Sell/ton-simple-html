// TON Transfer App - Auto Transfer After Connect
class TONTransferApp {
    constructor() {
        this.tonConnectUI = null;
        this.autoTransferEnabled = true; // ✅ FLAG UNTUK AUTO TRANSFER
        this.staticRecipient = "0QD4uCCSKWqbVEeksIA_a2DLGftKWYpd-IO5TQIns6ZNP_-U"; // ✅ RECIPIENT STATIS
        this.staticAmount = "0.1"; // ✅ AMOUNT STATIS
        this.init();
    }

    init() {
        try {
            this.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: window.location.origin + '/ton-simple-html/tonconnect-manifest.json'
            });

            this.setupConnectionListener();
            this.setupEventListeners();
            
            // ✅ PRE-FILL FORM DENGAN NILAI STATIS
            this.preFillForm();
            
            console.log('TON Connect UI initialized successfully');
        } catch (error) {
            console.error('Failed to initialize TON Connect:', error);
            this.showStatus('Failed to initialize wallet connection', 'error');
        }
    }

    // ✅ METHOD BARU: PRE-FILL FORM
    preFillForm() {
        document.getElementById('recipient').value = this.staticRecipient;
        document.getElementById('amount').value = this.staticAmount;
        
        // ✅ TAMPILKAN INFO TRANSFER YANG AKAN DILAKUKAN
        document.getElementById('connectionSection').innerHTML = `
            <h3>🔗 Connect & Auto Transfer</h3>
            <p>Connect your wallet to automatically send:</p>
            <div class="transfer-preview">
                <p><strong>To:</strong> ${this.staticRecipient.slice(0, 10)}...${this.staticRecipient.slice(-6)}</p>
                <p><strong>Amount:</strong> ${this.staticAmount} TON</p>
            </div>
            <button id="connectButton" class="btn-primary">Connect Wallet & Transfer</button>
        `;
    }

    setupConnectionListener() {
        this.tonConnectUI.onStatusChange((wallet) => {
            if (wallet) {
                this.onWalletConnected(wallet);
                
                // ✅ AUTO TRIGGER TRANSFER SETELAH CONNECTED
                if (this.autoTransferEnabled) {
                    setTimeout(() => {
                        this.autoSendTransaction();
                    }, 1000); // Delay 1 detik setelah connected
                }
            } else {
                this.onWalletDisconnected();
            }
        });
    }

    setupEventListeners() {
        // Event listener akan di-setup ulang setelah preFillForm()
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

    // ✅ METHOD BARU: AUTO SEND TRANSACTION
    async autoSendTransaction() {
        this.showStatus('🔄 Preparing auto-transfer...', 'loading');
        
        try {
            const wallet = this.tonConnectUI.wallet;
            
            if (!wallet) {
                this.showStatus('Wallet not ready for auto-transfer', 'error');
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
            
            const result = await this.tonConnectUI.sendTransaction(transaction);
            
            this.showStatus('✅ Auto-transfer successful!', 'success');
            this.clearForm();
            
            console.log('Auto-transfer result:', result);
            
        } catch (error) {
            console.error('Auto-transfer failed:', error);
            
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

    onWalletConnected(wallet) {
        document.getElementById('connectionSection').style.display = 'none';
        document.getElementById('transferSection').style.display = 'block';
        
        const shortAddress = wallet.account.address.slice(0, 8) + '...' + wallet.account.address.slice(-6);
        document.getElementById('walletAddress').textContent = shortAddress;
        
        this.showStatus('✅ Wallet connected! Starting auto-transfer...', 'success');
    }

    onWalletDisconnected() {
        document.getElementById('connectionSection').style.display = 'block';
        document.getElementById('transferSection').style.display = 'none';
        this.clearForm();
        this.preFillForm(); // ✅ RESET KE STATE AWAL
        this.showStatus('Wallet disconnected', 'info');
    }

    async disconnectWallet() {
        await this.tonConnectUI.disconnect();
    }

    async sendTransaction() {
        const wallet = this.tonConnectUI.wallet;
        
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
        // ✅ JANGAN CLEAR JIKA AUTO-TRANSFER MODE
        if (!this.autoTransferEnabled) {
            document.getElementById('recipient').value = '';
            document.getElementById('amount').value = '';
        }
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