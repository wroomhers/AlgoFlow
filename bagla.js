var _bag = [];
var _bag_index = 0;

// Aktif bağlantı çizimi için
var aktif_baglanti = null;
var baglanti_ciziliyor = false;
var baglanti_kaynak_index = -1;
var baglanti_kaynak_nokta = 0;
var baglanti_baslangic_x = 0;
var baglanti_baslangic_y = 0;

// Seçili bağlantı/köşe noktası
var secili_baglanti = null;
var secili_kose_index = -1;
var suruklenen_kose = false;
var suruklenen_cizgi = false;
var suruklenen_cizgi_segment = -1;

// Snap toleransı (piksel)
var SNAP_TOLERANS = 8;

function sembol_bagla(s_bir_x, s_bir_y, s_iki_x, s_iki_y, s_bir_index, s_iki_index, s_bir_d, s_iki_d) {
    this.s_bir_x = s_bir_x;
    this.s_iki_x = s_iki_x;
    this.s_bir_y = s_bir_y;
    this.s_iki_y = s_iki_y;
    this.s_bir_index = s_bir_index;
    this.s_iki_index = s_iki_index;
    this.s_bir_d = s_bir_d; // 1:üst, 2:alt, 3:sağ, 4:sol
    this.s_iki_d = s_iki_d;
    
    // Köşe noktaları dizisi [{x, y}, ...]
    this.kose_noktalari = [];
    
    // Görsel özellikler
    this.renk = '#000000';
    this.kalinlik = 2;
    this.secili = false;

    this.ciz = function() {
        this.guncelle();
        
        stroke(this.secili ? '#0078d4' : this.renk);
        strokeWeight(this.secili ? 3 : this.kalinlik);
        noFill();
        
        // Tüm noktaları topla: başlangıç + köşeler + bitiş
        var noktalar = this.tumNoktalariAl();
        
        // Çizgileri çiz
        for (var i = 0; i < noktalar.length - 1; i++) {
            line(noktalar[i].x, noktalar[i].y, noktalar[i + 1].x, noktalar[i + 1].y);
        }
        
        // Ok başı (son segmentte)
        if (noktalar.length >= 2) {
            var sondan1 = noktalar[noktalar.length - 2];
            var son = noktalar[noktalar.length - 1];
            
            push();
            translate(son.x, son.y);
            var angle = atan2(son.y - sondan1.y, son.x - sondan1.x);
            rotate(angle);
            fill(this.secili ? '#0078d4' : this.renk);
            noStroke();
            triangle(-12, 6, -12, -6, 0, 0);
            pop();
        }
        
        // Köşe noktalarını göster (seçiliyse)
        if (this.secili) {
            for (var i = 0; i < this.kose_noktalari.length; i++) {
                var kn = this.kose_noktalari[i];
                fill(secili_kose_index === i ? '#ff6600' : '#0078d4');
                noStroke();
                ellipse(kn.x, kn.y, 10, 10);
            }
            
            // Segment ortalarında + işareti göster (yeni köşe eklemek için)
            for (var i = 0; i < noktalar.length - 1; i++) {
                var ortaX = (noktalar[i].x + noktalar[i + 1].x) / 2;
                var ortaY = (noktalar[i].y + noktalar[i + 1].y) / 2;
                fill(255);
                stroke('#666');
                strokeWeight(1);
                ellipse(ortaX, ortaY, 14, 14);
                fill('#666');
                noStroke();
                textAlign(CENTER, CENTER);
                textSize(12);
                text('+', ortaX, ortaY - 1);
            }
        }
        
        strokeWeight(1);
    };
    
    this.tumNoktalariAl = function() {
        var noktalar = [];
        noktalar.push({ x: this.s_bir_x, y: this.s_bir_y });
        for (var i = 0; i < this.kose_noktalari.length; i++) {
            noktalar.push({ x: this.kose_noktalari[i].x, y: this.kose_noktalari[i].y });
        }
        noktalar.push({ x: this.s_iki_x, y: this.s_iki_y });
        return noktalar;
    };
    
    this.koseEkle = function(segmentIndex, x, y) {
        this.kose_noktalari.splice(segmentIndex, 0, { x: x, y: y });
    };
    
    this.koseSil = function(koseIndex) {
        if (koseIndex >= 0 && koseIndex < this.kose_noktalari.length) {
            this.kose_noktalari.splice(koseIndex, 1);
        }
    };
    
    this.koseHareketEttir = function(koseIndex, x, y) {
        if (koseIndex >= 0 && koseIndex < this.kose_noktalari.length) {
            // Snap to horizontal/vertical - komşu noktalarla karşılaştır
            var noktalar = this.tumNoktalariAl();
            var koseNoktasiIdx = koseIndex + 1; // tumNoktalariAl'daki index
            
            // Önceki nokta
            if (koseNoktasiIdx > 0) {
                var onceki = noktalar[koseNoktasiIdx - 1];
                if (Math.abs(x - onceki.x) < SNAP_TOLERANS) x = onceki.x;
                if (Math.abs(y - onceki.y) < SNAP_TOLERANS) y = onceki.y;
            }
            // Sonraki nokta
            if (koseNoktasiIdx < noktalar.length - 1) {
                var sonraki = noktalar[koseNoktasiIdx + 1];
                if (Math.abs(x - sonraki.x) < SNAP_TOLERANS) x = sonraki.x;
                if (Math.abs(y - sonraki.y) < SNAP_TOLERANS) y = sonraki.y;
            }
            
            this.kose_noktalari[koseIndex].x = x;
            this.kose_noktalari[koseIndex].y = y;
        }
    };
    
    // Segmenti 1D eksende hareket ettir (yatay veya dikey)
    this.segmentHareketEttir = function(segmentIndex, deltaX, deltaY) {
        var noktalar = this.tumNoktalariAl();
        if (segmentIndex < 0 || segmentIndex >= noktalar.length - 1) return;
        
        var p1 = noktalar[segmentIndex];
        var p2 = noktalar[segmentIndex + 1];
        
        // Yatay mı dikey mi?
        var yatay = Math.abs(p2.y - p1.y) < Math.abs(p2.x - p1.x);
        
        // Segment uçlarındaki köşeleri hareket ettir
        if (segmentIndex > 0) {
            var koseIdx = segmentIndex - 1;
            if (yatay) {
                this.kose_noktalari[koseIdx].y += deltaY;
            } else {
                this.kose_noktalari[koseIdx].x += deltaX;
            }
        }
        if (segmentIndex < this.kose_noktalari.length) {
            if (yatay) {
                this.kose_noktalari[segmentIndex].y += deltaY;
            } else {
                this.kose_noktalari[segmentIndex].x += deltaX;
            }
        }
    };
    
    // Mouse bir noktaya/segmente tıkladı mı kontrol et
    this.tiklamaKontrol = function(mx, my) {
        var noktalar = this.tumNoktalariAl();
        
        // Önce köşe noktalarını kontrol et
        for (var i = 0; i < this.kose_noktalari.length; i++) {
            var kn = this.kose_noktalari[i];
            if (dist(mx, my, kn.x, kn.y) < 8) {
                return { tip: 'kose', index: i };
            }
        }
        
        // Segment ortalarını kontrol et (+ butonları)
        if (this.secili) {
            for (var i = 0; i < noktalar.length - 1; i++) {
                var ortaX = (noktalar[i].x + noktalar[i + 1].x) / 2;
                var ortaY = (noktalar[i].y + noktalar[i + 1].y) / 2;
                if (dist(mx, my, ortaX, ortaY) < 10) {
                    return { tip: 'yeni_kose', segmentIndex: i };
                }
            }
        }
        
        // Çizgi segmentlerini kontrol et
        for (var i = 0; i < noktalar.length - 1; i++) {
            if (this.noktaCizgiyeYakin(mx, my, noktalar[i], noktalar[i + 1], 6)) {
                return { tip: 'segment', segmentIndex: i };
            }
        }
        
        return null;
    };
    
    this.noktaCizgiyeYakin = function(px, py, p1, p2, tolerans) {
        var A = px - p1.x;
        var B = py - p1.y;
        var C = p2.x - p1.x;
        var D = p2.y - p1.y;
        
        var dot = A * C + B * D;
        var len_sq = C * C + D * D;
        var param = len_sq !== 0 ? dot / len_sq : -1;
        
        var xx, yy;
        if (param < 0) {
            xx = p1.x; yy = p1.y;
        } else if (param > 1) {
            xx = p2.x; yy = p2.y;
        } else {
            xx = p1.x + param * C;
            yy = p1.y + param * D;
        }
        
        return dist(px, py, xx, yy) < tolerans;
    };
    
    this.guncelle = function() {
        if (!_deneme[this.s_bir_index] || !_deneme[this.s_iki_index]) return;
        
        switch (this.s_bir_d) {
            case 1:
                this.s_bir_x = _deneme[this.s_bir_index]._üst_bag_x;
                this.s_bir_y = _deneme[this.s_bir_index]._üst_bag_y;
                break;
            case 2:
                this.s_bir_x = _deneme[this.s_bir_index]._alt_bag_x;
                this.s_bir_y = _deneme[this.s_bir_index]._alt_bag_y;
                break;
            case 3:
                this.s_bir_x = _deneme[this.s_bir_index]._sag_bag_x;
                this.s_bir_y = _deneme[this.s_bir_index]._sag_bag_y;
                break;
            case 4:
                this.s_bir_x = _deneme[this.s_bir_index]._sol_bag_x;
                this.s_bir_y = _deneme[this.s_bir_index]._sol_bag_y;
                break;
        }
        switch (this.s_iki_d) {
            case 1:
                this.s_iki_x = _deneme[this.s_iki_index]._üst_bag_x;
                this.s_iki_y = _deneme[this.s_iki_index]._üst_bag_y;
                break;
            case 2:
                this.s_iki_x = _deneme[this.s_iki_index]._alt_bag_x;
                this.s_iki_y = _deneme[this.s_iki_index]._alt_bag_y;
                break;
            case 3:
                this.s_iki_x = _deneme[this.s_iki_index]._sag_bag_x;
                this.s_iki_y = _deneme[this.s_iki_index]._sag_bag_y;
                break;
            case 4:
                this.s_iki_x = _deneme[this.s_iki_index]._sol_bag_x;
                this.s_iki_y = _deneme[this.s_iki_index]._sol_bag_y;
                break;
        }
    };
}
