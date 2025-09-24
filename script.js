// TON Transfer App - My Version: Simple & Robust



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

            this.mainButton = document.getElementById('mainButton');

            this.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({

                manifestUrl: window.location.origin + '/ton-simple-html/tonconnect-manifest.json'

            });



            // Panggil fungsi pembaruan UI saat pertama kali inisialisasi

            this.updateUI(); 

            this.setupEventListeners();

            this.setupConnectionListener();

            

            console.log('TON Connect UI initialized successfully');

        } catch (error) {

            console.error('Failed to initialize TON Connect:', error);

            this.showStatus('Failed to initialize wallet connection', 'error');

        }

    }



    setupConnectionListener() {

        // Listener ini sekarang hanya memanggil fungsi pembaruan UI

        this.tonConnectUI.onStatusChange(() => {

            console.log('Wallet status changed - updating UI');

            this.updateUI();

        });

    }



    setupEventListeners() {

        this.mainButton.addEventListener('click', () => {

            if (this.tonConnectUI.connected) {

                this.disconnectWallet();

            } else {

                this.connectWallet();

            }

        });

    }



    // Fungsi baru untuk memastikan UI selalu sesuai dengan status koneksi

    updateUI() {

        if (this.tonConnectUI.connected) {

            this.mainButton.textContent = '✅ Connected';

            this.mainButton.className = 'btn-success';

        } else {

            this.mainButton.textContent = 'Connect Wallet & Transfer';

            this.mainButton.className = 'btn-primary';

        }

    }



    async connectWallet() {

        try {

            this.showStatus('Opening wallet...', 'loading');

            await this.tonConnectUI.connectWallet();

            // Setelah terkoneksi, panggil fungsi pembaruan UI

            this.updateUI();

            this.sendTransaction();

        } catch (error) {

            this.showStatus('Connection failed: ' + error.message, 'error');

        }

    }



    async disconnectWallet() {

        try {

            await this.tonConnectUI.disconnect();

            // Setelah terputus, panggil fungsi pembaruan UI

            this.updateUI();

        } catch (error) {

            console.error('Disconnect error:', error);

        }

    }

    

    async sendTransaction() {

        this.showStatus('🔄 Preparing transaction...', 'loading');

        try {

            if (!this.tonConnectUI.connected) {

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



// Inisialisasi saat DOM siap

if (typeof TON_CONNECT_UI !== 'undefined') {

    document.addEventListener('DOMContentLoaded', () => {

        window.tonApp = new TONTransferApp();

    });

} else {

    console.error('TON Connect UI library not loaded');

}

