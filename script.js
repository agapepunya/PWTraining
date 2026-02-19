// File: script.js
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxjZerc7r4NX6VxHKeLn0VhJ0vJUXsmUq6GrzZI1Yc4pL-nCpoq8FPQqui6o150R1pu/exec";

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (document.getElementById('initial-content')) {
        loadTraining(3); loadNews(3); loadTestimonials(); loadPopup();
        document.querySelector('.search-container button')?.addEventListener('click', searchData);
    }
    if (document.getElementById('allTrainingPage')) loadTraining();
    if (document.getElementById('allNewsPage')) loadNews();
    if (document.getElementById('participant-details-container')) loadParticipantDetails();
    if (document.getElementById('detail-page-content')) {
        if (id?.toLowerCase().includes('news')) loadDetailBerita(id);
        else loadDetailTraining(id);
    }
    injectFooter();
});

async function fetchData(action) {
    try {
        const res = await fetch(`${SCRIPT_URL}?action=${action}`);
        return await res.json();
    } catch (e) { console.error(e); return []; }
}

async function loadParticipantDetails() {
    const container = document.getElementById('participant-details-container');
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;

    container.innerHTML = "<p>Memuat detail...</p>";
    const data = await fetchData(`getParticipantDetails&id=${id}`);

    if (data.error) { container.innerHTML = `<p>${data.error}</p>`; return; }

    // Mengambil nama menggunakan key yang sudah diproses (tanpa spasi/huruf kecil)
    const namaUser = data.namalengkap || data.nama_lengkap || 'Nama Tidak Tersedia';

    let html = `
        <div class="participant-header">
            <img src="${data.url_foto_profil || ''}" alt="Foto Profil">
            <div class="participant-info">
                <h2>${namaUser}</h2>
                <div class="participant-contact">
                    ${data.email && data.email !== 'N/A' ? `<p><strong>Email:</strong> ${data.email}</p>` : ''}
                    ${data.telepon && data.telepon !== 'N/A' ? `<p><strong>Telepon:</strong> ${data.telepon}</p>` : ''}
                </div>
            </div>
        </div>`;

    if (data.trainings) {
        data.trainings.forEach((t, index) => {
            html += `
                <div class="training-container">
                    <h3>Data Training ${index + 1}: ${t.nama_training}</h3>
                    <p><strong>Kode Sertifikat:</strong> ${t.kode_sertifikat}</p>
                    <div class="pdf-section">
                        <h4>Sertifikat (PDF):</h4>
                        <div class="pdf-actions">
                            <a href="${t.pdf.download}" class="btn-pdf download">Download PDF Asli</a>
                            <a href="${t.pdf.view}" target="_blank" class="btn-pdf fullscreen">Lihat Fullscreen</a>
                        </div>
                        <iframe src="${t.pdf.view}" class="pdf-iframe"></iframe>
                    </div>
                    <h4>Dokumentasi Foto:</h4>
                    <div class="documentation-photos">
                        ${t.dokumentasi.map(url => `<img src="${url}" alt="Dokumentasi">`).join('')}
                    </div>
                </div>`;
        });
    }
    container.innerHTML = html;
}

