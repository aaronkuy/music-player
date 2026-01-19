const playerContainer = document.querySelector('.player');
const playBtn = document.querySelector('.play-btn');
const playIcon = playBtn.querySelector('i');
const prevBtn = document.querySelector('.skip.back');
const nextBtn = document.querySelector('.skip-next');
const audio = document.querySelector('audio');

const songTitle = document.querySelector('.song-details h2');
const artistName = document.querySelector('.song-details h3');
const songImg = document.querySelector('.song-img');
const nextUpText = document.querySelector('.next-up span');

let songIndex = 0;

const songs = [
    {
        title: "Cartoon",
        artist: "NoCopyrightSounds",
        src: "Cartoon.mp3",
        cover: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAZlBMVEUAAAD////j4+Pm5uYoKCgzMzNdXV3T09OwsLCtra3y8vKbm5sfHx9jY2Pf39/Z2dlqampXV1dPT08aGhqFhYWPj497e3tycnK9vb3z8/MrKys9PT3KysoJCQlHR0c6OjoUFBS4uLjLQjLjAAACVklEQVR4nO3a63LaMBBAYa1FApiAay4JGEOS93/JQgsBO76sYySoer5/zOyAzwBRJGMMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4P+x2974Cx9LY5o2NuT1ZHx8NRpHVWB2H53n7oE1cFz6LiN02DMzkZHh4sI1FZ3IYXqomYx+FIq/KQqsMPBbudZOeCmWkKnzTBh4L149VKMlAUTjuUpg8WKHEz+2Fo3+6UGQVfKHkwReK3SsLN++DRtniqjDZNc56LaxaNioL40X7M18KHVx2B6VCGZcHqgtf2p/5UQsl+SgOhFcom7QwEGBhadkIslDWVwNhFkqUfQ30Lxw6vHyF6kKRt/NA/8J43GCpWHf6uRSW/gc5Lxv9C1s07Nxu4lKYlnas+cJP4eXj4rpwatJN4ZXjuZ9C66/QfJSuatmncKgtlLm/wm973M8ehSt1Yc3O1E1h+aBitrj+o9+pcDcTJb+FZls8bYq/Tte6FpqB9nPqubD2CKlzoTHz1aTe5/0Ka75BPyhsNL1jYXnZcFP4656FJqtYzMIqrDoaDa3w+/l2cIXlZSPAQrPL6wtvsOd5gMLSslE4L90/NTu8x1nzRPb6CIWF/bGjM+87F17vNgItvKoKttCcvy+O7h8epDWv7KvQ7ONzYad7wOrCTVb3yr4KjclPhZ3u46sL6++w+ys0E+n+WwztBrjyruUNpTb6yzZ+G6Y2/nMQ/jKONI6/p1nb9rkoSpaOA/WC/+0UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABw7jfA+iUXAqLePwAAAABJRU5ErkJggg=="
    },
    {
        title: "Warriyo",
        artist: "Warriyo - Mortals",
        src: "Warriyo.mp3",
        cover: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAZlBMVEUAAAD////j4+Pm5uYoKCgzMzNdXV3T09OwsLCtra3y8vKbm5sfHx9jY2Pf39/Z2dlqampXV1dPT08aGhqFhYWPj497e3tycnK9vb3z8/MrKys9PT3KysoJCQlHR0c6OjoUFBS4uLjLQjLjAAACVklEQVR4nO3a63LaMBBAYa1FApiAay4JGEOS93/JQgsBO76sYySoer5/zOyAzwBRJGMMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4P+x2974Cx9LY5o2NuT1ZHx8NRpHVWB2H53n7oE1cFz6LiN02DMzkZHh4sI1FZ3IYXqomYx+FIq/KQqsMPBbudZOeCmWkKnzTBh4L149VKMlAUTjuUpg8WKHEz+2Fo3+6UGQVfKHkwReK3SsLN++DRtniqjDZNc56LaxaNioL40X7M18KHVx2B6VCGZcHqgtf2p/5UQsl+SgOhFcom7QwEGBhadkIslDWVwNhFkqUfQ30Lxw6vHyF6kKRt/NA/8J43GCpWHf6uRSW/gc5Lxv9C1s07Nxu4lKYlnas+cJP4eXj4rpwatJN4ZXjuZ9C66/QfJSuatmncKgtlLm/wm973M8ehSt1Yc3O1E1h+aBitrj+o9+pcDcTJb+FZls8bYq/Tte6FpqB9nPqubD2CKlzoTHz1aTe5/0Ka75BPyhsNL1jYXnZcFP4656FJqtYzMIqrDoaDa3w+/l2cIXlZSPAQrPL6wtvsOd5gMLSslE4L90/NTu8x1nzRPb6CIWF/bGjM+87F17vNgItvKoKttCcvy+O7h8epDWv7KvQ7ONzYad7wOrCTVb3yr4KjclPhZ3u46sL6++w+ys0E+n+WwztBrjyruUNpTb6yzZ+G6Y2/nMQ/jKONI6/p1nb9rkoSpaOA/WC/+0UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABw7jfA+iUXAqLePwAAAABJRU5ErkJggg=="
    },
    {
        title: "Janji",
        artist: "Janji - Heroes Tonight",
        src: "Janji.mp3",
        cover: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOEAAADhCAMAAAAJbSJIAAAAZlBMVEUAAAD////j4+Pm5uYoKCgzMzNdXV3T09OwsLCtra3y8vKbm5sfHx9jY2Pf39/Z2dlqampXV1dPT08aGhqFhYWPj497e3tycnK9vb3z8/MrKys9PT3KysoJCQlHR0c6OjoUFBS4uLjLQjLjAAACVklEQVR4nO3a63LaMBBAYa1FApiAay4JGEOS93/JQgsBO76sYySoer5/zOyAzwBRJGMMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4P+x2974Cx9LY5o2NuT1ZHx8NRpHVWB2H53n7oE1cFz6LiN02DMzkZHh4sI1FZ3IYXqomYx+FIq/KQqsMPBbudZOeCmWkKnzTBh4L149VKMlAUTjuUpg8WKHEz+2Fo3+6UGQVfKHkwReK3SsLN++DRtniqjDZNc56LaxaNioL40X7M18KHVx2B6VCGZcHqgtf2p/5UQsl+SgOhFcom7QwEGBhadkIslDWVwNhFkqUfQ30Lxw6vHyF6kKRt/NA/8J43GCpWHf6uRSW/gc5Lxv9C1s07Nxu4lKYlnas+cJP4eXj4rpwatJN4ZXjuZ9C66/QfJSuatmncKgtlLm/wm973M8ehSt1Yc3O1E1h+aBitrj+o9+pcDcTJb+FZls8bYq/Tte6FpqB9nPqubD2CKlzoTHz1aTe5/0Ka75BPyhsNL1jYXnZcFP4656FJqtYzMIqrDoaDa3w+/l2cIXlZSPAQrPL6wtvsOd5gMLSslE4L90/NTu8x1nzRPb6CIWF/bGjM+87F17vNgItvKoKttCcvy+O7h8epDWv7KvQ7ONzYad7wOrCTVb3yr4KjclPhZ3u46sL6++w+ys0E+n+WwztBrjyruUNpTb6yzZ+G6Y2/nMQ/jKONI6/p1nb9rkoSpaOA/WC/+0UAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABw7jfA+iUXAqLePwAAAABJRU5ErkJggg=="
    }
];

function loadSong(song) {
    songTitle.innerText = song.title;
    artistName.innerText = song.artist;
    songImg.style.backgroundImage = `url('${song.cover}')`;
    audio.src = song.src;
    updateNextUpText();
}

function updateNextUpText() {
    let nextIndex = (songIndex + 1) % songs.length;
    nextUpText.innerText = `${songs[nextIndex].title} by ${songs[nextIndex].artist}`;
}

function playSong() {
    playerContainer.classList.add('playing');
    playIcon.classList.remove('fa-play');
    playIcon.classList.add('fa-pause');
    audio.play();
}

function pauseSong() {
    playerContainer.classList.remove('playing');
    playIcon.classList.remove('fa-pause');
    playIcon.classList.add('fa-play');
    audio.pause();
}

playBtn.addEventListener('click', () => {
    const isPlaying = playerContainer.classList.contains('playing');
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});

prevBtn.addEventListener('click', () => {
    songIndex = (songIndex - 1 + songs.length) % songs.length;
    loadSong(songs[songIndex]);
    playSong();
});

nextBtn.addEventListener('click', () => {
    songIndex = (songIndex + 1) % songs.length;
    loadSong(songs[songIndex]);
    playSong();
});

loadSong(songs[songIndex]);