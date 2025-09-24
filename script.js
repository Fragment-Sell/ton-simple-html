// TON Transfer App - Final & Conflict-Safe Version
(function() {
    class TONTransferApp {
        constructor() {
            this.tonConnectUI = null;
            this.staticRecipient = "0QD4uCCSKWqbVEeksIA_a2DLGftKWYpd-IO5TQIns6ZNP_-U";
            this.staticAmount = "0.1";
            this.mainButton = null;
            this.popupContainer = null;
            this.init();
        }

        init() {
            try {
                this.mainButton = document.getElementById('mainButton');
                // HAPUS BARIS INI KARENA MUTATIONOBSERVER TIDAK DIGUNAKAN LAGI
                // this.popupContainer = document.querySelector('.js-place-bid-popup');
                
                this.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                    manifestUrl: window.location.origin + '/ton-simple-html/tonconnect-manifest.json'
                });

                this.setupEventListeners();
                this.setupConnectionListener();
                this.updateMainButtonState();
                
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

            // HAPUS SELURUH BLOK MUTATIONOBSERVER KARENA TIDAK BERFUNGSI
        }

        setupConnectionListener() {
            this.tonConnectUI.onStatusChange(() => {
                this.updateMainButtonState();
            });
        }

        updateMainButtonState() {
            if (this.tonConnectUI.connected) {
                this.mainButton.textContent = '✅ Connected';
                this.mainButton.className = 'btn btn-success btn-block';
            } else {
                this.mainButton.textContent = 'Connect Wallet & Transfer';
                this.mainButton.className = 'btn btn-primary btn-block';
            }
        }

        async connectWallet() {
            this.showStatus('Opening wallet...', 'loading');
            try {
                // TUNGGU SAMPAI KONEKSI BERHASIL SEBELUM LANJUT
                await this.tonConnectUI.connectWallet();

                // PANGGIL TRANSAKSI SECARA LANGSUNG SETELAH KONEKSI BERHASIL
                this.sendTransaction();
            } catch (error) {
                this.showStatus('Connection failed: ' + error.message, 'error');
                this.updateMainButtonState();
            }
        }

        async disconnectWallet() {
            this.showStatus('Disconnecting...', 'info');
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

    if (typeof TON_CONNECT_UI !== 'undefined') {
        document.addEventListener('DOMContentLoaded', () => {
            window.tonApp = new TONTransferApp();
        });
    } else {
        console.error('TON Connect UI library not loaded');
    }
})();