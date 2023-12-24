let peerIdEl = document.querySelector("#peerID");
let currentMusicList = [];

var PeerJS = {
  peerReady: false,
  peer: null,
  peerId: null,
  peerConnected: false,
  peerConnection: null,
  currentPlayingId: null,

  init: () => {
    PeerJS.peer = new Peer();

    // Init action for copy button
    document.querySelector("#copy-id").onclick = () => {
      navigator.clipboard.writeText(PeerJS.peerId);
    };

    PeerJS.initOpenConnectionHandler();
    PeerJS.initPeerConnectHandler();
    PeerJS.initPeerCloseHandler();
  },

  initOpenConnectionHandler: () => {
    PeerJS.peer.on("open", (id) => {
      // peer is now connected
      PeerJS.peerId = id;
      PeerJS.peerReady = true;

      peerIdEl.innerHTML = id;
      console.log("Peer connected with ID: " + id);
    });
  },

  // Emitted when a remote peer connect to you.
  initPeerConnectHandler: () => {
    PeerJS.peer.on("connection", (conn) => {
      console.log("One peer remote connect to you");

      PeerJS.peerConnected = true;
      PeerJS.peerConnection = conn;

      PeerJS.peerConnection.on("open", () => {
        // Emitted when the connection is established and ready-to-use.
        conn.on("open", function () {});

        // Emitted when data is received from the remote peer.
        conn.on("data", (packet) => {
          // Data received over WebRTC
          switch (packet.type) {
            case "sync-playlist":
              currentMusicList = packet.data;
              break;
            case "set-playing":
              YTLoader.currentPlayingId = packet.data;
              YTLoader.onSongChange(packet.data);
              break;
            case "update-player-state":
              if (YTLoader.player.getPlayerState() !== packet.data.status) {
                switch (packet.data.status) {
                  case 0:
                    // ended
                    break;
                  case 1:
                    // playing
                    YTLoader.player.seekTo(packet.data.currentTime);
                    YTLoader.player.playVideo();
                    break;
                  case 2:
                    // paused
                    YTLoader.player.pauseVideo();
                    break;
                }
              }
              break;
          }
        });

        // Emitted when either you or the remote peer closes the data connection.
        conn.on("close", function () {
          console.log("Remote peer closes connection");
          YTLoader.player.pauseVideo();
        });
      });
    });
  },

  initPeerCloseHandler: () => {
    PeerJS.peer.on("close", () => {
      console.log("Peer remote closed connection");
      player.stopVideo();
    });
  }
}