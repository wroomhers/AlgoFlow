////////////////////////////////////////////////////////////////////////////////////
//  Algoritma Akış Diagram Sembolleri                                             //
////////////////////////////////////////////////////////////////////////////////////

var _kutup = [];
var _islem = [];
var index = -1;
var s1_index = -1;
var s2_index = -1;
var bag_1_x, bag_1_y, bag_2_x, bag_2_y;
var s_bir_d = 0;
var s_iki_d = 0;
var my_tik = 0;

// PHP benzeri değişken dönüşümü ($x -> VAR_x) ve string interpolasyonu ("..$x.." -> ".."+VAR_x+"..")
function php_kod_cevir(kod) {
    if (!kod) return "";
    
    // Değişken adı temizleme/ön ekleme fonksiyonu ($x -> VAR_x)
    var toVar = function(v) { return "VAR_" + v; };

    // 1. Çift tırnaklı string içindeki $degisken ifadelerini javascript birleştirmesine çevir
    // Örnek: "Sayı: $x" -> "Sayı: " + VAR_x + ""
    var islenmis = kod.replace(/"([^"]*)"/g, function(match, content) {
        // String içindeki $degisken yapılarını bul ve " + VAR_degisken + " formatına çevir
        var replaced = content.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, function(m, vName){
            return '" + ' + toVar(vName) + ' + "';
        });
        return '"' + replaced + '"';
    });
    
    // 2. Tek tırnaklı stringler için de benzer işlem (isteğe bağlı ama tutarlılık için iyi)
    islenmis = islenmis.replace(/'([^']*)'/g, function(match, content) {
        var replaced = content.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, function(m, vName){
             return "' + " + toVar(vName) + " + '";
        });
        return "'" + replaced + "'";
    });
    
    // 3. String dışındaki (kod kısmındaki) $degisken ifadelerini VAR_ haline, normal x'i olduğu gibi bırakır
    // Örnek: $x + 5 -> VAR_x + 5
    islenmis = islenmis.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, function(m, vName){
        return toVar(vName);
    });
    
    return islenmis;
}

