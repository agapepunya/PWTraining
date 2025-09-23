
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz64E_HloYJ8iRTvDBGm5yAAtFBIGZjI_H0gZ9NWTFU-nw7V63Xt1BtRJ1f8elYrw/exec"; 



document.addEventListener('DOMContentLoaded', () => {
    // Jalankan fungsi hanya jika elemen yang relevan ada di halaman saat ini
    if (document.getElementById('training-cards-container')) {
        loadInitialData();
    }
    
    // Tambahkan footer ke setiap halaman
    injectFooter();

    // Tambahkan event listener untuk input pencarian jika ada
    const trainingSearchInput = document.getElementById('trainingSearchInput');
    if (trainingSearchInput) {
        trainingSearchInput.addEventListener('keyup', filterTrainings);
    }
    
    const newsSearchInput = document.getElementById('newsSearchInput');
    if (newsSearchInput) {
        newsSearchInput.addEventListener('keyup', filterNews);
    }
});

// Fungsi untuk memuat data awal di Halaman Utama
function loadInitialData() {
    fetch(`${SCRIPT_URL}?action=getInitialData`)
        .then(response => response.json())
        .then(data => {
            const trainingContainer = document.getElementById('training-cards-container');
            const newsContainer = document.getElementById('news-list-container');

            // Muat Kartu Training (Tidak ada perubahan di sini jika sudah berfungsi)
            data.trainings.forEach(training => {
                const card = `
                    <div class="card">
                        <img src="${training.URL_Gambar_Training}" alt="${training.NamaTraining}">
                        <div class="card-content">
                            <h3>${training.NamaTraining}</h3>
                            <p>${training.Deskripsi.substring(0, 100)}...</p>
                        </div>
                    </div>`;
                trainingContainer.innerHTML += card;
            });

            // Muat Daftar Berita (Disesuaikan untuk gambar)
            newsContainer.innerHTML = ''; // Pastikan container kosong sebelum mengisi
            data.news.forEach(news => {
                const item = `
                    <div class="news-item">
                        <img src="${news.URL_Gambar_Berita}" alt="${news.JudulBerita}">
                        <div class="news-item-content">
                            <h3>${news.JudulBerita}</h3>
                            <p>${new Date(news.TanggalPublikasi).toLocaleDateString()}</p>
                            <p>${news.IsiBerita.substring(0, 150)}...</p>
                        </div>
                    </div>`;
                newsContainer.innerHTML += item;
            });
        })
        .catch(error => console.error('Error fetching initial data:', error));
}

// Fungsi untuk melakukan pencarian
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

// Fungsi untuk memuat detail peserta di halaman detail.html
function loadParticipantDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const participantId = urlParams.get('id');

    if (!participantId) {
        document.getElementById('participant-details-container').innerHTML = '<p>ID Peserta tidak valid.</p>';
        return;
    }

    fetch(`${SCRIPT_URL}?action=getParticipantDetails&id=${participantId}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('participant-details-container').innerHTML = `<p>${data.error}</p>`;
                return;
            }

            const container = document.getElementById('participant-details-container');
            let content = `
                <div class="participant-header">
                    <img src="${data.url_foto_profil}" alt="Foto Profil">
                    <h2>${data.nama_lengkap}</h2>
                </div>
            `;

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
                            <iframe src="${training.url_pdf}"></iframe>
                            <a href="${training.url_pdf}" target="_blank">Download/Lihat Fullscreen</a>
                        </div>
                    </div>`;
            });

            container.innerHTML = content;
        })
        .catch(error => console.error('Error fetching participant details:', error));
}


// Fungsi untuk memuat semua training di halaman trainings.html
function loadAllTrainings() {
    const container = document.getElementById('all-trainings-container');
    container.innerHTML = '<p>Memuat data training...</p>';
    fetch(`${SCRIPT_URL}?action=getAllTrainings`)
        .then(response => response.json())
        .then(data => {
            container.innerHTML = '';
            data.forEach(training => {
                const card = `
                    <div class="card training-card" data-title="${training.NamaTraining.toLowerCase()}">
                        <img src="${training.URL_Gambar_Training}" alt="${training.NamaTraining}">
                        <div class="card-content">
                            <h3>${training.NamaTraining}</h3>
                            <p>${training.Deskripsi}</p>
                        </div>
                    </div>`;
                container.innerHTML += card;
            });
        })
        .catch(error => console.error('Error fetching all trainings:', error));
}


// Fungsi untuk memuat semua berita di halaman news.html
function loadAllNews() {
    const container = document.getElementById('all-news-container');
    container.innerHTML = '<p>Memuat berita...</p>';
    fetch(`${SCRIPT_URL}?action=getAllNews`)
        .then(response => response.json())
        .then(data => {
            container.innerHTML = '';
             data.sort((a, b) => new Date(b.TanggalPublikasi) - new Date(a.TanggalPublikasi));
            data.forEach(news => {
                const item = `
                    <div class="news-item" data-title="${news.JudulBerita.toLowerCase()}">
                        <img src="${news.URL_Gambar_Berita}" alt="${news.JudulBerita}">
                        <div class="news-item-content">
                            <h3>${news.JudulBerita}</h3>
                            <p>${new Date(news.TanggalPublikasi).toLocaleDateString()}</p>
                            <p>${news.IsiBerita}</p>
                        </div>
                    </div>`;
                container.innerHTML += item;
            });
        })
        .catch(error => console.error('Error fetching all news:', error));
}

// Fungsi filter untuk pencarian di halaman training
function filterTrainings() {
    const query = document.getElementById('trainingSearchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.training-card');
    cards.forEach(card => {
        if (card.dataset.title.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Fungsi filter untuk pencarian di halaman berita
function filterNews() {
    const query = document.getElementById('newsSearchInput').value.toLowerCase();
    const items = document.querySelectorAll('.news-item');
    items.forEach(item => {
        if (item.dataset.title.includes(query)) {
            item.style.display = 'block';
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
            <p><strong>Alamat:</strong> Jl. Contoh No. 123, Jakarta, Indonesia</p>
            <p><strong>Email:</strong> info@perusahaan.com</p>
            <p><strong>Telepon:</strong> (021) 123-4567</p>
        </div>
        <div class="footer-section contact-form">
            <h4>Kirim Pesan</h4>
            <form action="#" method="POST">
                <input type="email" name="email" placeholder="Email Anda...">
                <textarea name="message" rows="4" placeholder="Pesan Anda..."></textarea>
                <button type="submit">Kirim</button>
            </form>
        </div>
        <div class="footer-section links">
            <h4>Hubungi Kami</h4>
            <a href="https://wa.me/6281234567890?text=Halo,%20saya%20tertarik%20dengan%20training%20Anda." class="whatsapp-btn" target="_blank">Hubungi via WhatsApp</a>
        </div>
    </div>
    `;
    const footers = document.querySelectorAll('footer');
    footers.forEach(footer => {
        footer.innerHTML = footerHTML;
    });

}
