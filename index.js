//Fetch all the HTML elements 
const playerContainer = document.querySelector('.player');
const playBtn = document.querySelector('.play-btn');
const playIcon = playBtn.querySelector('i');
const prevBtn = document.querySelector('.skip.back');
const nextBtn = document.querySelector('.skip-next');
//Important element to enable the sound function within the DOM 
const audio = document.querySelector('audio');

const songTitle = document.querySelector('.song-details h2');
const artistName = document.querySelector('.song-details h3');
const songImg = document.querySelector('.song-img');
const nextUpText = document.querySelector('.next-up span');
//Default value of the song is the first one
let songIndex = 0;
//Array of the predetermined songs, by default a quantity of 3
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
//Allocate the information of the song to HTML 
function loadSong(song) {
    songTitle.innerText = song.title;
    artistName.innerText = song.artist;
    songImg.style.backgroundImage = `url('${song.cover}')`;
    audio.src = song.src;
    updateNextUpText();
}

function updateNextUpText() {
    //Mini reckoning to display what the next song is e.g. '0 + 1 % 3 = 1'
    //so the next song is index 1, means the second one
    let nextIndex = (songIndex + 1) % songs.length;
    //Extract the information of the index of the array from the keys title and artist
    //to 'nextUpText'
    nextUpText.innerText = `${songs[nextIndex].title} by ${songs[nextIndex].artist}`;
}
//Shift the default values when the user presses the play button
function playSong() {
    //Save the key word 'playing'
    playerContainer.classList.add('playing');
    //The symbol is shifting to the pause button due to the situation
    //that the user pressed the play button
    playIcon.classList.remove('fa-play');
    playIcon.classList.add('fa-pause');
    //Initiates the audio function 
    audio.play();
}
//Here's nearly the same just vice versa 
function pauseSong() {
    playerContainer.classList.remove('playing');
    playIcon.classList.remove('fa-pause');
    playIcon.classList.add('fa-play');
    audio.pause();
}
//If the user presses the 'play' button allocate the string to the corresponded variable
//If this condition appears to be true, then initiate the pauseSong function, else play the song
playBtn.addEventListener('click', () => {
    const isPlaying = playerContainer.classList.contains('playing');
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});
//If the user want to go one song before, e.g. '1  - 1 + 3 = 3 % 3 = 0 
//so if we were by index one, we would go back to index zero
prevBtn.addEventListener('click', () => {
    songIndex = (songIndex - 1 + songs.length) % songs.length;
    //Initiate the loadSong() function by selecting the right entry of the array
    //with the previous reckoned index
    loadSong(songs[songIndex]);
    playSong();
});
//Here is the same reckoning but with the forward button 
nextBtn.addEventListener('click', () => {
    songIndex = (songIndex + 1) % songs.length;
    loadSong(songs[songIndex]);
    playSong();
});
//If the user clicks on the forward button the information of the reckoned index 
//is getting allocated to the loadSong function as a parameter 
loadSong(songs[songIndex]);
