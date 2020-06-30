const io = require("socket.io")(8080);

io.on("connection", (socket) => {
  socket.on("join", (roomId, callback) => {
    socket
      .join(roomId)
      .to(roomId)
      .broadcast.emit("joined", socket.id);

    const connectedPeers = Object.keys(
      io.sockets.adapter.rooms[roomId].sockets
    ).filter((id) => id !== socket.id);
    callback(connectedPeers);
  });

  socket
    .on("candidate", (candidate, peerId) =>
      socket.to(peerId).emit("candidate", candidate, socket.id)
    )
    .on("offer", (offer, peerId) =>
      socket.to(peerId).emit("offer", offer, socket.id)
    )
    .on("answer", (answer, peerId) =>
      socket.to(peerId).emit("answer", answer, socket.id)
    );
});
