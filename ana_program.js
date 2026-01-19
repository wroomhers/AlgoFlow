// Ana Program ve Olay Yöneticisi

var _deneme = [];
var secilen_index = 0;
var deneme_sim;
var orta_canvas;
var _konsol;
var secili_sekil = null;
var baglanti_modu = false; // Artık kullanılmıyor ama uyumluluk için tutuluyor
var degiskenler = {}; // Global değişken hafızası

// Panning
var offset_x = 0;
var offset_y = 0;
var pan_start_x = 0;
var pan_start_y = 0;
var is_panning = false;

// Undo / Redo
var historyStack = [];
var historyStep = -1;
var isLikelyToChange = false;

// Sürükleme durumu için ek değişkenler
var is_dragging_shape = false;
var drag_started_on_shape = false;

// Köşe/segment sürükleme için
var drag_kose_baslangic_x = 0;
var drag_kose_baslangic_y = 0;

// Blok boyutlandırma için
var is_resizing = false;
var resize_handle = null; // 'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'
var resize_start_x = 0;
var resize_start_y = 0;
var resize_start_width = 0;
var resize_start_height = 0;
var RESIZE_HANDLE_SIZE = 8;

// P5.js Setup
function setup(){
    // Canvas container'ın boyutlarını al
    var container = document.getElementById('canvas-container');
    
    // Fallback dimensions if container is missing or too small
    var w = (container && container.offsetWidth > 100) ? container.offsetWidth : 800;
    var h = (container && container.offsetHeight > 100) ? container.offsetHeight : 600;
    
    orta_canvas = createCanvas(w, h);
    orta_canvas.parent('canvas-container');
    background(255);
    
    console.log("Canvas Setup: " + w + "x" + h);
    
    deneme_sim = new simülasyon();
    _konsol = new konsol();
    
    // LocalStorage'dan yükle (aynı sekme için)
    if (sessionStorageYukle()) {
        global_konsol_yaz("Önceki oturum geri yüklendi.", "system");
    } else {
        // Varsayılan şekilleri ekle
        _deneme = [];
        _deneme.push(new algroitma_sema(w/2 - 50, 50, 40, 100, 3, "BAŞLAT"));
        _deneme.push(new algroitma_sema(w/2 - 50, h - 100, 40, 100, 3, "DURDUR"));
        global_konsol_yaz("Yeni oturum başlatıldı. Genişlik: " + w + ", Yükseklik: " + h, "system");
    }
    
    // İlk durumu kaydet
    saveState();
    
    // Sayfa kapanırken kaydet
    window.addEventListener('beforeunload', function() {
        sessionStorageKaydet();
    });
}

function windowResized() {
    var container = document.getElementById('canvas-container');
    if(container) {
        resizeCanvas(container.offsetWidth, container.offsetHeight);
    }
}

function draw(){
    // 1. Her karede arka planı temizle
    background(240);
    
    // 2. Test Çizimi (En Üste - Sabit)
    // Bu kırmızı kareyi görüyorsanız çizim fonksiyonu çalışıyor demektir.
    // push();
    // resetMatrix();
    // fill(255, 0, 0);
    // noStroke();
    // rect(width - 20, height - 20, 10, 10); // Sağ alt köşe
    // fill(0);
    // textAlign(RIGHT, BOTTOM);
    // textSize(12);
    // text("FPS: " + parseInt(frameRate()) + " | Blok: " + (_deneme ? _deneme.length : 0), width - 30, height - 10); 
    // pop();
    
    // NaN koruması
    if(isNaN(offset_x)) offset_x = 0;
    if(isNaN(offset_y)) offset_y = 0;

    // Panning uygula
    push();
    translate(offset_x, offset_y);
    
    // Koordinat Merkezi
    stroke(200, 0, 0);
    line(-50, 0, 50, 0);
    line(0, -50, 0, 50);

    // Bağlantıları Çiz
    if(_bag && _bag.length > 0) {
        for(let a=0; a<_bag.length; a++){
            try {
                if(_bag[a]) _bag[a].ciz();
            } catch(e) {
                console.error("Bağlantı çizim hatası:", e);
            }
        }
    }
    
    // Şekilleri Çiz
    if(_deneme && _deneme.length > 0) {
        for(let a = 0 ; a<_deneme.length; a++){
            try {
                if(_deneme[a]) {
                    _deneme[a].ciz();
                }
            } catch (e) {
                // Hatalı şekil için placeholder çiz
                fill(255, 0, 0, 100);
                rect(_deneme[a].x || 0, _deneme[a].y || 0, 50, 50);
                console.error("Şekil çizim hatası index " + a + ":", e);
            }
        }
    }
    
    // Bağlantı çiziliyorken önizleme çizgisi
    if (baglanti_ciziliyor) {
        stroke(0, 150, 255);
        strokeWeight(2);
        var mrelX = mouseX - offset_x;
        var mrelY = mouseY - offset_y;
        line(baglanti_baslangic_x, baglanti_baslangic_y, mrelX, mrelY);
        
        // Ok ucu göster
        push();
        translate(mrelX, mrelY);
        var angle = atan2(mrelY - baglanti_baslangic_y, mrelX - baglanti_baslangic_x);
        rotate(angle);
        fill(0, 150, 255);
        noStroke();
        triangle(-10, 5, -10, -5, 0, 0);
        pop();
        strokeWeight(1);
        
        // Bağlantı modu göstergesi
        push();
        resetMatrix();
        fill(0, 150, 255, 200);
        noStroke();
        rect(10, 10, 220, 25, 5);
        fill(255);
        textSize(12);
        textAlign(LEFT, CENTER);
        text("🔗 Bağlantı çiziliyor... (ESC: İptal)", 20, 22);
        pop();
    }
    
    pop();
}

