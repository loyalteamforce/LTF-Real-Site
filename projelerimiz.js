// ===== PROJELERİMİZ SAYFASI JAVASCRIPT =====
// Loyal Team Force - Siyah + Sarı Tema

// SAYFA YÜKLENDİĞİNDE
document.addEventListener('DOMContentLoaded', function() {
    
    // LOADING - 1 saniye sonra kaybol
    setTimeout(function() {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
        }
    }, 800);
    
    // HAMBURGER MENU
    const menuBtn = document.getElementById('menuBtn');
    const sideMenu = document.getElementById('sideMenu');
    
    if (menuBtn && sideMenu) {
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            menuBtn.classList.toggle('open');
            sideMenu.classList.toggle('open');
        });
        
        // Menü dışına tıklandığında kapat
        document.addEventListener('click', function(e) {
            if (!sideMenu.contains(e.target) && !menuBtn.contains(e.target)) {
                sideMenu.classList.remove('open');
                menuBtn.classList.remove('open');
            }
        });
    }
    
    // PROJE VERİLERİ
    const projects = {
        p1: {
            title: "Lost Spirit Whisper",
            desc: "Gizem ve macera dolu bir oyun projesi",
            content: `Lost Spirit Whisper, gizemli bir dünyada geçen, oyuncuların hayaletlerle iletişim kurarak sırları çözdüğü bir macera oyunudur. Proje kapsamında özgün hikaye, karakter tasarımları ve atmosferik müzikler yer alacak. Şu anda %45 tamamlanma seviyesinde.`
        },
        p2: {
            title: "LTF Web Platform",
            desc: "Ekip yönetim ve iletişim platformu",
            content: `LTF Web Platform, ekip üyelerinin projeleri takip edebileceği, görev dağılımı yapabileceği ve iletişim kurabileceği kapsamlı bir yönetim sistemidir. Dashboard, görev takibi, mesajlaşma ve dosya paylaşımı özellikleri içerecek. %80 tamamlandı.`
        },
        p3: {
            title: "Cyber Arena",
            desc: "Çok oyunculu online arena oyunu",
            content: `Cyber Arena, futuristik bir dünyada geçen, oyuncuların birbirleriyle mücadele ettiği hızlı tempolu bir arena oyunudur. Farklı karakter sınıfları, yetenekler ve stratejik oynanış sunmayı hedefliyor. Şu anda %20 seviyesinde.`
        },
        p4: {
            title: "AI Assistant",
            desc: "Yapay zeka destekli discord botu",
            content: `AI Assistant, discord sunucuları için geliştirilmiş yapay zeka destekli bir bottur. Moderasyon, eğlence, müzik ve yardım komutlarının yanı sıra doğal dil işleme özellikleriyle kullanıcılarla sohbet edebilir. Beta aşamasında ve %95 tamamlandı.`
        },
        p5: {
            title: "Güvenlik Duvarı",
            desc: "Gelişmiş ağ güvenlik sistemi",
            content: `Güvenlik Duvarı projesi, ağ trafiğini analiz eden, zararlı yazılımları tespit eden ve saldırıları engelleyen gelişmiş bir güvenlik sistemidir. Kurumsal kullanım için tasarlanıyor. Planlama aşamasında, %10 tamamlandı.`
        },
        p6: {
            title: "LTF Mobile",
            desc: "Mobil uygulama arayüzü",
            content: `LTF Mobile, ekip üyelerinin mobil cihazlardan projeleri takip edebilmesi ve iletişim kurabilmesi için tasarlanan mobil uygulamadır. iOS ve Android platformları için geliştiriliyor. Tasarım aşamasında, %30 tamamlandı.`
        },
        p7: {
            title: "Veri Analiz",
            desc: "Ekip performans takip sistemi",
            content: `Veri Analiz projesi, ekip üyelerinin performansını takip eden, raporlar oluşturan ve verileri görselleştiren bir analiz platformudur. Liderlik tablosu, istatistikler ve grafikler içerir. %60 tamamlandı.`
        },
        p8: {
            title: "Cloud Storage",
            desc: "Bulut depolama çözümleri",
            content: `Cloud Storage, ekip üyelerinin dosyalarını güvenli bir şekilde depolayabileceği, paylaşabileceği ve senkronize edebileceği bulut depolama sistemidir. Yakında geliştirilmeye başlanacak. %15 tamamlandı.`
        }
    };
    
    // Ana sayfayı göster
    window.showHome = function() {
        const homePage = document.getElementById('home-page');
        const detailPage = document.getElementById('detail-page');
        
        if (homePage && detailPage) {
            homePage.classList.add('active');
            detailPage.classList.remove('active');
        }
    };
    
    // Proje detayını göster
    window.showProjectDetail = function(projectId) {
        const project = projects[projectId];
        if (!project) return;
        
        const detailTitle = document.getElementById('detailTitle');
        const detailDesc = document.getElementById('detailDesc');
        const detailContent = document.getElementById('detailContent');
        const homePage = document.getElementById('home-page');
        const detailPage = document.getElementById('detail-page');
        
        if (detailTitle && detailDesc && detailContent && homePage && detailPage) {
            detailTitle.innerHTML = project.title;
            detailDesc.innerHTML = project.desc;
            detailContent.innerHTML = project.content;
            
            homePage.classList.remove('active');
            detailPage.classList.add('active');
        }
    };
    
    // Proje kartlarına tıklama
    const projectCards = document.querySelectorAll('.project');
    projectCards.forEach(project => {
        project.addEventListener('click', function() {
            const projectId = this.dataset.id;
            if (projectId) {
                window.showProjectDetail(projectId);
            }
        });
    });
    
    // Geri butonu
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.showHome();
        });
    }
    
    // Sidebar linkleri
    const sidebarLinks = document.querySelectorAll('.sidebar .link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // data-target varsa proje detayına git
            const target = this.dataset.target;
            if (target) {
                if (target === 'home') {
                    window.showHome();
                } else {
                    window.showProjectDetail(target);
                }
            }
        });
    });
    
    console.log('Projeler sayfası başarıyla yüklendi!');
});