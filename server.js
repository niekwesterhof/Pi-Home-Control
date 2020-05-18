const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const PORT = 54000 || process.env.PORT;
const io = socketio(server);

let rooms = [
  {
    name: "",
    ID: [
      {
        NAME: "",
        TYPE: "",
        STATUS: "",
        VALUE: 0,
        DEVICE_ID: "",
        WAKEUPTIME: "",
        WAKEUPTIMESTATUS: "",
      },
    ],
  },
];

fs.readFile("./Public/json/rooms.json", "utf-8", (err, data) => {
  if (err) throw err;

  rooms = JSON.parse(data);
});

console.log(rooms);

function writeJsonToFile(data) {
  console.log("writing to json file");
  let dataToSend = JSON.stringify(data);
  fs.writeFileSync("./Public/json/rooms.json", dataToSend);
}

// run when a client connects
io.on("connection", function (socket) {
  let address = socket.handshake.address.split(":");
  console.log("New connection from " + address[3]);
  // send data
  socket.emit("sendData", "sendData");

  socket.on("json", (data) => {
    writeJsonToFile(data);
  });
  socket.on("disconnect", () => {
    io.emit("message", "a user has left the server");
    io.emit("sendData", "sendData");
  });

  socket.on("command", (payload) => {
    io.emit("command", payload);
  });

  socket.on("sendData", (payload) => {
    let address = socket.handshake.address.split(":");
    console.log("Got data from: " + address[3]);
    console.log("sendData");
    console.log(payload);
    var deviceData = payload.split("-");
    for (var i = 0; i < rooms.length; i++) {
      for (var j = 0; j < rooms[i].ID.length; j++) {
        if (rooms[i].ID[j].DEVICE_ID == deviceData[0]) {
          rooms[i].ID[j].VALUE = deviceData[1];
          rooms[i].ID[j].STATUS = deviceData[2];
          rooms[i].ID[j].WAKEUPTIME = deviceData[3] + ":" + deviceData[4];
          rooms[i].ID[j].WAKEUPTIMESTATUS = deviceData[2];
          writeJsonToFile(rooms);
        }
      }
    }
    io.emit("reloadPage", "");
  });

  socket.on("newDevice", (payload) => {
    let data = payload.split("-");
    if (data[0] == "pingForNewDevices") {
      io.emit("newDevice", "");
    } else if (data[0] == "newDevice") {
      io.emit("newDeviceFound", payload);
    }
  });
});

app.use(express.static(path.join(__dirname, "Public")));
server.listen(PORT, () => console.log("Server running on port " + PORT));

