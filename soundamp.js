// --- SOUNDAMP.JS: Lógica del Reproductor de Música ---

let soundAmpWidget = null;
let trackDurationMs = 601000; 
let isSeeking = false;

document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.getElementById('sc-widget');
    if(typeof SC !== 'undefined' && iframe) {
        soundAmpWidget = SC.Widget(iframe);
        const seekSlider = document.getElementById('wa-seek-slider');
        const timeDisplay = document.getElementById('wa-time-display');

        soundAmpWidget.bind(SC.Widget.Events.READY, () => {
            soundAmpWidget.getDuration((duration) => { trackDurationMs = duration; });
        });

        soundAmpWidget.bind(SC.Widget.Events.PLAY_PROGRESS, (data) => {
            if (!isSeeking && seekSlider) {
                seekSlider.value = (data.currentPosition / trackDurationMs) * 100;
            }
            let s = Math.floor(data.currentPosition / 1000);
            let m = Math.floor(s / 60); s = s % 60;
            const timeStr = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
            if(timeDisplay) timeDisplay.innerText = timeStr;
            const timeLine = document.getElementById('wa-current-time-line');
            if(timeLine) timeLine.innerText = timeStr;
        });

        const volSlider = document.getElementById('wa-vol-slider');
        if(volSlider) {
            volSlider.addEventListener('input', function(e) {
                if(soundAmpWidget) soundAmpWidget.setVolume(e.target.value);
            });
        }

        if(seekSlider) {
            seekSlider.addEventListener('mousedown', () => { isSeeking = true; });
            seekSlider.addEventListener('input', (e) => {
                let percent = e.target.value / 100;
                let targetTimeMs = percent * trackDurationMs;
                let s = Math.floor(targetTimeMs / 1000);
                let m = Math.floor(s / 60); s = s % 60;
                if(timeDisplay) timeDisplay.innerText = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
            });
            seekSlider.addEventListener('mouseup', (e) => {
                isSeeking = false;
                let percent = e.target.value / 100;
                let targetTimeMs = percent * trackDurationMs;
                if(soundAmpWidget) soundAmpWidget.seekTo(targetTimeMs);
            });
        }
    }
});

window.scPlay = function() {
    if(soundAmpWidget) { soundAmpWidget.play(); document.getElementById('visualizer').classList.add('playing'); }
};
window.scPause = function() {
    if(soundAmpWidget) { soundAmpWidget.pause(); document.getElementById('visualizer').classList.remove('playing'); }
};
window.scStop = function() {
    if(soundAmpWidget) {
        soundAmpWidget.pause(); soundAmpWidget.seekTo(0);
        document.getElementById('visualizer').classList.remove('playing');
        document.getElementById('wa-time-display').innerText = "00:00";
        document.getElementById('wa-seek-slider').value = 0;
    }
};