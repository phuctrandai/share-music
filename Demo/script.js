let connectBtn = document.querySelector("#connect");
let addMusicBtn = document.querySelector("#add-music-btn");
let otherIdInput = document.querySelector("#other-id");
let inputYouTubeUrl = document.querySelector("#input-youtube-url");
let peerIdEl = document.querySelector("#peerID");
let connectionStatusEl = document.querySelector("#connection-status");
let currentMusicList = [];
let currentPlayingId = "";
let peerReady = false,
  peer = new Peer(),
  peerId,
  peerConnected = false,
  peerConnection;
let playerReady = false,
  player;

peer.on("open", (id) => {
  // peer is now connected
  peerId = id;
  peerReady = true;
  peerIdEl.innerHTML = id;
  connectionStatusEl.innerHTML = "Connected to server.";
  connectBtn.attributes.removeNamedItem("disabled");

  console.log(">> Peer connected with ID: " + peerId);

  // Init action for copy button
  document.querySelector("#copy-id").onclick = () => {
    navigator.clipboard.writeText(id).then((r) => console.log("ID Copied."));
  };

  connectBtn.onclick = () => {
    const conn = peer.connect(otherIdInput.value);
    connectionHandler(conn);
  };

  var peerIdQRCode = document.getElementById('peerID-qrcode');
  new QRCode(peerIdQRCode, id);
});

const onSongChange = (songId) => {
  player.loadVideoById(songId, 0);
  player.playVideo();
};

const renderMusicList = (conn) => {
  const musicItem = document.querySelector("#list-music-item");
  const playlistEl = document.querySelector("#playlist");
  playlistEl.innerHTML = "";

  currentMusicList.forEach((song) => {
    const item = musicItem.content.cloneNode(true);
    const songPlayBtn = item.querySelector(".song-play");
    item.querySelector(".song-name").innerHTML = song.url;

    if (currentPlayingId === song.songId) {
      songPlayBtn.disabled = true;
      songPlayBtn.innerText = "Playing...";
    } else {
      songPlayBtn.innerText = "Play";

      songPlayBtn.onclick = () => {
        if (!playerReady) {
          alert("Player is loading...");
          return;
        }
        onSongChange(song.songId);
        currentPlayingId = song.songId;

        // Send song id to remote peer
        conn.send({
          type: "set-playing",
          data: song.songId,
        });

        renderMusicList(conn);
      };
    }
    playlistEl.append(item);
  });
};

const connectionHandler = (conn) => {
  connectionStatusEl.innerHTML = "Connected to " + conn.peer;
  peerConnected = true;
  peerConnection = conn;

  peerConnection.on("open", () => {
    otherIdInput.value = conn.peer;
    otherIdInput.disabled = true;

    // only enable add music btn when connected
    addMusicBtn.disabled = false;
    addMusicBtn.onclick = () => {
      if (
        inputYouTubeUrl.value &&
        inputYouTubeUrl.value.trim() !== "" &&
        parseYtbLink(inputYouTubeUrl.value)
      ) {
        currentMusicList.push({
          songId: parseYtbLink(inputYouTubeUrl.value),
          url: inputYouTubeUrl.value,
        });
        conn.send({
          type: "sync-playlist",
          data: currentMusicList,
        });
        renderMusicList(conn);
        inputYouTubeUrl.value = "";
      }
    };

    // Emitted when the connection is established and ready-to-use.
    conn.on("open", function () {});

    // Emitted when data is received from the remote peer.
    conn.on("data", (packet) => {
      console.log(packet);
      // Data received over WebRTC
      switch (packet.type) {
        case "sync-playlist":
          currentMusicList = packet.data;
          renderMusicList(conn);
          break;
        case "set-playing":
          currentPlayingId = packet.data;
          onSongChange(currentPlayingId);
          renderMusicList(conn);
          break;
        case "update-player-state":
          if (player.getPlayerState() !== packet.data.status) {
            switch (packet.data.status) {
              case 0:
                // ended
                break;
              case 1:
                // playing
                player.seekTo(packet.data.currentTime);
                player.playVideo();
                break;
              case 2:
                // paused
                player.pauseVideo();
                break;
            }
          }
          break;
      }
    });

    // Emitted when either you or the remote peer closes the data connection.
    conn.on("close", function () {
      console.log(">> Remote peer closes connection");
      player.pauseVideo();
    });
  });
};

// Emitted when a remote peer connect to you.
peer.on("connection", (conn) => {
  console.log(">> One peer remote connect to you");
  connectionHandler(conn);
});

peer.on("close", () => {
  console.log(">> Peer on close");
  connectionStatusEl.innerHTML = "Closed.";
  player.stopVideo();
});

peer.on("call", () => {
  console.log(">> Peer on receive a call");
  connectionStatusEl.innerHTML = "Received a call.";
});

peer.on("disconnected", () => {
  console.log(">> Peer on disconnected");
  connectionStatusEl.innerHTML = "Disconnected.";
});

peer.on("error", (err) => {
  console.log(">> Peer on error: " + err);
  connectionStatusEl.innerHTML = err.type;
});
