
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwSU5plB2ptvnSPkf4907RCpBkwd3y7CrsIjgqGXgLKsAIfmP_cyD69FfhvdSvMNTln/exec"; 

document.addEventListener("DOMContentLoaded", () => {
    // Logika untuk Halaman Utama (index.html)
    if (document.getElementById('ourTraining')) {
        loadTraining(3); // Memuat 3 training terbaru
    }
    if (document.getElementById('latestNews')) {
        loadNews(3); // Memuat 3 berita terbaru
    }

    // Logika untuk halaman semua training (trainings.html)
    if (document.getElementById('allTrainingPage')) {
        loadTraining(); // Memuat SEMUA training
    }

    // Logika untuk halaman semua berita (news.html)
    if (document.getElementById('allNewsPage')) {
        loadNews(); // Memuat SEMUA berita
    }
    
    // Logika untuk halaman detail
    if (document.getElementById('detail-content')) {
        loadParticipantDetails();
    }

    // Event listener untuk pencarian di halaman utama
    const searchButton = document.querySelector('.search-container button');
    if (searchButton && searchButton.onclick === null) { // Cek jika onclick belum diatur di HTML
         searchButton.addEventListener('click', searchData);
    }
    
    // Event listener untuk filter di halaman training
    const trainingSearchInput = document.getElementById('trainingSearchInput');
    if (trainingSearchInput) {
        trainingSearchInput.addEventListener('keyup', filterItems);
    }

    // Event listener untuk filter di halaman berita
    const newsSearchInput = document.getElementById('newsSearchInput');
    if (newsSearchInput) {
        newsSearchInput.addEventListener('keyup', filterItems);
    }

    // Selalu tambahkan footer di setiap halaman
    injectFooter();
});

// Fungsi terpusat untuk fetch data
async function fetchData(action) {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=${action}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${action}:`, error);
        return []; // Kembalikan array kosong jika error
    }
}

// Fungsi untuk melakukan pencarian peserta
function searchData() {
    const query = document.getElementById('searchInput').value;
    if (query.length < 3) {
        alert("Masukkan minimal 3 karakter untuk pencarian.");
        return;
    }

    const resultsContainer = document.getElementById('search-results-container');
    const initialContent = document.getElementById('initial-content');
    const tableBody = document.querySelector('#resultsTable tbody');

    tableBody.innerHTML = '<tr><td colspan="3">Mencari...</td></tr>';
    resultsContainer.classList.remove('hidden');
    initialContent.style.display = 'none';

    fetch(`${SCRIPT_URL}?action=search&query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            tableBody.innerHTML = '';
            if (data.length > 0) {
                data.forEach(item => {
                    const row = `
                        <tr>
                            <td>${item.nama_lengkap}</td>
                            <td>${item.nama_training}</td>
                            <td><a href="detail.html?id=${item.id_peserta}" class="detail-btn">Lihat Detail</a></td>
                        </tr>`;
                    tableBody.innerHTML += row;
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="3">Data tidak ditemukan.</td></tr>';
            }
        })
        .catch(error => {
            console.error('Error during search:', error);
            tableBody.innerHTML = '<tr><td colspan="3">Terjadi kesalahan saat mencari.</td></tr>';
        });
}



function loadParticipantDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const participantId = urlParams.get('id');
    const container = document.getElementById('participant-details-container');

    if (!participantId) {
        container.innerHTML = '<p>ID Peserta tidak valid.</p>';
        return;
    }
    
    container.innerHTML = '<p>Memuat detail peserta...</p>';

    fetch(`${SCRIPT_URL}?action=getParticipantDetails&id=${participantId}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                container.innerHTML = `<p>${data.error}</p>`;
                return;
            }

            let content = `
                <div class="participant-header">
                    <img src="${data.url_foto_profil}" alt="Foto Profil">
                    <div class="participant-info">
                        <h2>${data.nama_lengkap}</h2>
                        <div class="participant-contact">
                            ${data.email && data.email !== 'N/A' ? `<p><strong>Email:</strong> ${data.email}</p>` : ''}
                            ${data.telepon && data.telepon !== 'N/A' ? `<p><strong>Telepon:</strong> ${data.telepon}</p>` : ''}
                        </div>
                    </div>
                </div>`;

            data.trainings.forEach((training, index) => {
                content += `
                    <div class="training-container">
                        <h3>Data Training ${index + 1}: ${training.nama_training}</h3>
                        <p><strong>Kode Sertifikat:</strong> ${training.kode_sertifikat}</p>
                        <h4>Dokumentasi Foto:</h4>
                        <div class="documentation-photos">
                            ${training.dokumentasi.map(url => `<img src="${url}" alt="Dokumentasi">`).join('')}
                        </div>
                        <div class="pdf-preview">
                            <h4>Sertifikat (PDF):</h4>
                            <iframe src="${training.url_pdf}" height="400"></iframe>
                            <a href="${training.url_pdf}" target="_blank">Download/Lihat Fullscreen</a>
                        </div>
                    </div>`;
            });
            container.innerHTML = content;
        })
        .catch(error => {
            console.error('Error fetching participant details:', error);
            container.innerHTML = '<p>Gagal memuat detail peserta.</p>';
        });
}

async function loadTraining(limit = null) {
    const container = document.getElementById('trainingContainer');
    if (!container) return;

    container.innerHTML = '<p>Memuat data training...</p>';
    const trainingData = await fetchData("getTraining");

    if (!trainingData || trainingData.length === 0) {
        container.innerHTML = '<p>Belum ada data training yang tersedia.</p>';
        return;
    }

    const itemsToDisplay = limit ? trainingData.slice(0, limit) : trainingData;

    container.innerHTML = ''; // Kosongkan container
    itemsToDisplay.forEach(item => {
        // Pastikan properti di sini (item.thumbnail, item.namatraining, dll.)
        // cocok dengan nama header di sheet Anda (setelah diubah ke huruf kecil)
        container.innerHTML += `
            <div class="card" data-title="${item.namatraining.toLowerCase()}">
                <img src="${item.thumbnail}" alt="${item.namatraining}" style="width:100%; height:180px; object-fit:cover;">
                <div class="card-content">
                  <h3>${item.namatraining}</h3>
                  <p>${item.deskripsi.substring(0, 100)}...</p>
                </div>
            </div>
        `;
    });
}

async function loadNews(limit = null) {
    const container = document.getElementById('newsContainer');
    if (!container) return;

    container.innerHTML = '<p>Memuat berita...</p>';
    const newsData = await fetchData("getBerita");

    if (!newsData || newsData.length === 0) {
        container.innerHTML = '<p>Belum ada berita yang tersedia.</p>';
        return;
    }

    const itemsToDisplay = limit ? newsData.slice(0, limit) : newsData;

    container.innerHTML = '';
    itemsToDisplay.forEach(item => {
        // Format tanggal agar lebih mudah dibaca
        const tgl = new Date(item.tanggalpublikasi).toLocaleDateString("id-ID", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Pastikan properti "item.url_gambar_berita" digunakan di sini
        container.innerHTML += `
            <div class="news-item" data-title="${item.judulberita.toLowerCase()}">
                 <img src="${item.url_gambar_berita}" alt="${item.judulberita}">
                 <div class="news-item-content">
                    <h3>${item.judulberita}</h3>
                    <p><small>Dipublikasikan pada: ${tgl}</small></p>
                    <p>${item.ringkasan}</p>
                 </div>
            </div>
        `;
    });
}

// Fungsi filter generik untuk halaman training dan berita
function filterItems() {
    const query = this.value.toLowerCase();
    const containerId = this.id === 'trainingSearchInput' ? '#allTrainingPage' : '#allNewsPage';
    const items = document.querySelectorAll(`${containerId} [data-title]`);
    
    items.forEach(item => {
        if (item.dataset.title.includes(query)) {
            item.style.display = 'flex'; // atau 'block' tergantung layout
        } else {
            item.style.display = 'none';
        }
    });
}


// Fungsi untuk menambahkan footer secara dinamis
function injectFooter() {
    const footerHTML = `
    <div class="footer-content">
        <div class="footer-section about">
            <h4>Informasi Kontak</h4>
            <p><strong>Alamat:</strong> Ruko gardenia, Blk. RF, Jl. Gardenia Raya No.09, RT.005/RW.002, Bojong Rawalumbu, Rawa Lumbu, Bekasi, West Java 17116</p>
            <p><strong>Email:</strong>sales@proworker.co.id</p>
            <p><strong>Telepon:</strong> +62 857 9775 7809</p>
        </div>
        <div class="footer-section links">
            <h4>Hubungi Whatsapp Kami</h4>
            <a href="https://wa.me/6287779104041?text=Halo,%20saya%20tertarik%20dengan%20training%20Anda." class="whatsapp-btn" target="_blank">Hubungi via WhatsApp</a>
        </div>
    </div>`;
    const footers = document.querySelectorAll('footer');
    footers.forEach(footer => {
        footer.innerHTML = footerHTML;
    });
}