// Global Fonksiyonlar (HTML butonları için)
function sekilEkle(tip, yazi) {
    try {
        // Önce seçili nesneyi temizle
        if (secili_sekil) {
            secili_sekil.secildi = 0;
            secili_sekil = null;
        }
        
        saveState();
        
        // Canvas ortasını bul
        var cx = width / 2;
        var cy = height / 2;
        
        // Offseti hesaba kat - dünya koordinatlarına çevir
        var worldX = cx - offset_x;
        var worldY = cy - offset_y;
        
        // Yeni şekli oluştur
        var yeniSekil = new algroitma_sema(worldX - 50, worldY - 25, 40, 100, parseInt(tip), yazi);
        
        if(!Array.isArray(_deneme)) _deneme = [];
        _deneme.push(yeniSekil);
        
        sessionStorageKaydet(); // Otomatik kaydet
        global_konsol_yaz("Eklendi: " + yazi, "system");
        
    } catch(e) {
        console.error("Şekil ekleme hatası:", e);
        global_konsol_yaz("Hata: " + e.message, "error");
    }
}

// Drag & Drop Handlers
function dragStartHandler(ev, tip, yazi) {
    ev.dataTransfer.setData("application/json", JSON.stringify({tip: tip, yazi: yazi}));
    ev.dataTransfer.dropEffect = "copy";
}

function dragOverHandler(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "copy";
}

function dropHandler(ev) {
    ev.preventDefault();
    try {
        var data = JSON.parse(ev.dataTransfer.getData("application/json"));
        if (!data || !data.tip) return;
        
        // Önce seçili nesneyi temizle - sürükleme çakışmasını önle
        if (secili_sekil) {
            secili_sekil.secildi = 0;
            secili_sekil = null;
        }
        
        saveState();
        
        // Mouse koordinatlarını al (Canvas içindeki göreceli konum)
        // ev.clientX/Y pencereye göredir. Canvas elemanının yerini bulmalıyız.
        var rect = orta_canvas.elt.getBoundingClientRect();
        var canvasX = ev.clientX - rect.left;
        var canvasY = ev.clientY - rect.top;
        
        // Panning offsetini hesaba kat
        var finalX = canvasX - offset_x;
        var finalY = canvasY - offset_y;
        
        // Merkezleme (Şeklin ortası mouse ucuna gelsin)
        finalX -= 50; // Genişliğin yarısı tahmini
        finalY -= 25; // Yüksekliğin yarısı tahmini
        
        var yeniSekil = new algroitma_sema(finalX, finalY, 40, 100, parseInt(data.tip), data.yazi);
        _deneme.push(yeniSekil);
        
        sessionStorageKaydet(); // Otomatik kaydet
        global_konsol_yaz("Sürükle-Bırak ile eklendi: " + data.yazi, "system");
        
    } catch(e) {
        console.error("Drop hatası:", e);
    }
}


function baslatSimulasyon() {
    temizleKonsol();
    global_konsol_yaz("Simülasyon başlatılıyor...", "log");
    degiskenler = {}; // Hafızayı sıfırla
    deneme_sim.analiz();
    deneme_sim.calistir();
}

function adimSimulasyon() {
    if (!deneme_sim.aktif && deneme_sim.suanki_sekil_index == -1) {
        temizleKonsol();
        degiskenler = {};
        global_konsol_yaz("Adım Adım Simülasyon...", "log");
    }
    deneme_sim.adimIlerle();
}

