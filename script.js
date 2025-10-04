
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw8dgHIW08lQYSv-Q2oYFkMiEkzKYwbGOQcPHzfq9gimElixcEuWZRPOgsUphPsoLzb/exec"; 

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

    if (document.getElementById('testimonials')) {
        loadTestimonials();
    }

    if (document.getElementById('detail-page-content')) {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        // Cek ID untuk menentukan fungsi mana yang dipanggil
        if (id && id.toLowerCase().includes('news')) {
            loadDetailBerita(id);
        } else if (id && id.toLowerCase().includes('tr')) { // asumsikan ID training mengandung 'TR'
            loadDetailTraining(id);
        }
    }
    
    loadPopup();
    // Selalu tambahkan footer di setiap halaman
    injectFooter();
});

async function loadPopup() {
    const settings = await fetchData("getPengaturan");

    if (settings.PopupStatus === 'ON' && settings.PopupImageURL) {
        const popupHTML = `
            <div class="popup-overlay" id="popupOverlay">
                <div class="popup-content">
                    <span class="popup-close" id="popupClose">&times;</span>
                    <a href="${settings.PopupLinkURL || '#'}" target="_blank">
                        <img src="${settings.PopupImageURL}" alt="Announcement">
                    </a>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', popupHTML);

        document.getElementById('popupClose').addEventListener('click', () => {
            document.getElementById('popupOverlay').remove();
        });
        document.getElementById('popupOverlay').addEventListener('click', (event) => {
            if(event.target === document.getElementById('popupOverlay')) {
                 document.getElementById('popupOverlay').remove();
            }
        });
    }
}   

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

// File: script.js
// Ganti fungsi loadTraining Anda dengan versi ini

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

    container.innerHTML = '';
    itemsToDisplay.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.setAttribute('data-title', item.judultraining.toLowerCase());
        
        // Menggunakan item.teks_1 || '' untuk memastikan tidak ada error jika sel kosong
        const deskripsiSingkat = (item.teks_1 || '').substring(0, 100);

        card.innerHTML = `
            <img src="${item.url_gambar_1}" alt="${item.judultraining}" style="width:100%; height:180px; object-fit:cover;">
            <div class="card-content">
              <h3>${item.judultraining}</h3> 
              <p>${deskripsiSingkat}...</p>
            </div>
        `;
        
        card.addEventListener('click', () => {
            window.location.href = `detail-training.html?id=${item.id_training}`;
        });
        
        container.appendChild(card);
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
    const card = document.createElement('div');
    card.className = 'news-item'; // atau 'card' untuk training
    card.setAttribute('data-title', item.judulberita.toLowerCase()); // atau item.judultraining

    card.innerHTML = `
         <img src="${item.url_gambar_berita || item.thumbnail}" alt="${item.judulberita}">
         <div class="news-item-content">
            <h3>${item.judulberita}</h3>
            <p><small>Dipublikasikan pada: ...</small></p>
            <p>${item.ringkasan}</p>
         </div>
    `;

    card.addEventListener('click', () => {
        window.location.href = `detail-berita.html?id=${item.id_berita}`; // atau detail-training.html
    });

    container.appendChild(card);
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

let slideIndex = 1;
let testimonialsData = [];

async function loadTestimonials() {
    // 1. Ambil pengaturan untuk background
    const settings = await fetchData("getPengaturan");
    if (settings.TestimoniBackground) {
        document.querySelector('.testimonial-bg').style.backgroundImage = `url(${settings.TestimoniBackground})`;
    }

    // 2. Ambil data testimoni
    testimonialsData = await fetchData("getTestimoni");
    const slider = document.querySelector('.testimonial-slider');
    const dotsContainer = document.querySelector('.testimonial-dots');

    if (testimonialsData.length > 0) {
        testimonialsData.forEach((testi, index) => {
            slider.innerHTML += `
                <div class="testimonial-item">
                    <p class="stars">★★★★★</p>
                    <p>"${testi.isitestimoni}"</p>
                    <p class="author">${testi.nama} / ${testi.jabatanperusahaan}</p>
                </div>
            `;
            dotsContainer.innerHTML += `<span class="dot" onclick="currentSlide(${index + 1})"></span>`;
        });

        // Tambahkan event listener untuk tombol next/prev
        document.querySelector('.prev').addEventListener('click', () => plusSlides(-1));
        document.querySelector('.next').addEventListener('click', () => plusSlides(1));

        showSlides(slideIndex);
    }
}

// Fungsi slider
function plusSlides(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  let i;
  let slides = document.getElementsByClassName("testimonial-item");
  let dots = document.getElementsByClassName("dot");
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";
  }
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";
  dots[slideIndex-1].className += " active";
}

async function loadDetailBerita(id) {
    const container = document.getElementById('detail-page-content');
    container.innerHTML = "<p>Memuat berita...</p>";
    const data = await fetchData(`getDetailBerita&id=${id}`);

    if (data.error) {
        container.innerHTML = `<p>${data.error}</p>`;
        return;
    }

    const article = data.main;
    const recommendations = data.recommendations;

    const tgl = new Date(article.tanggalpublikasi).toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' });

    let contentHTML = `
        <div class="detail-buttons">
            <a href="index.html" class="btn-back">&larr; Kembali</a>
            <a href="news.html" class="btn-see-others">Lihat Berita Lainnya &rarr;</a>
        </div>
        <div class="detail-header">
            <h1>${article.judulberita}</h1>
            <p class="detail-meta">Oleh ${article.author} | Dipublikasikan ${tgl}</p>
        </div>
        <img src="${article.url_gambar_1}" alt="${article.judulberita}" class="full-width-img">
        <div class="detail-content">
            <p>${article.teks_1.replace(/\n/g, '<br>')}</p>

            <div class="split-section">
                <div class="image-content">
                    <img src="${article.url_gambar_2}" alt="Ilustrasi 2">
                </div>
                <div class="text-content">
                    <p>${article.teks_2.replace(/\n/g, '<br>')}</p>
                </div>
            </div>

            <div class="split-section reverse">
                <div class="image-content">
                     <img src="${article.url_gambar_3}" alt="Ilustrasi 3">
                </div>
                <div class="text-content">
                    <p>${article.teks_3.replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        </div>
    `;

    // Tambahkan rekomendasi jika ada
    if(recommendations.length > 0) {
        contentHTML += `<div class="recommendations"><h3>Berita Lainnya</h3><div class="cards-container">`;
        recommendations.forEach(rec => {
            contentHTML += `
                <div class="card" onclick="window.location.href='detail-berita.html?id=${rec.id_berita}'">
                   <img src="${rec.thumbnail}" alt="${rec.judulberita}">
                   <div class="card-content">
                        <h3>${rec.judulberita}</h3>
                   </div>
                </div>
            `;
        });
        contentHTML += `</div></div>`;
    }

    container.innerHTML = contentHTML;
    generateFooter(); // Panggil footer secara manual
}

// Tambahkan fungsi ini di script.js Anda

async function loadDetailTraining(id) {
    const container = document.getElementById('detail-page-content');
    container.innerHTML = "<p>Memuat detail training...</p>";
    const data = await fetchData(`getDetailTraining&id=${id}`);

    if (data.error) {
        container.innerHTML = `<p>${data.error}</p>`;
        return;
    }
    
    const article = data.main;
    const recommendations = data.recommendations;

    let contentHTML = `
        <div class="detail-buttons">
            <a href="index.html" class="btn-back">&larr; Kembali</a>
            <a href="trainings.html" class="btn-see-others">Lihat Training Lainnya &rarr;</a>
        </div>
        <div class="detail-header">
            <h1>${article.judultraining}</h1>
        </div>
        <img src="${article.url_gambar_1}" alt="${article.judultraining}" class="full-width-img">
        <div class="detail-content">
            <p>${(article.teks_1 || '').replace(/\n/g, '<br>')}</p>
            
            <div class="split-section">
                <div class="image-content">
                    <img src="${article.url_gambar_2}" alt="Ilustrasi 2">
                </div>
                <div class="text-content">
                    <p>${(article.teks_2 || '').replace(/\n/g, '<br>')}</p>
                </div>
            </div>
            
            <div class="split-section reverse">
                <div class="image-content">
                     <img src="${article.url_gambar_3}" alt="Ilustrasi 3">
                </div>
                <div class="text-content">
                    <p>${(article.teks_3 || '').replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        </div>
    `;
    
    // Tambahkan rekomendasi jika ada
    if(recommendations.length > 0) {
        contentHTML += `<div class="recommendations"><h3>Training Lainnya</h3><div class="cards-container">`;
        recommendations.forEach(rec => {
            contentHTML += `
                <div class="card" onclick="window.location.href='detail-training.html?id=${rec.id_training}'">
                   <img src="${rec.thumbnail}" alt="${rec.judultraining}">
                   <div class="card-content">
                        <h3>${rec.judultraining}</h3>
                   </div>
                </div>
            `;
        });
        contentHTML += `</div></div>`;
    }

    container.innerHTML = contentHTML;
    injectFooter(); // Panggil footer secara manual (ganti dengan generateFooter jika itu nama fungsi Anda)
}

