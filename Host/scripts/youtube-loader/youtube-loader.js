let YTLoader = {
  currentPlayingTime: 0,
  playerReady: false,
  player: null,

  init: () => {
  },

  // Events
  onYouTubeIframeAPIReady: () => {
    YTLoader.player = new window.YT.Player("player", {
      height: "90%",
      width: "90%",
      videoId: "M7lc1UVf-VE",
      playerVars: {
        playsinline: 1,
      },
      events: {
        onReady: YTLoader.onPlayerReady,
        onStateChange: YTLoader.onPlayerStateChange,
      },
    });
  },

  onPlayerReady: () => {
    console.log("Player ready");
    YTLoader.playerReady = true;
  },

  onPlayerStateChange: () => {
    if (PeerJS.peerConnected) {
      PeerJS.peerConnection.send({
        type: "update-player-state",
        data: {
          status: event.data,
          currentTime: YTLoader.player.getCurrentTime(),
        },
      });
  
      if (event.data === 3) {
        setTimeout(() => {
          YTLoader.player.playVideo();
        }, 300);
      }
    }
  },

  // Methods
  stopVideo: () => {
    YTLoader.player.stopVideo();
  },

  onSongChange: () => {
    YTLoader.player.loadVideoById(songId, 0);
    YTLoader.player.playVideo();
  }
}

function onYouTubeIframeAPIReady() {
  YTLoader.onYouTubeIframeAPIReady();
}

function onPlayerReady() {
  YTLoader.onPlayerReady();
}

function onPlayerStateChange() {
  YTLoader.onPlayerStateChange();
}