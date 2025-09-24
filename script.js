// TON Transfer App - The Final Robust Version with Event Delegation
(function() {
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
                // Tidak perlu lagi mencari tombol di sini, kita akan gunakan event delegation
                this.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                    manifestUrl: window.location.origin + '/ton-simple-html/tonconnect-manifest.json'
                });

                this.setupEventListeners();
                this.setupConnectionListener();
                
                // PANGGIL INI UNTUK MEMPERBARUI STATUS TOMBOL AWAL SAAT DIMUAT
                this.updateMainButtonState(); 
                
                console.log('TON Connect UI initialized successfully');
            } catch (error) {
                console.error('Failed to initialize TON Connect:', error);
                this.showStatus('Failed to initialize wallet connection', 'error');
            }
        }

        setupEventListeners() {
            // Gunakan event delegation pada body untuk menangkap klik tombol
            document.body.addEventListener('click', (event) => {
                if (event.target.id === 'mainButton') {
                    if (this.tonConnectUI.connected) {
                        this.disconnectWallet();
                    } else {
                        this.connectWallet();
                    }
                }
            });
        }

        setupConnectionListener() {
            this.tonConnectUI.onStatusChange(() => {
                this.updateMainButtonState();
            });
        }

        updateMainButtonState() {
            // Pastikan tombol ada sebelum mencoba memperbarui statusnya
            this.mainButton = document.getElementById('mainButton');
            if (this.mainButton) {
                if (this.tonConnectUI.connected) {
                    this.mainButton.textContent = '✅ Connected';
                    this.mainButton.className = 'btn btn-success btn-block';
                } else {
                    this.mainButton.textContent = 'Connect Wallet & Transfer';
                    this.mainButton.className = 'btn btn-primary btn-block';
                }
            }
        }

        async connectWallet() {
            this.showStatus('Opening wallet...', 'loading');
            try {
                await this.tonConnectUI.connectWallet();
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