var _tekrar=0;
var _bag_index_sim = 0;
var simulasyon_hizi = 1000; // ms cinsinden

function simülasyon(){

    this.aktif = false;
    this.timer = null;
    this.suanki_sekil_index = -1;

    this.analiz  = function(){
        // Başlangıç noktasını bul
        this.suanki_sekil_index = -1;
        for(let ara = 0;  ara<_deneme.length;ara++){
             if(_deneme[ara].yazi=='BAŞLAT' && _deneme[ara].alg_sembol==3){
                 this.suanki_sekil_index = ara; 
                 break;
             }
        }
        
        if (this.suanki_sekil_index == -1) {
            global_konsol_yaz("HATA: 'BAŞLAT' bloğu bulunamadı!", "error");
            return false;
        }
        
        global_konsol_yaz("Analiz tamam. Başlangıç bulundu.", "log");
        return true;
    }

    this.calistir = function() {
        if(this.timer) { clearInterval(this.timer); }
        
        // Her zaman yeniden analiz yap
        if(!this.analiz()) return;

        this.aktif = true;
        var self = this;
        
        // Hızı güncel değerden al
        this.timer = setInterval(function() {
            self.tekAdim();
        }, simulasyon_hizi); 
    }
    
    this.adimIlerle = function() {
        if(this.timer) { 
             clearInterval(this.timer); 
             this.timer = null;
             this.aktif = false;
        }
        
        if(this.suanki_sekil_index == -1) {
             if(!this.analiz()) return;
             this.aktif = true;
        }
        
        this.tekAdim();
    }
    
    this.tekAdim = function() {
        var self = this;
        var suankiSekil = _deneme[self.suanki_sekil_index];
        
        if (!suankiSekil) {
            self.durdur();
            return;
        }

        // Görsel İşaretleme
        for(var i=0; i<_deneme.length; i++) {
             _deneme[i].secildi = 0;
        }
        suankiSekil.secildi = 1;

        // Eğer DURDUR ise bitir
        if(suankiSekil.yazi == 'DURDUR') {
            global_konsol_yaz("Simülasyon tamamlandı.", "log");
            self.durdur();
            return;
        }
        
        // --- GÖREVİ YÜRÜT ---
        var sonuc = suankiSekil.gorev();
        
        // --- BİR SONRAKİ ADIMI BUL ---
        var hedefNoktaTipi = 2; // Varsayılan Alt
        
        if (suankiSekil.alg_sembol == 4) { // Karar Bloğu
            if (sonuc === true) {
                hedefNoktaTipi = 4; // Sol (Evet)
                global_konsol_yaz("Yol: EVET (Sol)", "log");
            } else {
                hedefNoktaTipi = 3; // Sağ (Hayır)
                global_konsol_yaz("Yol: HAYIR (Sağ)", "log");
            }
        }
    
        var nextIndex = -1;
        for(let b=0; b<_bag.length; b++) {
            if (_bag[b].s_bir_index == self.suanki_sekil_index && _bag[b].s_bir_d == hedefNoktaTipi) {
                nextIndex = _bag[b].s_iki_index;
                break;
            }
        }
    
        if (nextIndex != -1) {
            self.suanki_sekil_index = nextIndex;
        } else {
            global_konsol_yaz("HATA: Akış koptu. Bir sonraki bağlantı bulunamadı.", "error");
            self.durdur();
        }
    }
    
    this.durdur = function() {
        this.aktif = false;
        if(this.timer) clearInterval(this.timer);
        this.timer = null;
        this.suanki_sekil_index = -1;
        for(var i=0; i<_deneme.length; i++) _deneme[i].secildi = 0;
    }
}

// Hız kontrol fonksiyonları
function hiziArtir() {
    if (simulasyon_hizi > 100) {
        simulasyon_hizi -= 100;
    } else if (simulasyon_hizi > 50) {
        simulasyon_hizi = 50;
    }
    document.getElementById('sim-speed').innerText = simulasyon_hizi;
    
    // Eğer simülasyon çalışıyorsa, yeni hızla yeniden başlat
    if (deneme_sim && deneme_sim.aktif && deneme_sim.timer) {
        clearInterval(deneme_sim.timer);
        deneme_sim.timer = setInterval(function() {
            deneme_sim.tekAdim();
        }, simulasyon_hizi);
    }
}

function hiziAzalt() {
    if (simulasyon_hizi < 2000) {
        simulasyon_hizi += 100;
    }
    document.getElementById('sim-speed').innerText = simulasyon_hizi;
    
    // Eğer simülasyon çalışıyorsa, yeni hızla yeniden başlat
    if (deneme_sim && deneme_sim.aktif && deneme_sim.timer) {
        clearInterval(deneme_sim.timer);
        deneme_sim.timer = setInterval(function() {
            deneme_sim.tekAdim();
        }, simulasyon_hizi);
    }
}