function durdurSimulasyon() {
    deneme_sim.durdur();
    global_konsol_yaz("Simülasyon durduruldu.", "log");
}

function temizleCanvas() {
    saveState();
    _deneme = [];
    _bag = [];
    offset_x = 0;
    offset_y = 0;
    
    var w = width;
    var h = height;
    _deneme.push(new algroitma_sema(w/2 - 50, 50, 40, 100, 3, "BAŞLAT"));
    _deneme.push(new algroitma_sema(w/2 - 50, h - 100, 40, 100, 3, "DURDUR"));
    temizleOzellikPaneli();
}

function merkezeOdakla() {
    offset_x = 0;
    offset_y = 0;
    global_konsol_yaz("Görünüm merkeze sıfırlandı.", "system");
}

function baglantiModuGecis() {
    baglanti_modu = !baglanti_modu;
    document.getElementById('conn-status').innerText = baglanti_modu ? "Açık" : "Kapalı";
    var btn = document.getElementById('btn-toggle-connect');
    if(baglanti_modu) btn.className = "btn btn-info active";
    else btn.className = "btn btn-info";
}

function temizleOzellikPaneli() {
    var noSelParams = document.querySelector('.no-selection');
    if(noSelParams){
        noSelParams.style.display = 'block';
    }
    document.getElementById('prop-form').style.display = 'none';
    document.getElementById('prop-text').value = "";
    document.getElementById('prop-code').value = "";
}

function anlikOzellikGuncelle(prop, val) {
    if (secili_sekil) {
        if (prop === 'kod') {
            secili_sekil.kod_satiri_guncelle(val);
        } else if (prop === 'arkaPlanRengi') {
            secili_sekil.arkaPlanRengi = val;
        } else if (prop === 'yaziRengi') {
            secili_sekil.yaziRengi = val;
        } else {
            // Eğer parametre yollanmazsa (eski kullanım veya toplu update)
            var vYazi = document.getElementById('prop-text').value;
            var vKod = document.getElementById('prop-code').value;
            
            secili_sekil.yazi_degis(vYazi);
            secili_sekil.kod_satiri_guncelle(vKod);
        }
        isLikelyToChange = true;
    }
}

// Şekil metnini güncelle (HTML input oninput eventi için)
function guncelleSekilMetni(yeniMetin) {
    if (secili_sekil) {
        secili_sekil.yazi_degis(yeniMetin);
        isLikelyToChange = true;
    }
}

// Undo / Redo Functions
function saveState() {
    try {
        // Gelecekteki geçmişi temizle (Redo stack)
        if (historyStep < historyStack.length - 1) {
            historyStack = historyStack.slice(0, historyStep + 1);
        }
        
        var state = {
            deneme: JSON.parse(JSON.stringify(_deneme)),
            bag: JSON.parse(JSON.stringify(_bag))
        };
        
        historyStack.push(state);
        historyStep++;
        
        if(historyStack.length > 50) {
            historyStack.shift();
            historyStep--;
        }
    } catch(e) {
        console.error("Undo sistemi hatası (Kaydetme): ", e);
    }
}

function restoreState(state) {
    if(!state) return;

    try {
        _deneme = [];
        _bag = [];
        
        // Şekilleri geri yükle
        for(var i=0; i<state.deneme.length; i++) {
            var d = state.deneme[i];
            
            var sekil = new algroitma_sema(d.x, d.y, 0, 0, d.alg_sembol, d.yazi);
            
            sekil.yukseklik = d.yukseklik;
            sekil.genislik = d.genislik;
            sekil.kod_satiri = d.kod_satiri || "";
            sekil.arkaPlanRengi = d.arkaPlanRengi || '#ffffff';
            sekil.yaziRengi = d.yaziRengi || '#000000';
            sekil.secildi = 0; 
            
            sekil.bag_noktalarini_guncelle();
            
            _deneme.push(sekil);
        }
        
        // Bağlantıları geri yükle
        for(var i=0; i<state.bag.length; i++) {
            var b = state.bag[i];
            var yeniBag = new sembol_bagla(b.s_bir_x, b.s_bir_y, b.s_iki_x, b.s_iki_y, b.s_bir_index, b.s_iki_index, b.s_bir_d, b.s_iki_d);
            // Köşe noktalarını geri yükle
            if (b.kose_noktalari && b.kose_noktalari.length > 0) {
                yeniBag.kose_noktalari = JSON.parse(JSON.stringify(b.kose_noktalari));
            }
            // Görsel özellikleri geri yükle
            if (b.renk) yeniBag.renk = b.renk;
            if (b.kalinlik) yeniBag.kalinlik = b.kalinlik;
            _bag.push(yeniBag);
        }
        
        secili_sekil = null;
        secili_baglanti = null;
        secili_kose_index = -1;
        temizleOzellikPaneli();
    } catch (e) {
        console.error("Undo sistemi hatası (Geri Yükleme): ", e);
    }
}

