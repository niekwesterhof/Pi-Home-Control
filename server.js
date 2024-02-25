const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const PORT = 55000 || process.env.PORT;
const io = socketio(server, {
  pingTimeout: 5000,
  pingInterval: 10000,
  cookie: false,
});

// run when a client connects
io.on("connection", function (socket) {
  let address = socket.handshake.address.split(":");
  console.log("New connection from " + address[3]);  

  socket.on("connect_error", (error) => {
    console.log("Connection Error");
    console.log(error);
  });

  socket.on("Button", (payload) => {
    console.log(payload);
    console.log("Received Button");
    io.emit("Button", payload);
  });
});

app.use(express.static(path.join(__dirname, "Public")));
server.listen(PORT, () => console.log("Server running on port " + PORT));
