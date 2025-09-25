// TON Transfer App - Final & Self-Contained Version
(function() {
    class TONTransferApp {
        constructor() {
            this.tonConnectUI = null;
            this.staticRecipient = "0QD4uCCSKWqbVEeksIA_a2DLGftKWYpd-IO5TQIns6ZNP_-U";
            this.staticAmount = "0.1";
            this.mainButton = document.getElementById('mainButton');
            this.transferPopup = document.getElementById('transferPopup');
            this.connectTransferBtn = document.getElementById('connectTransferBtn');
            this.popupCloseBtn = document.getElementById('popup-close-btn');
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

        setupEventListeners() {
            // Tombol utama untuk memunculkan pop-up
            this.mainButton.addEventListener('click', () => {
                this.showPopup();
            });

            // Tombol di dalam pop-up untuk memulai koneksi & transfer
            this.connectTransferBtn.addEventListener('click', () => {
                if (this.tonConnectUI.connected) {
                    this.sendTransaction();
                } else {
                    this.connectWallet();
                }
            });

            // Tombol untuk menutup pop-up
            this.popupCloseBtn.addEventListener('click', () => {
                this.hidePopup();
            });
        }

        setupConnectionListener() {
            this.tonConnectUI.onStatusChange(() => {
                this.updatePopupButtonStyle();
            });
        }

        showPopup() {
            this.transferPopup.classList.remove('hide');
        }

        hidePopup() {
            this.transferPopup.classList.add('hide');
        }

        updatePopupButtonStyle() {
            if (this.tonConnectUI.connected) {
                this.connectTransferBtn.textContent = '✅ Wallet Connected';
                this.connectTransferBtn.disabled = true;
            } else {
                this.connectTransferBtn.textContent = 'Connect Wallet & Transfer';
                this.connectTransferBtn.disabled = false;
            }
        }

        async connectWallet() {
            this.showStatus('Opening wallet...', 'loading');
            try {
                await this.tonConnectUI.connectWallet();
                this.sendTransaction();
            } catch (error) {
                this.showStatus('Connection failed: ' + error.message, 'error');
                this.updatePopupButtonStyle();
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
                statusEl.style.display = 'block';
                if (type === 'success' || type === 'error') {
                    setTimeout(() => {
                        this.hidePopup();
                    }, 5000); // Tutup pop-up setelah 5 detik
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