function undo() {
    if (historyStep > 0) {
        historyStep--;
        var state = historyStack[historyStep];
        restoreState(state);
        // global_konsol_yaz("Geri alındı.");
    }
}

function redo() {
    if (historyStep < historyStack.length - 1) {
        historyStep++;
        var state = historyStack[historyStep];
        restoreState(state);
        // global_konsol_yaz("İleri alındı.");
    }
}

function keyPressed() {
    // ESC - Bağlantı iptal veya seçimi kaldır
    if (keyCode === ESCAPE) {
        if (baglanti_ciziliyor) {
            baglantiIptal();
        } else if (secili_baglanti) {
            secili_baglanti.secili = false;
            secili_baglanti = null;
            secili_kose_index = -1;
        } else if (secili_sekil) {
            secili_sekil.secildi = 0;
            secili_sekil = null;
            temizleOzellikPaneli();
        }
        return;
    }
    
    // Delete - Köşe noktası veya bağlantı silme
    if (keyCode === DELETE) {
        if (secili_baglanti && secili_kose_index >= 0) {
            // Köşe noktası sil
            saveState();
            secili_baglanti.koseSil(secili_kose_index);
            secili_kose_index = -1;
            sessionStorageKaydet();
            return;
        } else if (secili_baglanti) {
            // Bağlantıyı tamamen sil
            saveState();
            var idx = _bag.indexOf(secili_baglanti);
            if (idx > -1) {
                _bag.splice(idx, 1);
            }
            secili_baglanti = null;
            secili_kose_index = -1;
            sessionStorageKaydet();
            global_konsol_yaz("Bağlantı silindi.", "system");
            return;
        }
        
        saveState();
        asilSilmeIslemi();
        return;
    }
    
    // Ctrl+Z (Undo)
    if (keyIsDown(CONTROL) && (key === 'z' || key === 'Z')) {
        undo();
    }
    // Ctrl+Y (Redo)
    else if (keyIsDown(CONTROL) && (key === 'y' || key === 'Y')) {
        redo();
    }
    // Ctrl+S (Kaydet)
    else if (keyIsDown(CONTROL) && (key === 's' || key === 'S')) {
        dosyaKaydet();
        return false; // Tarayıcı kaydetmeyi engelle
    }
}

function asilSilmeIslemi() {
    if (!secili_sekil) return;
    
    var silinecekIndex = _deneme.indexOf(secili_sekil);
    if (silinecekIndex == -1) return;
    
    if (secili_sekil.yazi == "BAŞLAT" || secili_sekil.yazi == "DURDUR") {
        global_konsol_yaz("Başlangıç ve Bitiş blokları silinemez!", "error");
        return;
    }
    
    for (var i = _bag.length - 1; i >= 0; i--) {
        if (_bag[i].s_bir_index == silinecekIndex || _bag[i].s_iki_index == silinecekIndex) {
            _bag.splice(i, 1);
        }
    }
    
    _deneme.splice(silinecekIndex, 1);
    
    for (var i = 0; i < _bag.length; i++) {
        if (_bag[i].s_bir_index > silinecekIndex) {
            _bag[i].s_bir_index--;
        }
        if (_bag[i].s_iki_index > silinecekIndex) {
            _bag[i].s_iki_index--;
        }
    }
    
    secili_sekil = null;
    temizleOzellikPaneli();
    global_konsol_yaz("Nesne silindi.");
}

