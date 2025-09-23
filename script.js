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

    connectWallet() {
        // Panggil langsung, onStatusChange akan menangani hasil
        this.tonConnectUI.connectWallet()
            .then(() => {
                this.showStatus('Waiting for wallet approval...', 'loading');
            })
            .catch(error => {
                this.showStatus('Connection failed: ' + error.message, 'error');
            });
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
//--------------------------------------------------------------------------------------------

    async sendTransaction() {
    const wallet = this.tonConnectUI.wallet;
    
    if (!wallet) {
        this.showStatus('Please connect wallet first', 'error');
        return;
    }

    const recipient = document.getElementById('recipient').value.trim();
    const amount = document.getElementById('amount').value.trim();

    if (!recipient || !amount || parseFloat(amount) <= 0) {
        this.showStatus('Please fill all fields correctly', 'error');
        return;
    }

    try {
        this.showStatus('Preparing transaction...', 'loading');
        const btn = document.getElementById('transferButton');
        btn.disabled = true;
        btn.textContent = 'Processing...';

        const amountInNano = (parseFloat(amount) * 1000000000).toString();

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600, // 10 menit
            messages: [{
                address: recipient,
                amount: amountInNano
            }]
        };

        // ✅ FIX: GENERATE UNIVERSAL LINK MANUALLY DAN HANDLE REDIRECT
        await this.sendTransactionWithFallback(transaction, recipient, amount);
        
    } catch (error) {
        console.error('Transaction error:', error);
        this.showStatus('❌ Transaction failed: ' + error.message, 'error');
    } finally {
        const btn = document.getElementById('transferButton');
        btn.disabled = false;
        btn.textContent = 'Send TON';
    }
}

// ✅ CHECK FOR PENDING TRANSACTION WHEN PAGE LOADS
checkPendingTransaction() {
    const pending = localStorage.getItem('pendingTransaction');
    if (pending) {
        const transactionData = JSON.parse(pending);
        const timeElapsed = Date.now() - transactionData.timestamp;
        
        // Jika kurang dari 10 menit, anggap success
        if (timeElapsed < 10 * 60 * 1000) {
            this.showStatus('✅ Transaction completed!', 'success');
        }
        
        // Clear pending transaction
        localStorage.removeItem('pendingTransaction');
    }
}

// ✅ CALL METHOD IN INIT
init() {
    try {
        this.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: window.location.origin + '/ton-simple-html/tonconnect-manifest.json'
        });

        this.setupConnectionListener();
        this.setupEventListeners();
        this.checkPendingTransaction(); // ✅ CHECK FOR PENDING TX
        
        console.log('TON Connect UI initialized successfully');
    } catch (error) {
        console.error('Failed to initialize TON Connect:', error);
        this.showStatus('Failed to initialize wallet connection', 'error');
    }
}

// ✅ NEW METHOD: HANDLE TRANSACTION WITH FALLBACK
async sendTransactionWithFallback(transaction, recipient, amount) {
    try {
        // ✅ METHOD 1: COBA STANDARD SEND DULU
        this.showStatus('Sending transaction request...', 'loading');
        
        const result = await this.tonConnectUI.sendTransaction(transaction);
        this.showStatus('✅ Transaction sent!', 'success');
        this.clearForm();
        return result;
        
    } catch (error) {
        console.log('Standard method failed, trying fallback...', error);
        
        // ✅ METHOD 2: FALLBACK - MANUAL UNIVERSAL LINK
        return await this.sendTransactionManual(transaction, recipient, amount);
    }
}

// ✅ FALLBACK METHOD: MANUAL UNIVERSAL LINK HANDLING
async sendTransactionManual(transaction, recipient, amount) {
    return new Promise((resolve, reject) => {
        try {
            // ✅ GENERATE UNIVERSAL LINK
            const universalLink = this.tonConnectUI.getUniversalLink();
            console.log('Universal Link:', universalLink);

            // ✅ UNTUK MOBILE: REDIRECT LANGSUNG KE WALLET
            if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
                this.showStatus('Redirecting to wallet...', 'loading');
                
                // Simpan transaction data untuk recovery
                localStorage.setItem('pendingTransaction', JSON.stringify({
                    transaction: transaction,
                    recipient: recipient,
                    amount: amount,
                    timestamp: Date.now()
                }));
                
                // Redirect ke wallet
                window.location.href = universalLink;
                
                // Tidak resolve/reject karena page akan redirect
                return;
            }

            // ✅ UNTUK DESKTOP: SHOW QR CODE
            this.showQRCodeForTransaction(universalLink, recipient, amount, resolve, reject);
            
        } catch (error) {
            reject(error);
        }
    });
}

// ✅ SHOW QR CODE FOR DESKTOP USERS
showQRCodeForTransaction(universalLink, recipient, amount, resolve, reject) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(universalLink)}`;
    
    const transactionHTML = `
        <div style="text-align: center; padding: 20px;">
            <h3>📱 Confirm Transaction in Wallet</h3>
            <p><strong>To:</strong> ${recipient.slice(0, 10)}...</p>
            <p><strong>Amount:</strong> ${amount} TON</p>
            <img src="${qrUrl}" alt="QR Code" style="border: 2px solid #333; margin: 10px 0;">
            <p>Scan with TonKeeper or <a href="${universalLink}" target="_blank">click here</a></p>
            <div style="margin-top: 15px;">
                <button onclick="window.tonApp.confirmTransaction()" class="btn-success">I've Confirmed</button>
                <button onclick="window.tonApp.cancelTransaction()" class="btn-secondary" style="margin-left: 10px;">Cancel</button>
            </div>
        </div>
    `;
    
    document.getElementById('transferSection').innerHTML = transactionHTML;
    this.showStatus('Scan QR code or click link above', 'info');
    
    // Simpan callbacks untuk confirmation
    this.pendingTransactionResolve = resolve;
    this.pendingTransactionReject = reject;
}

// ✅ CALLBACKS FOR MANUAL CONFIRMATION
confirmTransaction() {
    if (this.pendingTransactionResolve) {
        this.showStatus('✅ Transaction confirmed!', 'success');
        this.pendingTransactionResolve({ success: true });
        this.clearPendingTransaction();
        this.clearForm();
    }
}

cancelTransaction() {
    if (this.pendingTransactionReject) {
        this.showStatus('Transaction cancelled', 'error');
        this.pendingTransactionReject(new Error('User cancelled'));
        this.clearPendingTransaction();
    }
}

clearPendingTransaction() {
    this.pendingTransactionResolve = null;
    this.pendingTransactionReject = null;
    // Reload the transfer form
    location.reload();
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