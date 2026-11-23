'use strict';

// Wires the page to the <audio> element. The playlist and the calculations
// (tracks, wrapIndex, formatTime, previousTarget, seekTarget) come from playlist.js.

(function () {
    const SEEK_STEP_SECONDS = 5;

    const player = document.querySelector('.player');
    const audio = document.getElementById('audio');
    const cover = document.querySelector('.cover-img');
    const title = document.querySelector('.track-title');
    const detail = document.querySelector('.track-detail');
    const nextUp = document.querySelector('.next-up span');
    const status = document.querySelector('.status');
    const seek = document.querySelector('.seek');
    const timeCurrent = document.querySelector('.time-current');
    const timeTotal = document.querySelector('.time-total');
    const playButton = document.querySelector('[data-action="toggle"]');
    const previousButton = document.querySelector('[data-action="previous"]');
    const nextButton = document.querySelector('[data-action="next"]');

    let trackIndex = 0;

    function loadTrack(index, { autoplay }) {
        trackIndex = wrapIndex(index, tracks.length);
        const track = tracks[trackIndex];
        title.textContent = track.title;
        detail.textContent = track.detail;
        cover.src = track.cover;
        nextUp.textContent = tracks[wrapIndex(trackIndex + 1, tracks.length)].title;
        status.textContent = '';
        audio.src = track.src;
        renderProgress();
        if (autoplay) play();
    }

    function play() {
        // play() returns a promise. It rejects when the browser blocks playback
        // or the file cannot be loaded.
        audio.play().catch((error) => {
            // Loading another track while this one was still starting is not a failure.
            if (error.name === 'AbortError') return;
            // A file that cannot be loaded is reported by the "error" listener below.
            if (!audio.error) {
                status.textContent = error.name === 'NotAllowedError'
                    ? 'The browser blocked playback. Press play again.'
                    : `"${tracks[trackIndex].title}" could not be played.`;
            }
            renderPlayState();
        });
    }

    // The button and the spinning cover follow the <audio> element, not the
    // clicks. That keeps them right when playback changes without a click:
    // a track ends, a media key is pressed, the headphones are unplugged.
    function renderPlayState() {
        const playing = !audio.paused && !audio.ended && !audio.error;
        player.classList.toggle('is-playing', playing);
        playButton.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    }

    function renderProgress() {
        const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
        const current = Math.min(audio.currentTime, duration);
        seek.max = duration || 1;
        seek.value = current;
        seek.disabled = duration === 0;
        // The filled part of the bar is drawn in CSS from this value.
        seek.style.setProperty('--played', duration ? `${(current / duration) * 100}%` : '0%');
        seek.setAttribute('aria-valuetext', `${formatTime(current)} of ${formatTime(duration)}`);
        timeCurrent.textContent = formatTime(current);
        timeTotal.textContent = formatTime(duration);
    }

    function togglePlay() {
        if (audio.paused) {
            play();
        } else {
            audio.pause();
        }
    }

    // Changing the track keeps the current mode: a paused player stays paused.
    function next() {
        loadTrack(trackIndex + 1, { autoplay: !audio.paused });
    }

    function previous() {
        const target = previousTarget(trackIndex, audio.currentTime, tracks.length);
        if (target.restart) {
            audio.currentTime = 0;
        } else {
            loadTrack(target.index, { autoplay: !audio.paused });
        }
    }

    function seekBy(delta) {
        audio.currentTime = seekTarget(audio.currentTime, delta, audio.duration);
    }

    playButton.addEventListener('click', togglePlay);
    nextButton.addEventListener('click', next);
    previousButton.addEventListener('click', previous);

    seek.addEventListener('input', () => {
        audio.currentTime = Number(seek.value);
    });

    // "emptied" fires when a new source replaces a playing one.
    for (const type of ['play', 'pause', 'emptied']) {
        audio.addEventListener(type, renderPlayState);
    }
    for (const type of ['timeupdate', 'durationchange', 'emptied', 'seeked']) {
        audio.addEventListener(type, renderProgress);
    }

    audio.addEventListener('ended', () => {
        loadTrack(trackIndex + 1, { autoplay: true });
    });

    audio.addEventListener('error', () => {
        status.textContent = `"${tracks[trackIndex].title}" could not be loaded.`;
        renderPlayState();
    });

    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        // Buttons, links and the seek bar already react to Space and the arrow keys.
        const onControl = event.target.closest('button, input, a') !== null;

        switch (event.key) {
            case ' ':
                if (onControl) return;
                togglePlay();
                break;
            case 'ArrowRight':
                if (onControl) return;
                seekBy(SEEK_STEP_SECONDS);
                break;
            case 'ArrowLeft':
                if (onControl) return;
                seekBy(-SEEK_STEP_SECONDS);
                break;
            case 'n':
            case 'N':
                next();
                break;
            case 'p':
            case 'P':
                previous();
                break;
            default:
                return;
        }
        event.preventDefault();
    });

    loadTrack(0, { autoplay: false });
})();