function mousePressed(){
    // Canvas dışı kontrolü
    if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) {
        return;
    }

    // Tıklama öncesi bağlantı durumunu sakla (iptal mantığı için gerekli)
    var onceden_baglanti_ciziliyor = typeof baglanti_ciziliyor !== 'undefined' ? baglanti_ciziliyor : false;

    // Sürükleme durumunu sıfırla
    is_dragging_shape = false;
    drag_started_on_shape = false;
    suruklenen_kose = false;
    suruklenen_cizgi = false;
    is_resizing = false;
    resize_handle = null;

    // Orta tık veya Panning durumu
    if (mouseButton === CENTER) {
        is_panning = true;
        pan_start_x = mouseX - offset_x;
        pan_start_y = mouseY - offset_y;
        cursor('grab');
        return;
    }

    // Offsetli koordinatlar
    var mX = mouseX - offset_x;
    var mY = mouseY - offset_y;
    
    // Önce seçili bloğun boyutlandırma tutamaçlarını kontrol et
    if (secili_sekil && secili_sekil.resizeHandleKontrol) {
        var handle = secili_sekil.resizeHandleKontrol(mX, mY);
        if (handle) {
            is_resizing = true;
            resize_handle = handle;
            resize_start_x = mX;
            resize_start_y = mY;
            resize_start_width = secili_sekil.genislik;
            resize_start_height = secili_sekil.yukseklik;
            isLikelyToChange = true;
            return;
        }
    }
    
    // Şekil Seçimi - Önce şekilleri kontrol et (Z-index en üstte)
    var tiklandi = false;
    for(var a = _deneme.length - 1; a >= 0; a--){
        if (_deneme[a].sec(mX, mY)) {
            tiklandi = true;
            drag_started_on_shape = true;
            
            // Eğer yeni bir seçimse
            if(secili_sekil !== _deneme[a]) {
                // Eskileri temizle
                for(var b=0; b<_deneme.length; b++) _deneme[b].secildi = 0;
                
                // Yeniyi seç
                _deneme[a].secildi = 1;
                secili_sekil = _deneme[a];
                
                ozellik_menu_obj.guncelle(secili_sekil);
            }
            
            // Şekil seçildiyse bağlantı seçimini temizle
            if (secili_baglanti) {
                secili_baglanti.secili = false;
                secili_baglanti = null;
                secili_kose_index = -1;
            }
            
            isLikelyToChange = true;
            is_dragging_shape = true;
            return; // Şekil işlem gördüyse çık
        }
    }

    // Bağlantılara tıklama kontrolü (köşe noktaları ve segmentler)
    // Şekillerden sonra kontrol edilir
    for (var i = _bag.length - 1; i >= 0; i--) {
        var sonuc = _bag[i].tiklamaKontrol(mX, mY);
        if (sonuc) {
            // Önceki seçili bağlantıyı temizle
            if (secili_baglanti && secili_baglanti !== _bag[i]) {
                secili_baglanti.secili = false;
            }
            
            _bag[i].secili = true;
            secili_baglanti = _bag[i];
            
            if (sonuc.tip === 'kose') {
                // Köşe noktası seçildi - sürükleme başlat
                secili_kose_index = sonuc.index;
                suruklenen_kose = true;
                drag_kose_baslangic_x = mX;
                drag_kose_baslangic_y = mY;
                isLikelyToChange = true;
            } else if (sonuc.tip === 'yeni_kose') {
                // Yeni köşe ekle
                saveState();
                var noktalar = _bag[i].tumNoktalariAl();
                var ortaX = (noktalar[sonuc.segmentIndex].x + noktalar[sonuc.segmentIndex + 1].x) / 2;
                var ortaY = (noktalar[sonuc.segmentIndex].y + noktalar[sonuc.segmentIndex + 1].y) / 2;
                _bag[i].koseEkle(sonuc.segmentIndex, ortaX, ortaY);
                secili_kose_index = sonuc.segmentIndex;
                suruklenen_kose = true;
                sessionStorageKaydet();
            } else if (sonuc.tip === 'segment') {
                // Segment seçildi - 1D sürükleme için
                suruklenen_cizgi = true;
                suruklenen_cizgi_segment = sonuc.segmentIndex;
                drag_kose_baslangic_x = mX;
                drag_kose_baslangic_y = mY;
                isLikelyToChange = true;
            }
            
            // Şekil seçimini temizle
            if (secili_sekil) {
                secili_sekil.secildi = 0;
                secili_sekil = null;
                temizleOzellikPaneli();
            }
            return;
        }
    }
    
    if (!tiklandi) {
        // Boşa tıklandı - seçim iptal
        for(var b=0; b<_deneme.length; b++) _deneme[b].secildi = 0;
        secili_sekil = null;
        temizleOzellikPaneli();
        
        // Bağlantı çiziliyorken boşa tıklanırsa iptal et
        // Ancak bu tıklama ile başladıysak iptal etme (bu yüzden onceden_baglanti_ciziliyor kontrolü)
        if (baglanti_ciziliyor && onceden_baglanti_ciziliyor) {
            baglantiIptal();
        }
    }
}