function algroitma_sema(x,y,yukseklik,genislik,alg_sembol,yazi){

this.x=x;
this.y=y;
this.yukseklik=yukseklik;
this.genislik=genislik * 1.5; // Biraz daha geniş olsun
this.alg_sembol=alg_sembol;
this.yazi=yazi;
this.secildi = 0;
this.sür_x = 0;
this.sür_y = 0;

// Bağlantı noktaları
this._üst_bag_x = 0;
this._üst_bag_y = 0;
this._alt_bag_x = 0;
this._alt_bag_y = 0;
// Yan bağlantı noktaları (Karar vb. için)
this._sol_bag_x = 0;
this._sol_bag_y = 0;
this._sag_bag_x = 0;
this._sag_bag_y = 0;

this.renk_üst = 0;
this.renk_alt = 0;

// Kimlik ve Veri
index++;
this.b_index = index; // Unique ID (aslında dizi sırası şu an için)
this.kod_satiri = ""; // Yeni: İşlem veya Koşul kodu buraya
this.d_ismi = '';
this.d_deger_1 = 0;

// Görsel Özellikler
this.arkaPlanRengi = '#ffffff'; // Varsayılan beyaz
this.yaziRengi = '#000000';     // Varsayılan siyah

this.bag_noktalarini_guncelle = function() {
this._üst_bag_x = this.x + (this.genislik/2);
this._üst_bag_y = this.y;
this._alt_bag_x = this.x + (this.genislik/2);
this._alt_bag_y = this.y + this.yukseklik;
this._sol_bag_x = this.x;
this._sol_bag_y = this.y + this.yukseklik/2;
this._sag_bag_x = this.x + this.genislik;
this._sag_bag_y = this.y + this.yukseklik/2;
}

// Init
this.bag_noktalarini_guncelle();

this.yazi_degis = function(yazi){
this.yazi = yazi;
}

this.d_index_d = function(index,isim){
this.d_ismi = isim;
}

this.kod_satiri_guncelle = function(val) {
    this.kod_satiri = val;
}

this.gorev = function(){
    try {
        var kod = this.kod_satiri ? this.kod_satiri.trim() : this.yazi.trim();
        var keys = Object.keys(degiskenler);
        var values = Object.values(degiskenler);

        if(this.alg_sembol == 1) { // İşlem
             // Kod satırı varsa onu çalıştır: "$x = 5" veya "$x = $y + 1"
             if (kod.indexOf('=') !== -1) {
                 // Atama işlemi var demektir.
                 var parts = kod.split('=');
                 var degiskenAdi = parts[0].trim();
                 
                 // Değişken adı $ ile başlamak ZORUNDA
                 if (!degiskenAdi.startsWith('$')) {
                     global_konsol_yaz("Hata: Değişken adı '$' ile başlamalıdır. Örn: $sayi = 5", "error");
                     return;
                 }
                 
                 // $ işaretini kaldır ve VAR_ prefixi ekle
                 var safeVarName = "VAR_" + degiskenAdi.substring(1);
                 
                 var ifade = parts.slice(1).join('=').trim();
                 
                 // İfadede PHP tarzı ($var) değişkenleri JS formatına çevir
                 var islenmisIfade = php_kod_cevir(ifade);
                 
                 var func = new Function(...keys, "return " + islenmisIfade);
                 var sonuc = func(...values);
                 
                 degiskenler[safeVarName] = sonuc;
                 global_konsol_yaz("İşlem: " + degiskenAdi + " = " + sonuc, "log");
             }
        } 
        else if(this.alg_sembol == 2) { // Giriş Çıkış
            // PHP tarzı değişken çözümleme yap
            var islenmis = php_kod_cevir(kod);
            
            // Eğer tırnak içinde değilse ve raw text ise (ve değişken değilse)
            // Eski sistemde düz metinleri doğrudan yazıyordu. 
            // Ancak artık PHP stili string birleştirme destekleniyor.
            
            try {
                var func = new Function(...keys, "return " + islenmis);
                var sonuc = func(...values);
                global_konsol_yaz("Çıktı: " + sonuc);
            } catch(e) {
                // Eğer kod çalışmazsa (muhtemelen tırnaksız düz metin), değişkenleri interpolate et
                // Örn: "$x değeri" -> "5 değeri" gibi
                
                var interpolated = kod.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, function(match, vName) {
                    var varKey = "VAR_" + vName;
                    if (degiskenler.hasOwnProperty(varKey)) {
                         return degiskenler[varKey];
                    }
                    return match; // Bulunamazsa $x olarak kalsın
                });
                
                global_konsol_yaz("Çıktı: " + interpolated); 
            }
        }
        else if(this.alg_sembol == 4) { // Karar
             var expr = php_kod_cevir(kod);
             if (expr.indexOf('==') === -1 && expr.indexOf('=') !== -1 && expr.indexOf('>=') === -1 && expr.indexOf('<=') === -1 && expr.indexOf('!=') === -1) {
                 expr = expr.replace('=', '==');
             }
             
             var func = new Function(...keys, "return " + expr);
             var sonuc = func(...values);
             
             global_konsol_yaz("Karar (" + kod + "): " + (sonuc ? "EVET" : "HAYIR"), "log");
             return sonuc; // True/False döndür
        }
    } catch (err) {
        global_konsol_yaz("Hata (" + this.yazi + "): " + err.message, "error");
        return false;
    }
}

