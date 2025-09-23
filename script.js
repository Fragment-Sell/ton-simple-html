// TON Transfer App - Simplified Version
class TONTransferApp {
    constructor() {
        this.tonConnectUI = null;
        this.isConnected = false;
        this.init();
    }

    init() {
        // ✅ Simple initialization tanpa wallet list
        this.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: window.location.origin + '/ton-simple-html/tonconnect-manifest.json'
        });

        this.setupEventListeners();
        this.checkConnection();
    }

    setupEventListeners() {
        // Connect Button - langsung trigger connection
        document.getElementById('connectButton').addEventListener('click', () => {
            this.connectWallet();
        });

        // Transfer Button
        document.getElementById('transferButton').addEventListener('click', () => {
            this.sendTransaction();
        });

        // Disconnect Button
        document.getElementById('disconnectButton').addEventListener('click', () => {
            this.disconnectWallet();
        });

        // Message character count
        document.getElementById('message').addEventListener('input', (e) => {
            document.querySelector('.char-count').textContent = e.target.value.length + '/100';
        });

        // ✅ Listen for wallet connection changes
        this.tonConnectUI.onStatusChange((wallet) => {
            if (wallet) {
                this.onWalletConnected(wallet);
            } else {
                this.onWalletDisconnected();
            }
        });
    }

    async checkConnection() {
        try {
            const wallet = await this.tonConnectUI.getWallet();
            if (wallet) {
                this.onWalletConnected(wallet);
            }
        } catch (error) {
            console.log('No active wallet connection');
        }
    }

    async connectWallet() {
        try {
            this.showStatus('Opening wallet...', 'loading');
            
            // ✅ Direct connection tanpa modal selection
            await this.tonConnectUI.connectWallet();
            
            // Connection result akan ditangani oleh onStatusChange
        } catch (error) {
            if (error.message.includes('User closed the modal')) {
                this.showStatus('Connection cancelled', 'error');
            } else {
                this.showStatus('Connection failed: ' + error.message, 'error');
            }
        }
    }

    onWalletConnected(wallet) {
        this.isConnected = true;
        
        // ✅ Update UI sama seperti aplikasi React yang berhasil
        document.getElementById('connectionSection').style.display = 'none';
        document.getElementById('transferSection').style.display = 'block';
        
        // Display shortened wallet address
        const shortAddress = wallet.account.address.slice(0, 8) + '...' + wallet.account.address.slice(-6);
        document.getElementById('walletAddress').textContent = shortAddress;
        
        this.showStatus('Wallet connected successfully!', 'success');
    }

    onWalletDisconnected() {
        this.isConnected = false;
        
        // ✅ Reset UI ke state awal
        document.getElementById('connectionSection').style.display = 'block';
        document.getElementById('transferSection').style.display = 'none';
        
        // Clear form
        document.getElementById('recipient').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('message').value = '';
        document.querySelector('.char-count').textContent = '0/100';
        
        this.showStatus('Wallet disconnected', 'info');
    }

    async disconnectWallet() {
        await this.tonConnectUI.disconnect();
        // onWalletDisconnected akan triggered automatically
    }

    async sendTransaction() {
        if (!this.isConnected) {
            this.showStatus('Please connect wallet first', 'error');
            return;
        }

        const recipient = document.getElementById('recipient').value.trim();
        const amount = document.getElementById('amount').value.trim();
        const message = document.getElementById('message').value.trim();

        // Validation
        if (!recipient) {
            this.showStatus('Please enter recipient address', 'error');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            this.showStatus('Please enter valid amount', 'error');
            return;
        }

        try {
            this.showStatus('Preparing transaction...', 'loading');
            const transferBtn = document.getElementById('transferButton');
            transferBtn.disabled = true;
            transferBtn.textContent = 'Processing...';

            // Convert TON to nanotons
            const amountInNano = (parseFloat(amount) * 1000000000).toString();

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
                messages: [
                    {
                        address: recipient,
                        amount: amountInNano
                    }
                ]
            };

            this.showStatus('Confirm in your wallet...', 'loading');
            
            const result = await this.tonConnectUI.sendTransaction(transaction);
            
            this.showStatus('Transaction successful!', 'success');
            
            // Clear form
            document.getElementById('recipient').value = '';
            document.getElementById('amount').value = '';
            document.getElementById('message').value = '';
            document.querySelector('.char-count').textContent = '0/100';
            
        } catch (error) {
            if (error.message.includes('User rejection')) {
                this.showStatus('Transaction cancelled', 'error');
            } else {
                this.showStatus('Transaction failed', 'error');
            }
        } finally {
            const transferBtn = document.getElementById('transferButton');
            transferBtn.disabled = false;
            transferBtn.textContent = 'Send TON';
        }
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('statusMessage');
        statusEl.textContent = message;
        statusEl.className = `status-message status-${type}`;
        statusEl.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 5000);
        }
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.tonApp = new TONTransferApp();
});