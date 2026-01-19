var ozellik_menu_obj = {
    drag_bag_aktif: false,
    drag_x1: 0,
    drag_y1: 0,
    
    guncelle: function(sekil) {
        if(!sekil) {
            document.querySelector('.no-selection').style.display = 'block';
            document.getElementById('prop-form').style.display = 'none';
            return;
        }

        document.querySelector('.no-selection').style.display = 'none';
        document.getElementById('prop-form').style.display = 'block';
        
        // Değerleri doldur
        document.getElementById('prop-text').value = sekil.yazi;

        // Renkleri Doldur
        var fillInput = document.getElementById('prop-fill-color');
        var textInput = document.getElementById('prop-text-color');
        if(fillInput) fillInput.value = sekil.arkaPlanRengi || "#ffffff";
        if(textInput) textInput.value = sekil.yaziRengi || "#000000";
        
        // Kod alanı
        var codeGroup = document.getElementById('code-group');
        var lblCode = document.getElementById('lbl-code');
        var container = document.getElementById('var-group-container');
        
        // Kod alanını temizle ve doldur
        document.getElementById('prop-code').value = sekil.kod_satiri || ""; 
        
        if (sekil.alg_sembol == 1) { // İşlem
             container.style.display = 'block';
             lblCode.innerText = "İşlem Kodu (örn: x = 5):";
        } else if (sekil.alg_sembol == 2) { // Giriş/Çıkış
             container.style.display = 'block';
             lblCode.innerText = "Çıktı Değeri / Değişken:";
        } else if (sekil.alg_sembol == 4) { // Karar
             container.style.display = 'block';
             lblCode.innerText = "Koşul (örn: x > 10):";
        } else {
             container.style.display = 'none';
        }
    }
};

function ozellik_menu(x,y){
// Eski constructor, geriye uyumluluk için boş bırakıldı veya kaldırılabilir.
    // Artık HTML tabanlı arayüz kullanıyoruz.
}