this.ciz = function(){
this.bag_noktalarini_guncelle();

// Fare yakınlık kontrolü (bağlantı noktalarını göstermek için)
var mrelX = typeof mouseX !== 'undefined' ? mouseX - offset_x : 0;
var mrelY = typeof mouseY !== 'undefined' ? mouseY - offset_y : 0;
var fareYakin = (mrelX >= this.x - 30 && mrelX <= this.x + this.genislik + 30 && 
                 mrelY >= this.y - 30 && mrelY <= this.y + this.yukseklik + 30);

stroke(0);
strokeWeight(1);

// Seçili ise kalın çerçeve
if(this.secildi == 1) { 
    stroke(0, 120, 215);
    strokeWeight(3);
}

// Arka plan rengini uygula
if (this.arkaPlanRengi && this.arkaPlanRengi !== '#ffffff') {
    fill(this.arkaPlanRengi);
} else {
    fill(255);
}

// Şekil Çizimi
var sembol_tip = parseInt(this.alg_sembol);

switch(sembol_tip){
case 1: // İşlem (Dikdörtgen)
    rect(this.x, this.y, this.genislik, this.yukseklik);
    break;
case 2: // Giriş/Çıkış (Paralelkenar)
    quad(this.x + 20, this.y, 
     this.x + this.genislik, this.y, 
     this.x + this.genislik - 20, this.y + this.yukseklik, 
     this.x, this.y + this.yukseklik);
    break;
case 3: // Başla/Dur (Ovalimsi Dikdörtgen)
    rect(this.x, this.y, this.genislik, this.yukseklik, 20);
    break;
case 4: // Karar (Eşkenar Dörtgen)
    quad(this.x + this.genislik/2, this.y, 
         this.x + this.genislik, this.y + this.yukseklik/2, 
         this.x + this.genislik/2, this.y + this.yukseklik, 
         this.x, this.y + this.yukseklik/2);
    break;
case 5: // Bağlantı (Daire)
    ellipseMode(CORNER);
    ellipse(this.x + (this.genislik - this.yukseklik)/2, this.y, this.yukseklik, this.yukseklik); 
    break;
default:
    fill(255, 200, 200);
    rect(this.x, this.y, 50, 50);
    fill(100);
    noStroke();
    textAlign(CENTER, CENTER);
    text("?", this.x + 25, this.y + 25);
    break;
}

// Yazı Çizimi
noStroke();
// Yazı rengini uygula
if (this.yaziRengi && this.yaziRengi !== '#000000') {
    fill(this.yaziRengi);
} else {
    fill(0);
}
textSize(12);
textAlign(CENTER, CENTER);
text(this.yazi, this.x + this.genislik/2, this.y + this.yukseklik/2);

// Bağlantı Noktaları - Fare yakınındaysa veya seçiliyse göster
if (fareYakin || this.secildi == 1) {
    var nodeSize = 8;
    
    // Üst bağlantı noktası (Giriş)
    fill(100, 180, 100);
    stroke(60, 120, 60);
    strokeWeight(1);
    ellipse(this._üst_bag_x, this._üst_bag_y, nodeSize, nodeSize);
    
    // Alt bağlantı noktası (Çıkış / Evet)
    fill(100, 150, 220);
    stroke(60, 100, 180);
    ellipse(this._alt_bag_x, this._alt_bag_y, nodeSize, nodeSize);
    
    if (this.alg_sembol == 4) { // Karar için yan çıkışlar
        // Sol çıkış (Evet)
        fill(100, 200, 100);
        stroke(60, 150, 60);
        ellipse(this._sol_bag_x, this._sol_bag_y, nodeSize, nodeSize);
        
        // Sağ çıkış (Hayır)
        fill(220, 100, 100);
        stroke(180, 60, 60);
        ellipse(this._sag_bag_x, this._sag_bag_y, nodeSize, nodeSize);
        
        // Etiketler
        fill(0); 
        noStroke(); 
        textSize(10);
        textAlign(CENTER, CENTER);
        text("E", this._sol_bag_x - 15, this._sol_bag_y);
        text("H", this._sag_bag_x + 15, this._sag_bag_y);
    }
}

// Boyutlandırma tutamaçları - sadece seçiliyse göster
if (this.secildi == 1) {
    var hs = 6; // handle size
    fill(255);
    stroke(0, 120, 215);
    strokeWeight(1);
    
    // Köşe tutamaçları
    rect(this.x - hs/2, this.y - hs/2, hs, hs); // NW
    rect(this.x + this.genislik - hs/2, this.y - hs/2, hs, hs); // NE
    rect(this.x - hs/2, this.y + this.yukseklik - hs/2, hs, hs); // SW
    rect(this.x + this.genislik - hs/2, this.y + this.yukseklik - hs/2, hs, hs); // SE
    
    // Kenar tutamaçları
    rect(this.x + this.genislik/2 - hs/2, this.y - hs/2, hs, hs); // N
    rect(this.x + this.genislik/2 - hs/2, this.y + this.yukseklik - hs/2, hs, hs); // S
    rect(this.x - hs/2, this.y + this.yukseklik/2 - hs/2, hs, hs); // W
    rect(this.x + this.genislik - hs/2, this.y + this.yukseklik/2 - hs/2, hs, hs); // E
}
}

// Boyutlandırma tutamacı kontrolü
this.resizeHandleKontrol = function(mx, my) {
    if (this.secildi != 1) return null;
    
    var hs = 8; // handle hit size
    var handles = {
        'nw': { x: this.x, y: this.y },
        'n':  { x: this.x + this.genislik/2, y: this.y },
        'ne': { x: this.x + this.genislik, y: this.y },
        'w':  { x: this.x, y: this.y + this.yukseklik/2 },
        'e':  { x: this.x + this.genislik, y: this.y + this.yukseklik/2 },
        'sw': { x: this.x, y: this.y + this.yukseklik },
        's':  { x: this.x + this.genislik/2, y: this.y + this.yukseklik },
        'se': { x: this.x + this.genislik, y: this.y + this.yukseklik }
    };
    
    for (var key in handles) {
        if (dist(mx, my, handles[key].x, handles[key].y) < hs) {
            return key;
        }
    }
    return null;
}

