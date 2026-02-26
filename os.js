// --- OS.JS: Lógica Visual del Sistema Operativo Windows XP ---

function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12; hours = hours ? hours : 12; 
    document.getElementById('clock').innerText = `${hours}:${minutes} ${ampm}`;
}
setInterval(updateClock, 1000);
updateClock(); 

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const login = document.getElementById('login-screen');
        if(login) {
            login.style.opacity = '0';
            setTimeout(() => { 
                login.style.display = 'none'; 
                document.getElementById('snd-startup').play().catch(()=>{});
            }, 500);
        }
        
        window.openWindow('folder-images', 'Mis Imágenes', 'https://win98icons.alexmeub.com/icons/png/directory_closed-4.png');
        window.openWindow('folder-videos', 'Mis Videos', 'https://win98icons.alexmeub.com/icons/png/directory_open_file_mydocs-4.png');
        window.openWindow('notepad-leeme', 'LEEME.txt', 'https://win98icons.alexmeub.com/icons/png/notepad_file-0.png');
    }, 2000);

    document.querySelectorAll('.desktop-icon').forEach(makeIconDraggable);
});

let zIndexCounter = 100;
const activeWindows = {};

window.openWindow = function(id, title, iconSrc) {
    const win = document.getElementById(id);
    if(!win) return;
    win.classList.remove('hidden', 'minimized');
    win.style.zIndex = ++zIndexCounter;

    if (!activeWindows[id] && title) {
        activeWindows[id] = true;
        const tbContainer = document.getElementById('taskbar-windows');
        const btn = document.createElement('div');
        btn.className = 'taskbar-item active';
        btn.id = 'taskbar-btn-' + id;
        btn.innerHTML = `<img src="${iconSrc}" width="16"> <span>${title}</span>`;
        btn.onclick = () => window.toggleWindow(id);
        tbContainer.appendChild(btn);
    }
    updateTaskbar();
};

window.closeWindow = function(id, e) {
    if (e) e.stopPropagation(); 
    const win = document.getElementById(id);
    if(win) { win.classList.add('hidden'); win.classList.remove('maximized'); }
    
    if (activeWindows[id]) {
        delete activeWindows[id];
        const btn = document.getElementById('taskbar-btn-' + id);
        if(btn) btn.remove();
    }
    if (id === 'soundamp-player' && window.scStop) window.scStop();
    if (id === 'media-viewer') document.getElementById('viewer-iframe').src = '';
    updateTaskbar();
};

window.minimizeWindow = function(id, e) {
    if (e) e.stopPropagation();
    const win = document.getElementById(id);
    if(win) win.classList.add('minimized');
    updateTaskbar();
};

window.maximizeWindow = function(id, e) {
    if (e) e.stopPropagation();
    const win = document.getElementById(id);
    if(win) win.classList.toggle('maximized');
};

window.toggleWindow = function(id) {
    const win = document.getElementById(id);
    if(!win) return;
    if (win.classList.contains('minimized')) {
        win.classList.remove('minimized'); win.style.zIndex = ++zIndexCounter;
    } else {
        if (parseInt(win.style.zIndex) === zIndexCounter) win.classList.add('minimized'); 
        else win.style.zIndex = ++zIndexCounter; 
    }
    updateTaskbar();
};

function updateTaskbar() {
    for (let id in activeWindows) {
        const btn = document.getElementById('taskbar-btn-' + id);
        const win = document.getElementById(id);
        if (btn && win) {
            if (!win.classList.contains('minimized') && parseInt(win.style.zIndex) === zIndexCounter) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    }
}

function makeDraggableWindow(win) {
    const titlebar = win.querySelector('.os-titlebar') || win.querySelector('.wa-titlebar');
    if (!titlebar) return;
    win.addEventListener('mousedown', () => { win.style.zIndex = ++zIndexCounter; updateTaskbar(); });

    titlebar.addEventListener('mousedown', (e) => {
        if(e.target.closest('.os-controls') || e.target.closest('.wa-controls')) return;
        if(win.classList.contains('maximized')) return;
        e.preventDefault();
        let pos3 = e.clientX, pos4 = e.clientY;
        
        function elementDrag(e2) {
            e2.preventDefault();
            win.style.top = Math.max(0, win.offsetTop - (pos4 - e2.clientY)) + "px";
            win.style.left = (win.offsetLeft - (pos3 - e2.clientX)) + "px";
            pos3 = e2.clientX; pos4 = e2.clientY;
        }
        function closeDragElement() { document.removeEventListener('mouseup', closeDragElement); document.removeEventListener('mousemove', elementDrag); }
        document.addEventListener('mouseup', closeDragElement); document.addEventListener('mousemove', elementDrag);
    });
}
document.querySelectorAll('.window-container').forEach(makeDraggableWindow);

function makeIconDraggable(elmnt) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    elmnt.onmousedown = (e) => {
        e.preventDefault(); pos3 = e.clientX; pos4 = e.clientY;
        document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
        document.onmousemove = (e2) => {
            e2.preventDefault();
            pos1 = pos3 - e2.clientX; pos2 = pos4 - e2.clientY;
            pos3 = e2.clientX; pos4 = e2.clientY;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        };
    };
}

