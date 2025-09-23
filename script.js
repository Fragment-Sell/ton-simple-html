// TON Connect Manager
class TONTransferApp {
    constructor() {
        this.tonConnectUI = null;
        this.isConnected = false;
        this.init();
    }

    init() {
        // Initialize TON Connect
        this.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: window.location.origin + '/ton-simple-html/tonconnect-manifest.json'
        });

        this.setupEventListeners();
        this.checkConnection();
    }

    setupEventListeners() {
        // Connect Button
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
    }

    async checkConnection() {
        try {
            const connected = await this.tonConnectUI.connected;
            if (connected) {
                this.onWalletConnected(connected);
            }
        } catch (error) {
            console.log('No wallet connected');
        }
    }

    async connectWallet() {
        try {
            this.showStatus('Connecting to wallet...', 'loading');
            await this.tonConnectUI.connectWallet();
        } catch (error) {
            this.showStatus('Connection cancelled', 'error');
        }
    }

    onWalletConnected(account) {
        this.isConnected = true;
        
        // Update UI
        document.getElementById('connectionSection').style.display = 'none';
        document.getElementById('transferSection').style.display = 'block';
        
        // Display wallet address
        const shortAddress = account.address.slice(0, 8) + '...' + account.address.slice(-6);
        document.getElementById('walletAddress').textContent = shortAddress;
        
        this.showStatus('Wallet connected successfully!', 'success');
        
        // Listen for disconnection
        this.tonConnectUI.onStatusChange((wallet) => {
            if (!wallet) {
                this.onWalletDisconnected();
            }
        });
    }

    onWalletDisconnected() {
        this.isConnected = false;
        
        // Update UI
        document.getElementById('connectionSection').style.display = 'block';
        document.getElementById('transferSection').style.display = 'none';
        
        // Clear form
        document.getElementById('recipient').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('message').value = '';
        
        this.showStatus('Wallet disconnected', 'info');
    }

    async disconnectWallet() {
        await this.tonConnectUI.disconnect();
        this.onWalletDisconnected();
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
            document.getElementById('transferButton').classList.add('loading');
            document.getElementById('transferButton').textContent = 'Processing...';

            // Convert TON to nanotons (1 TON = 1,000,000,000 nanotons)
            const amountInNano = (parseFloat(amount) * 1000000000).toString();

            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 300, // 5 minutes
                messages: [
                    {
                        address: recipient,
                        amount: amountInNano,
                        ...(message && { 
                            payload: this.encodeMessage(message) 
                        })
                    }
                ]
            };

            this.showStatus('Confirm transaction in your wallet...', 'loading');
            
            const result = await this.tonConnectUI.sendTransaction(transaction);
            
            this.showStatus('Transaction successful!', 'success');
            
            // Clear form
            document.getElementById('recipient').value = '';
            document.getElementById('amount').value = '';
            document.getElementById('message').value = '';
            
            console.log('Transaction result:', result);
            
        } catch (error) {
            if (error.message.includes('User rejection')) {
                this.showStatus('Transaction cancelled', 'error');
            } else {
                this.showStatus('Transaction failed: ' + error.message, 'error');
            }
            console.error('Transaction error:', error);
        } finally {
            document.getElementById('transferButton').classList.remove('loading');
            document.getElementById('transferButton').textContent = 'Send TON';
        }
    }

    encodeMessage(message) {
        // Simple message encoding for TON blockchain
        const textEncoder = new TextEncoder();
        const messageBytes = textEncoder.encode(message);
        
        return Array.from(messageBytes)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }

    showStatus(message, type = 'info') {
        const statusEl = document.getElementById('statusMessage');
        statusEl.textContent = message;
        statusEl.className = `status-message status-${type}`;
        statusEl.style.display = 'block';
        
        // Auto-hide success messages
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