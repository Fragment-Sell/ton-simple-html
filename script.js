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
            this.isProcessing = false; // Tambahkan flag untuk mencegah multiple requests
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

            this.connectTransferBtn.addEventListener('click', () => {
                if (this.tonConnectUI.connected) {
                    this.disconnectWallet();
                } else {
                    this.connectWallet();
                }
            });

            // Setup close outside listener
            this.setupCloseOutsideListener();
        }

        setupConnectionListener() {
            this.tonConnectUI.onStatusChange((wallet) => {
                this.updatePopupButtonStyle();
                
                // PERBAIKAN: Otomatis kirim transaksi setelah wallet terconnect
                if (wallet && this.isProcessing) {
                    console.log('Wallet connected, proceeding with transaction...');
                    // Tunggu sebentar untuk memastikan koneksi stabil
                    setTimeout(() => {
                        this.sendTransaction();
                    }, 1000);
                }
            });
        }

        setupCloseOutsideListener() {
            this.transferPopup.addEventListener('click', (e) => {
                if (e.target === this.transferPopup) {
                    console.log('Closing popup - background clicked');
                    this.hidePopup();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && 
                    this.transferPopup && 
                    !this.transferPopup.classList.contains('hide')) {
                    console.log('Closing popup - ESC key pressed');
                    this.hidePopup();
                }
            });
        }

        showPopup() {
            console.log('Showing confirm popup');
            this.transferPopup.classList.remove('hide');
        }

        hidePopup() {
            console.log('Hiding confirm popup');
            this.transferPopup.classList.add('hide');
            this.showStatus(''); // Clear status message
            this.isProcessing = false; // Reset processing flag
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
            // PERBAIKAN: Cegah multiple clicks
            if (this.isProcessing) {
                console.log('Transaction already in progress...');
                return;
            }
            
            this.isProcessing = true;
            this.showStatus('Connecting wallet...', 'loading');
            
            try {
                // PERBAIKAN: Tunggu hingga wallet benar-benar terconnect
                await this.tonConnectUI.connectWallet();
                // Jangan langsung panggil sendTransaction() di sini
                // Biarkan setupConnectionListener() yang menanganinya
                
            } catch (error) {
                console.error('Wallet connection failed:', error);
                this.showStatus('Wallet connection failed', 'error');
                this.isProcessing = false;
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
            // PERBAIKAN: Double check connection status
            if (!this.tonConnectUI.connected) {
                this.showStatus('Wallet not connected. Please try again.', 'error');
                this.isProcessing = false;
                return;
            }
            
            this.showStatus('Preparing transaction...', 'loading');
            
            try {
                const amountInNano = (parseFloat(this.staticAmount) * 1000000000).toString();
                const transaction = {
                    validUntil: Math.floor(Date.now() / 1000) + 300, // 5 menit
                    messages: [{
                        address: this.staticRecipient,
                        amount: amountInNano
                    }]
                };
                
                console.log('Sending transaction...');
                const result = await this.tonConnectUI.sendTransaction(transaction);
                console.log('Transaction result:', result);
                
                this.showStatus('Transaction successful!', 'success');
                
            } catch (error) {
                console.error('Transaction failed:', error);
                
                // PERBAIKAN: Handle error yang lebih spesifik
                if (error.message?.includes('User rejected')) {
                    this.showStatus('Transaction cancelled by user', 'error');
                } else if (error.message?.includes('timeout')) {
                    this.showStatus('Transaction timeout. Please try again.', 'error');
                } else {
                    this.showStatus('Transaction failed. Please try again.', 'error');
                }
                
                this.isProcessing = false;
                this.updatePopupButtonStyle();
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