window.toggleStartMenu = function(e) { 
    if(e) e.stopPropagation();
    const sm = document.getElementById('start-menu');
    const btn = document.getElementById('start-btn');
    if(sm && btn) {
        sm.style.display = sm.style.display === 'flex' ? 'none' : 'flex';
        btn.classList.toggle('active');
        document.getElementById('context-menu').style.display = 'none';
        document.getElementById('restore-menu').style.display = 'none';
    }
};

document.addEventListener('click', (e) => {
    const sm = document.getElementById('start-menu');
    const btn = document.getElementById('start-btn');
    if (sm && sm.style.display === 'flex' && !sm.contains(e.target) && !e.target.closest('#start-btn')) {
        sm.style.display = 'none'; btn.classList.remove('active');
    }
    if (e.target.id !== 'desktop-area' && !e.target.closest('#trashed-video')) {
        document.getElementById('context-menu').style.display = 'none';
        document.getElementById('restore-menu').style.display = 'none';
    }
});

const bgImages = [
    "https://static.boredpanda.com/blog/wp-content/uploads/2017/06/DSC00330-Edit-59391339deded__880.jpg",
    "https://upload.wikimedia.org/wikipedia/en/2/27/Bliss_%28Windows_XP%29.png",
    "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1920&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1920&auto=format&fit=crop"
];
let bgIndex = 0;
window.changeBackground = function() {
    bgIndex = (bgIndex + 1) % bgImages.length;
    document.body.style.backgroundImage = `url('${bgImages[bgIndex]}')`;
};

document.getElementById('desktop-area').addEventListener('contextmenu', (e) => {
    if(e.target.id === 'desktop-area') {
        e.preventDefault();
        const ctx = document.getElementById('context-menu');
        ctx.style.display = 'flex'; ctx.style.left = e.pageX + 'px'; ctx.style.top = e.pageY + 'px';
    }
});

window.showRestoreMenu = function(e) {
    e.preventDefault(); e.stopPropagation();
    const rMenu = document.getElementById('restore-menu');
    rMenu.style.display = 'flex'; rMenu.style.left = e.pageX + 'px'; rMenu.style.top = e.pageY + 'px';
    document.getElementById('context-menu').style.display = 'none'; 
};

window.restoreVideo = function() {
    document.getElementById('restore-menu').style.display = 'none';
    const trashedVid = document.getElementById('trashed-video');
    if(trashedVid) {
        trashedVid.remove();
        document.querySelector('#icon-trash img').src = 'https://win98icons.alexmeub.com/icons/png/recycle_bin_empty-4.png';
        const videoGrid = document.getElementById('videos-grid');
        const newVid = document.createElement('div');
        newVid.className = 'file-item';
        newVid.onclick = () => window.openVideo('VkqwETnA510', 'FBLA.avi');
        newVid.innerHTML = `<img class="file-thumb" src="https://img.youtube.com/vi/VkqwETnA510/hqdefault.jpg"><span>FBLA.avi</span>`;
        if(videoGrid) videoGrid.appendChild(newVid);
        document.getElementById('snd-trash').play().catch(()=>{});
    }
};

window.emptyTrash = function() {
    document.getElementById('snd-error').play().catch(()=>{});
    window.openWindow('error-window');
}

// SALVAPANTALLAS (Actualizado)
let idleTime = 0;
const ss = document.getElementById('screensaver');
const ssLogo = document.getElementById('ss-text');
let dx = 4, dy = 4, ssX = window.innerWidth/2, ssY = window.innerHeight/2;