// Fungsi pendukung lainnya (loadTraining, loadNews, loadTestimonials, dll)
async function loadTraining(limit = null) {
    const container = document.getElementById('trainingContainer');
    if (!container) return;
    const data = await fetchData("getTraining");
    if (!data || data.length === 0) { container.innerHTML = '<p>Belum ada data.</p>'; return; }
    const items = limit ? data.slice(0, limit) : data;
    container.innerHTML = '';
    items.forEach(item => {
        if (item.judultraining) {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${item.url_gambar_1 || item.thumbnail}" alt="${item.judultraining}">
                <div class="card-content"><h3>${item.judultraining}</h3><p>${(item.teks_1 || '').substring(0, 100)}...</p></div>`;
            card.onclick = () => window.location.href = `detail-training.html?id=${item.id_training}`;
            container.appendChild(card);
        }
    });
}

async function loadNews(limit = null) {
    const container = document.getElementById('newsContainer');
    if (!container) return;
    const data = await fetchData("getBerita");
    if (!data || data.length === 0) { container.innerHTML = '<p>Belum ada berita.</p>'; return; }
    const items = limit ? data.slice(0, limit) : data;
    container.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'news-item';
        card.innerHTML = `
            <img src="${item.url_gambar_1}" alt="${item.judulberita}">
            <div class="news-item-content">
                <h3>${item.judulberita}</h3>
                <p><small>${new Date(item.tanggalpublikasi).toLocaleDateString("id-ID")}</small></p>
                <p>${item.ringkasan || ''}</p>
            </div>`;
        card.onclick = () => window.location.href = `detail-berita.html?id=${item.id_berita}`;
        container.appendChild(card);
    });
}

// Slider Testimoni
async function loadTestimonials() {
    const settings = await fetchData("getPengaturan");
    const bg = document.querySelector('.testimonial-bg');
    if (bg && settings.TestimoniBackground) bg.style.backgroundImage = `url(${settings.TestimoniBackground})`;

    const data = await fetchData("getTestimoni");
    const slider = document.querySelector('.testimonial-slider');
    const dots = document.querySelector('.testimonial-dots');
    if (!slider || !data.length) return;

    data.forEach((testi, i) => {
        slider.innerHTML += `
            <div class="testimonial-item">
                <div class="testimonial-content-wrapper">
                    <img src="${testi.url_foto}" class="testimonial-photo" alt="${testi.nama}">
                    <div class="testimonial-text-content">
                        <p>"${testi.isitestimoni}"</p>
                        <p class="author">${testi.nama} / ${testi.jabatanperusahaan}</p>
                    </div>
                </div>
            </div>`;
        dots.innerHTML += `<span class="dot" onclick="currentSlide(${i + 1})"></span>`;
    });
    document.querySelector('.prev')?.addEventListener('click', () => plusSlides(-1));
    document.querySelector('.next')?.addEventListener('click', () => plusSlides(1));
    showSlides(slideIndex);
}

function plusSlides(n) { showSlides(slideIndex += n); }
function currentSlide(n) { showSlides(slideIndex = n); }
function showSlides(n) {
    let s = document.getElementsByClassName("testimonial-item");
    let d = document.getElementsByClassName("dot");
    if (!s.length) return;
    if (n > s.length) slideIndex = 1;
    if (n < 1) slideIndex = s.length;
    for (let i = 0; i < s.length; i++) s[i].style.display = "none";
    for (let i = 0; i < d.length; i++) d[i].className = d[i].className.replace(" active", "");
    s[slideIndex-1].style.display = "block";
    if (d[slideIndex-1]) d[slideIndex-1].className += " active";
}

async function loadPopup() {
    const s = await fetchData("getPengaturan");
    if (s.PopupStatus === 'ON' && s.PopupImageURL) {
        document.body.insertAdjacentHTML('beforeend', `
            <div class="popup-overlay" id="popupOverlay">
                <div class="popup-content">
                    <span class="popup-close" id="popupClose">×</span>
                    <a href="${s.PopupLinkURL || '#'}" target="_blank"><img src="${s.PopupImageURL}"></a>
                </div>
            </div>`);
        document.getElementById('popupClose').onclick = () => document.getElementById('popupOverlay').remove();
    }
}

function searchData() {
    const q = document.getElementById('searchInput').value;
    if (q.length < 3) return alert("Min 3 karakter");
    const resCon = document.getElementById('search-results-container');
    const iniCon = document.getElementById('initial-content');
    const body = document.querySelector('#resultsTable tbody');
    body.innerHTML = '<tr><td colspan="3">Mencari...</td></tr>';
    resCon.classList.remove('hidden'); iniCon.style.display = 'none';
    fetch(`${SCRIPT_URL}?action=search&query=${encodeURIComponent(q)}`)
        .then(r => r.json()).then(data => {
            body.innerHTML = '';
            data.forEach(item => {
                body.innerHTML += `<tr><td>${item.nama_lengkap}</td><td>${item.nama_training}</td><td><a href="detail.html?id=${item.id_peserta}" class="detail-btn">Detail</a></td></tr>`;
            });
            if(!data.length) body.innerHTML = '<tr><td colspan="3">Tidak ditemukan</td></tr>';
        });
}

function injectFooter() {
    const f = document.querySelector('footer');
    if(f) f.innerHTML = `<div class="footer-content"><p>Ruko gardenia, Bekasi | sales@proworker.co.id</p><a href="https://wa.me/6287779104041" class="whatsapp-btn" target="_blank">WhatsApp</a></div>`;
}

// Detail Page Loaders
async function loadDetailBerita(id) {
    const con = document.getElementById('detail-page-content');
    const d = await fetchData(`getDetailBerita&id=${id}`);
    if (d.error) return con.innerHTML = d.error;
    con.innerHTML = `<h1>${d.main.judulberita}</h1><img src="${d.main.url_gambar_1}" class="full-width-img"><p>${d.main.teks_1}</p>`;
}

async function loadDetailTraining(id) {
    const con = document.getElementById('detail-page-content');
    const d = await fetchData(`getDetailTraining&id=${id}`);
    if (d.error) return con.innerHTML = d.error;
    con.innerHTML = `<h1>${d.main.judultraining}</h1><img src="${d.main.url_gambar_1}" class="full-width-img"><p>${d.main.teks_1}</p>`;
}