// Konsol İşlemleri

function konsol(){
    // Eski yapı uyumluluğu için
    this.yaz = function(msg) {
        global_konsol_yaz(msg);
    }
    this.temizle = function() {
        temizleKonsol();
    }
}

function global_konsol_yaz(mesaj, tip='output') {
    // Mesaj tipine göre yönlendir
    // tip: 'output', 'error', 'system', 'log'
    
    var targetId = 'console-output-cikti'; // Varsayılan: Program Çıktısı
    var activeTabId = 'btn-tab-cikti';

    // Eğer simülasyon adımı veya log ise Log sekmesine
    if (mesaj.startsWith('Adım ') || mesaj.startsWith('Yol:') || mesaj.startsWith('Analiz') || mesaj.startsWith('Simülasyon') || mesaj.startsWith('HATA: Akış') || tip === 'log') {
        targetId = 'console-output-log';
        activeTabId = 'btn-tab-log';
        // Log sekmesi aktif değilse kullanıcıyı uyarabiliriz ama şimdilik sadece yazalım.
    }
    
    // Eğer Çıktı: ile başlıyorsa Program Çıktısı'na
    if (mesaj.startsWith('Çıktı: ')) {
        targetId = 'console-output-cikti';
    }

    var consoleDiv = document.getElementById(targetId);
    if (!consoleDiv) return;
    
    var newLine = document.createElement('div');
    newLine.className = 'console-line ' + tip;
    newLine.innerText = '> ' + mesaj;
    consoleDiv.appendChild(newLine);
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

function temizleKonsol() {
    var c1 = document.getElementById('console-output-cikti');
    if(c1) c1.innerHTML = '<div class="console-line system">> Çıktı temizlendi.</div>';
    
    var c2 = document.getElementById('console-output-log');
    if(c2) c2.innerHTML = '<div class="console-line system">> Log temizlendi.</div>';
}

function tabGecis(tabName) {
    document.getElementById('console-output-cikti').style.display = 'none';
    document.getElementById('console-output-log').style.display = 'none';
    document.getElementById('btn-tab-cikti').className = 'tab-btn';
    document.getElementById('btn-tab-log').className = 'tab-btn';
    
    document.getElementById('console-output-' + tabName).style.display = 'block';
    document.getElementById('btn-tab-' + tabName).className = 'tab-btn active';
}