this.sec = function(mx, my){ // mouseX, mouseY
// Şekil sınırlarını kontrol et
var icinde = (mx >= this.x && mx <= this.x + this.genislik && my >= this.y && my <= this.y + this.yukseklik);

// Bağlantı noktalarına tıklama kontrolü (artık her zaman aktif)
var ustUzaklik = dist(mx, my, this._üst_bag_x, this._üst_bag_y);
var altUzaklik = dist(mx, my, this._alt_bag_x, this._alt_bag_y);
var solUzaklik = dist(mx, my, this._sol_bag_x, this._sol_bag_y);
var sagUzaklik = dist(mx, my, this._sag_bag_x, this._sag_bag_y);

if (ustUzaklik < 10) {
    this.baglanti_baslat_bitir(1); // 1: Üst
    return false; 
}
if (altUzaklik < 10) {
    this.baglanti_baslat_bitir(2); // 2: Alt
    return false;
}
if (this.alg_sembol == 4) { // Karar için yan noktalar
    if (solUzaklik < 10) {
        this.baglanti_baslat_bitir(4); // 4: Sol (Evet)
        return false;
    }
    if (sagUzaklik < 10) {
        this.baglanti_baslat_bitir(3); // 3: Sağ (Hayır)
        return false;
    }
}

if (icinde) {
this.sür_x = mx - this.x;
this.sür_y = my - this.y;
return true;
}
return false;
}

this.baglanti_baslat_bitir = function(nokta_tipi) { // nokta_tipi: 1(üst), 2(alt), 3(sağ), 4(sol)
// Global değişkenleri kullanıyoruz
if (!baglanti_ciziliyor) {
    baglanti_ciziliyor = true;
    // Dizideki kendi indexini bul
    baglanti_kaynak_index = _deneme.indexOf(this); 
    baglanti_kaynak_nokta = nokta_tipi;
    
    if (nokta_tipi == 1) { 
        baglanti_baslangic_x = this._üst_bag_x; 
        baglanti_baslangic_y = this._üst_bag_y; 
    }
    else if (nokta_tipi == 2) { 
        baglanti_baslangic_x = this._alt_bag_x; 
        baglanti_baslangic_y = this._alt_bag_y; 
    }
    else if (nokta_tipi == 3) { 
        baglanti_baslangic_x = this._sag_bag_x; 
        baglanti_baslangic_y = this._sag_bag_y; 
    }
    else if (nokta_tipi == 4) { 
        baglanti_baslangic_x = this._sol_bag_x; 
        baglanti_baslangic_y = this._sol_bag_y; 
    }
    
    global_konsol_yaz("Bağlantı başlatıldı. Hedef bloğun bağlantı noktasına tıklayın. (ESC: İptal)", "system");
} else {
    baglanti_ciziliyor = false;
    var hedef_index = _deneme.indexOf(this);
    var hedef_nokta = nokta_tipi;
    
    var bag_x, bag_y;
    if (nokta_tipi == 1) { bag_x = this._üst_bag_x; bag_y = this._üst_bag_y; }
    else if (nokta_tipi == 2) { bag_x = this._alt_bag_x; bag_y = this._alt_bag_y; }
    else if (nokta_tipi == 3) { bag_x = this._sag_bag_x; bag_y = this._sag_bag_y; }
    else if (nokta_tipi == 4) { bag_x = this._sol_bag_x; bag_y = this._sol_bag_y; }
    
    // Kendine bağlamayı engelle
    if (baglanti_kaynak_index != hedef_index) {
        // Aynı bağlantı zaten var mı kontrol et
        var mevcutBaglanti = false;
        for (var i = 0; i < _bag.length; i++) {
            if (_bag[i].s_bir_index == baglanti_kaynak_index && _bag[i].s_iki_index == hedef_index && 
                _bag[i].s_bir_d == baglanti_kaynak_nokta && _bag[i].s_iki_d == hedef_nokta) {
                mevcutBaglanti = true;
                break;
            }
        }
        
        if (!mevcutBaglanti) {
            saveState(); // Undo için kaydet
            _bag.push(new sembol_bagla(baglanti_baslangic_x, baglanti_baslangic_y, bag_x, bag_y, 
                                       baglanti_kaynak_index, hedef_index, baglanti_kaynak_nokta, hedef_nokta));
            sessionStorageKaydet(); // Otomatik kaydet
            global_konsol_yaz("✓ Bağlantı oluşturuldu.", "system");
        } else {
            global_konsol_yaz("Bu bağlantı zaten mevcut.", "error");
        }
    } else {
        global_konsol_yaz("Hata: Bir blok kendine bağlanamaz.", "error");
    }
    
    baglanti_kaynak_index = -1;
    baglanti_kaynak_nokta = 0;
}
}

this.sürükle = function(){
if(this.secildi==1 && !baglanti_modu){
this.x = mouseX - this.sür_x;
this.y = mouseY - this.sür_y;
this.bag_noktalarini_guncelle();
}
}
}