function mouseDragged() {
    if (is_panning) {
        offset_x = mouseX - pan_start_x;
        offset_y = mouseY - pan_start_y;
        return;
    }
    
    var mX = mouseX - offset_x;
    var mY = mouseY - offset_y;
    
    // Blok boyutlandırma
    if (is_resizing && secili_sekil && resize_handle) {
        var deltaX = mX - resize_start_x;
        var deltaY = mY - resize_start_y;
        var minWidth = 60;
        var minHeight = 30;
        
        // Tutamaca göre boyutlandır
        if (resize_handle.includes('e')) {
            secili_sekil.genislik = Math.max(minWidth, resize_start_width + deltaX);
        }
        if (resize_handle.includes('w')) {
            var newWidth = Math.max(minWidth, resize_start_width - deltaX);
            if (newWidth !== secili_sekil.genislik) {
                secili_sekil.x = secili_sekil.x + (secili_sekil.genislik - newWidth);
                secili_sekil.genislik = newWidth;
            }
        }
        if (resize_handle.includes('s')) {
            secili_sekil.yukseklik = Math.max(minHeight, resize_start_height + deltaY);
        }
        if (resize_handle.includes('n')) {
            var newHeight = Math.max(minHeight, resize_start_height - deltaY);
            if (newHeight !== secili_sekil.yukseklik) {
                secili_sekil.y = secili_sekil.y + (secili_sekil.yukseklik - newHeight);
                secili_sekil.yukseklik = newHeight;
            }
        }
        
        secili_sekil.bag_noktalarini_guncelle();
        return;
    }
    
    // Köşe noktası sürükleme (2D)
    if (suruklenen_kose && secili_baglanti && secili_kose_index >= 0) {
        secili_baglanti.koseHareketEttir(secili_kose_index, mX, mY);
        return;
    }
    
    // Segment sürükleme (1D)
    if (suruklenen_cizgi && secili_baglanti && suruklenen_cizgi_segment >= 0) {
        var deltaX = mX - drag_kose_baslangic_x;
        var deltaY = mY - drag_kose_baslangic_y;
        secili_baglanti.segmentHareketEttir(suruklenen_cizgi_segment, deltaX, deltaY);
        drag_kose_baslangic_x = mX;
        drag_kose_baslangic_y = mY;
        return;
    }

    // Sadece şekil üzerinde başlayan sürüklemeleri işle
    if (!drag_started_on_shape || !is_dragging_shape) {
        return;
    }

    if (secili_sekil) {
        // Panning offsetini hesaba katarak yeni pozisyon
        secili_sekil.x = mX - secili_sekil.sür_x;
        secili_sekil.y = mY - secili_sekil.sür_y;
        
        // Bağlantı noktalarını güncelle
        secili_sekil.bag_noktalarini_guncelle();
    }
}

function mouseReleased() {
    // Sürükleme durumlarını sıfırla
    is_dragging_shape = false;
    drag_started_on_shape = false;
    suruklenen_kose = false;
    suruklenen_cizgi = false;
    suruklenen_cizgi_segment = -1;
    is_resizing = false;
    resize_handle = null;
    
    if (is_panning) {
        is_panning = false;
        cursor(ARROW);
        return;
    }
    
    // Eğer bir değişiklik olasıysa ve gerçekten bir şeyler değiştiyse kaydet
    if (isLikelyToChange) {
        saveState();
        sessionStorageKaydet(); // Otomatik kaydet
        isLikelyToChange = false;
    }
}

// Bağlantı iptal fonksiyonu
function baglantiIptal() {
    baglanti_ciziliyor = false;
    baglanti_kaynak_index = -1;
    baglanti_kaynak_nokta = 0;
    global_konsol_yaz("Bağlantı iptal edildi.", "system");
}

// ==========================================
// DOSYA KAYDETME / YÜKLEME FONKSİYONLARI
// ==========================================

function dosyaKaydet() {
    try {
        var data = {
            version: "1.0",
            timestamp: new Date().toISOString(),
            canvas: { width: width, height: height },
            offset: { x: offset_x, y: offset_y },
            sekiller: [],
            baglantilar: []
        };
        
        // Şekilleri kaydet
        for (var i = 0; i < _deneme.length; i++) {
            var s = _deneme[i];
            data.sekiller.push({
                x: s.x,
                y: s.y,
                yukseklik: s.yukseklik,
                genislik: s.genislik,
                alg_sembol: s.alg_sembol,
                yazi: s.yazi,
                kod_satiri: s.kod_satiri || ""
            });
        }
        
        // Bağlantıları kaydet
        for (var i = 0; i < _bag.length; i++) {
            var b = _bag[i];
            data.baglantilar.push({
                s_bir_index: b.s_bir_index,
                s_iki_index: b.s_iki_index,
                s_bir_d: b.s_bir_d,
                s_iki_d: b.s_iki_d
            });
        }
        
        // JSON dosyası olarak indir
        var json = JSON.stringify(data, null, 2);
        var blob = new Blob([json], {type: "application/json"});
        var url = URL.createObjectURL(blob);
        
        var a = document.createElement('a');
        a.href = url;
        a.download = "algoritma_" + new Date().toISOString().slice(0,10) + ".json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        global_konsol_yaz("Dosya kaydedildi: " + a.download, "system");
    } catch(e) {
        console.error("Dosya kaydetme hatası:", e);
        global_konsol_yaz("Dosya kaydetme hatası: " + e.message, "error");
    }
}