window.triggerScreensaver = function() { 
    if(ss) { ss.style.display = 'block'; document.getElementById('context-menu').style.display = 'none'; animateScreensaver(); }
};
function animateScreensaver() {
    if(ss.style.display === 'none') return;
    let hit = false;
    if(ssX <= 0 || ssX + ssLogo.offsetWidth >= window.innerWidth) { dx = -dx; hit = true; }
    if(ssY <= 0 || ssY + ssLogo.offsetHeight >= window.innerHeight) { dy = -dy; hit = true; }
    ssX += dx; ssY += dy;
    ssLogo.style.left = ssX + 'px'; ssLogo.style.top = ssY + 'px';
    if (hit) ssLogo.style.color = `hsl(${Math.random()*360}, 100%, 50%)`;
    requestAnimationFrame(animateScreensaver);
}
document.addEventListener('mousemove', () => { idleTime = 0; if(ss) ss.style.display = 'none'; });
document.addEventListener('keydown', () => { idleTime = 0; if(ss) ss.style.display = 'none'; });
setInterval(() => { idleTime++; if (idleTime >= 60 && ss && ss.style.display === 'none') window.triggerScreensaver(); }, 1000);

// VISOR MULTIMEDIA
const mediaImages = [
    { src: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgPsdaTj9ebqPIdCv8cc0ofCD7OjIh7y264BCYUvoTINijmxaU6LJVrMgh1lpkAD1bH-Wn62BIWjQczsNkF8cHSakDbgeLFDdnUhZyZhzOgVYSqu9phnU4HutjuZOCgHjt6Dk2Vs9kUDnw/s1600/Dla_prov.jpg", title: "Dla_prov.jpg" },
    { src: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_JczWFySWlfOX7f5xAELbDkjKwvgxlWwgPnmdD5DTvnp_zicjcrshyphenhyphen78lee2I-MEP2LglMxmBo-Jpgf4BPRRLFs6C0CfjXKdSQW5T9Rf9XRCUG6FbC86Wsx30W_Q3uKKdp1az7h3cvpw/s1600/EPR.jpg", title: "EPR.jpg" },
    { src: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgHuIyhlzrd5RO2p7NVkoIBJ06uSDTtIzCQ_Pe6ctGmPtJ8_7Np7CLlAOIbXQRtsa09hyphenhyphenVQObMuVTSNRDJpgU9h5-DyNAWEvPRXyCw_OolRyC6KqGyl3kQUSWQDLFXhF9qwWHbRem3S_cs/s1600/De+las+Aguas.jpg", title: "De_las_Aguas.jpg" },
    { src: "https://iili.io/qfCtFrg.jpg", title: "Samurai.jpg" },
    { src: "https://iili.io/qfCD3t2.jpg", title: "Koala.jpg" }
];
let currentImageIndex = 0;

window.openImage = function(index) {
    currentImageIndex = index;
    window.openWindow('media-viewer', mediaImages[index].title, 'https://win98icons.alexmeub.com/icons/png/image_file-0.png');
    document.getElementById('media-title').innerHTML = `<img src="https://win98icons.alexmeub.com/icons/png/image_file-0.png"> Visor de imágenes`;
    document.getElementById('viewer-iframe').style.display = 'none';
    document.getElementById('viewer-image').style.display = 'block';
    document.getElementById('viewer-image').src = mediaImages[index].src;
    document.getElementById('media-viewer-toolbar').classList.add('active');
};

window.openVideo = function(videoId, title) {
    window.openWindow('media-viewer', title, 'https://win98icons.alexmeub.com/icons/png/video_file-0.png');
    document.getElementById('media-title').innerHTML = `<img src="https://win98icons.alexmeub.com/icons/png/video_file-0.png"> ${title}`;
    document.getElementById('viewer-image').style.display = 'none';
    document.getElementById('media-viewer-toolbar').classList.remove('active');
    document.getElementById('viewer-iframe').style.display = 'block';
    document.getElementById('viewer-iframe').src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
};

window.closeViewer = function(e) { window.closeWindow('media-viewer', e); };
window.prevImage = function() { currentImageIndex = (currentImageIndex - 1 + mediaImages.length) % mediaImages.length; window.openImage(currentImageIndex); };
window.nextImage = function() { currentImageIndex = (currentImageIndex + 1) % mediaImages.length; window.openImage(currentImageIndex); };