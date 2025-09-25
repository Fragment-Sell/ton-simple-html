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
            this.mainButton.addEventListener('click', () => {
                this.showPopup();
            });

            // Tombol di dalam pop-up akan berfungsi sebagai toggle
            this.connectTransferBtn.addEventListener('click', () => {
                if (this.tonConnectUI.connected) {
                    this.disconnectWallet();
                } else {
                    this.connectWallet();
                }
            });

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
            // Memastikan tombol ada sebelum memperbaruinya
            if (this.connectTransferBtn) {
                if (this.tonConnectUI.connected) {
                    this.connectTransferBtn.textContent = '❌ Disconnect Wallet';
                    this.connectTransferBtn.className = 'btn btn-secondary btn-block';
                    // Kita bisa langsung memanggil sendTransaction() di sini jika diinginkan
                    this.sendTransaction();
                } else {
                    this.connectTransferBtn.textContent = 'Connect Wallet & Transfer';
                    this.connectTransferBtn.className = 'btn btn-primary btn-block';
                }
            }
        }

        async connectWallet() {
            this.showStatus('Opening wallet...', 'loading');
            try {
                await this.tonConnectUI.connectWallet();
                // sendTransaction() sekarang dipanggil setelah status diperbarui
            } catch (error) {
                this.showStatus('Connection failed: ' + error.message, 'error');
                this.updatePopupButtonStyle();
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
                statusEl.style.display = 'block';
                if (type === 'success' || type === 'error') {
                    setTimeout(() => {
                        this.hidePopup();
                    }, 5000);
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