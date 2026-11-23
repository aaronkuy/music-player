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
        title: "Paper Lanterns",
        artist: "Generated loop · C major · 80 BPM",
        src: "assets/audio/paper-lanterns.m4a",
        cover: "assets/covers/paper-lanterns.svg"
    },
    {
        title: "Night Tram",
        artist: "Generated loop · C major · 86 BPM",
        src: "assets/audio/night-tram.m4a",
        cover: "assets/covers/night-tram.svg"
    },
    {
        title: "Low Tide",
        artist: "Generated loop · D major · no beat",
        src: "assets/audio/low-tide.m4a",
        cover: "assets/covers/low-tide.svg"
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
    nextUpText.innerText = songs[nextIndex].title;
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