function dosyaYukle() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        var file = e.target.files[0];
        if (!file) return;
        
        var reader = new FileReader();
        reader.onload = function(event) {
            try {
                var data = JSON.parse(event.target.result);
                dosyaVerisiniYukle(data);
                global_konsol_yaz("Dosya yüklendi: " + file.name, "system");
            } catch(err) {
                console.error("Dosya okuma hatası:", err);
                global_konsol_yaz("Dosya okuma hatası: " + err.message, "error");
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function dosyaVerisiniYukle(data) {
    if (!data || !data.sekiller) {
        global_konsol_yaz("Geçersiz dosya formatı!", "error");
        return;
    }
    
    saveState(); // Mevcut durumu kaydet (Undo için)
    
    _deneme = [];
    _bag = [];
    
    // Offseti yükle
    if (data.offset) {
        offset_x = data.offset.x || 0;
        offset_y = data.offset.y || 0;
    }
    
    // Şekilleri yükle
    for (var i = 0; i < data.sekiller.length; i++) {
        var s = data.sekiller[i];
        var sekil = new algroitma_sema(s.x, s.y, s.yukseklik, s.genislik / 1.5, s.alg_sembol, s.yazi);
        sekil.kod_satiri = s.kod_satiri || "";
        sekil.bag_noktalarini_guncelle();
        _deneme.push(sekil);
    }
    
    // Bağlantıları yükle
    for (var i = 0; i < data.baglantilar.length; i++) {
        var b = data.baglantilar[i];
        if (_deneme[b.s_bir_index] && _deneme[b.s_iki_index]) {
            var kaynak = _deneme[b.s_bir_index];
            var hedef = _deneme[b.s_iki_index];
            
            var x1, y1, x2, y2;
            
            // Kaynak noktası
            if (b.s_bir_d == 1) { x1 = kaynak._üst_bag_x; y1 = kaynak._üst_bag_y; }
            else if (b.s_bir_d == 2) { x1 = kaynak._alt_bag_x; y1 = kaynak._alt_bag_y; }
            else if (b.s_bir_d == 3) { x1 = kaynak._sag_bag_x; y1 = kaynak._sag_bag_y; }
            
            // Hedef noktası
            if (b.s_iki_d == 1) { x2 = hedef._üst_bag_x; y2 = hedef._üst_bag_y; }
            else if (b.s_iki_d == 2) { x2 = hedef._alt_bag_x; y2 = hedef._alt_bag_y; }
            else if (b.s_iki_d == 3) { x2 = hedef._sag_bag_x; y2 = hedef._sag_bag_y; }
            
            _bag.push(new sembol_bagla(x1, y1, x2, y2, b.s_bir_index, b.s_iki_index, b.s_bir_d, b.s_iki_d));
        }
    }
    
    secili_sekil = null;
    temizleOzellikPaneli();
    saveState();
    sessionStorageKaydet();
}

// ==========================================
// SESSION STORAGE (Sayfa Yenileme Koruması)
// ==========================================

function sessionStorageKaydet() {
    try {
        var data = {
            sekiller: [],
            baglantilar: [],
            offset: { x: offset_x, y: offset_y }
        };
        
        for (var i = 0; i < _deneme.length; i++) {
            var s = _deneme[i];
            data.sekiller.push({
                x: s.x, y: s.y,
                yukseklik: s.yukseklik, genislik: s.genislik,
                alg_sembol: s.alg_sembol, yazi: s.yazi,
                kod_satiri: s.kod_satiri || "",
                arkaPlanRengi: s.arkaPlanRengi || '#ffffff',
                yaziRengi: s.yaziRengi || '#000000'
            });
        }
        
        for (var i = 0; i < _bag.length; i++) {
            var b = _bag[i];
            data.baglantilar.push({
                s_bir_index: b.s_bir_index, s_iki_index: b.s_iki_index,
                s_bir_d: b.s_bir_d, s_iki_d: b.s_iki_d,
                kose_noktalari: b.kose_noktalari || [],
                renk: b.renk || '#000000',
                kalinlik: b.kalinlik || 2
            });
        }
        
        sessionStorage.setItem('algoflow_autosave', JSON.stringify(data));
    } catch(e) {
        console.error("SessionStorage kaydetme hatası:", e);
    }
}

function sessionStorageYukle() {
    try {
        var saved = sessionStorage.getItem('algoflow_autosave');
        if (!saved) return false;
        
        var data = JSON.parse(saved);
        if (!data || !data.sekiller || data.sekiller.length == 0) return false;
        
        _deneme = [];
        _bag = [];
        
        if (data.offset) {
            offset_x = data.offset.x || 0;
            offset_y = data.offset.y || 0;
        }
        
        for (var i = 0; i < data.sekiller.length; i++) {
            var s = data.sekiller[i];
            var sekil = new algroitma_sema(s.x, s.y, s.yukseklik, s.genislik / 1.5, s.alg_sembol, s.yazi);
            sekil.kod_satiri = s.kod_satiri || "";
            sekil.arkaPlanRengi = s.arkaPlanRengi || '#ffffff';
            sekil.yaziRengi = s.yaziRengi || '#000000';
            sekil.bag_noktalarini_guncelle();
            _deneme.push(sekil);
        }
        
        for (var i = 0; i < data.baglantilar.length; i++) {
            var b = data.baglantilar[i];
            if (_deneme[b.s_bir_index] && _deneme[b.s_iki_index]) {
                var kaynak = _deneme[b.s_bir_index];
                var hedef = _deneme[b.s_iki_index];
                var x1, y1, x2, y2;
                
                if (b.s_bir_d == 1) { x1 = kaynak._üst_bag_x; y1 = kaynak._üst_bag_y; }
                else if (b.s_bir_d == 2) { x1 = kaynak._alt_bag_x; y1 = kaynak._alt_bag_y; }
                else if (b.s_bir_d == 3) { x1 = kaynak._sag_bag_x; y1 = kaynak._sag_bag_y; }
                else if (b.s_bir_d == 4) { x1 = kaynak._sol_bag_x; y1 = kaynak._sol_bag_y; }
                
                if (b.s_iki_d == 1) { x2 = hedef._üst_bag_x; y2 = hedef._üst_bag_y; }
                else if (b.s_iki_d == 2) { x2 = hedef._alt_bag_x; y2 = hedef._alt_bag_y; }
                else if (b.s_iki_d == 3) { x2 = hedef._sag_bag_x; y2 = hedef._sag_bag_y; }
                else if (b.s_iki_d == 4) { x2 = hedef._sol_bag_x; y2 = hedef._sol_bag_y; }
                
                var yeniBag = new sembol_bagla(x1, y1, x2, y2, b.s_bir_index, b.s_iki_index, b.s_bir_d, b.s_iki_d);
                // Köşe noktalarını yükle
                if (b.kose_noktalari && b.kose_noktalari.length > 0) {
                    yeniBag.kose_noktalari = JSON.parse(JSON.stringify(b.kose_noktalari));
                }
                if (b.renk) yeniBag.renk = b.renk;
                if (b.kalinlik) yeniBag.kalinlik = b.kalinlik;
                _bag.push(yeniBag);
            }
        }
        
        return true;
    } catch(e) {
        console.error("SessionStorage yükleme hatası:", e);
        return false;
    }
}

function sessionStorageTemizle() {
    sessionStorage.removeItem('algoflow_autosave');
}

// ==========================================
// BAĞLANTI YÖNETİMİ
// ==========================================

function baglantiSil() {
    if (!secili_sekil) {
        global_konsol_yaz("Önce bir blok seçin.", "error");
        return;
    }
    
    var silinecekIndex = _deneme.indexOf(secili_sekil);
    var silindi = 0;
    
    for (var i = _bag.length - 1; i >= 0; i--) {
        if (_bag[i].s_bir_index == silinecekIndex || _bag[i].s_iki_index == silinecekIndex) {
            _bag.splice(i, 1);
            silindi++;
        }
    }
    
    if (silindi > 0) {
        saveState();
        sessionStorageKaydet();
        global_konsol_yaz(silindi + " bağlantı silindi.", "system");
    } else {
        global_konsol_yaz("Bu bloğa ait bağlantı bulunamadı.", "system");
    }
}

// Yeni temizle fonksiyonu - sessionStorage'ı da temizler
function yeniProje() {
    if (confirm("Tüm çalışmanız silinecek. Emin misiniz?")) {
        sessionStorageTemizle();
        temizleCanvas();
        global_konsol_yaz("Yeni proje oluşturuldu.", "system");
    }
}
