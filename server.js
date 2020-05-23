const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const PORT = 54000 || process.env.PORT;
const io = socketio(server);
var font = require("oled-font-5x7");

var i2c = require("i2c-bus"),
  i2cBus = i2c.openSync(1),
  oled = require("oled-i2c-bus");

var opts = {
  width: 128,
  height: 64,
  address: 0x3c,
};

var oled = new oled(i2cBus, opts);

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

oled.turnOnDisplay();
oled.setCursor(1, 1);
oled.clearDisplay();
oled.writeString(font, 1, "Hello", 1, true);
oled.update();

console.log(rooms);
/*var displayData = ["", "", "", "", "", ""];
var cursor = [1, 11, 21, 31, 41, 51];
var i;
function writeToDisplay(data) {
  displayData[5] = displayData[4];
  displayData[4] = displayData[3];
  displayData[3] = displayData[2];
  displayData[2] = displayData[1];
  displayData[1] = displayData[0];
  displayData[0] = data;
  for (i = 5; i > -1; i--) {
    oled.setCursor(1, cursor[i]);
    oled.writeString(font, 1, displayData[i], 1, true);
    oled.update();
  }
}*/

function writeRoomsJsonToFile(data) {
  console.log("writing roomsto json file");
  let dataToSend = JSON.stringify(data);
  fs.writeFileSync("./Public/json/rooms.json", dataToSend);
}

function writeSettingsJsonToFile(data) {
  console.log("writing settings to json file");
  let dataToSend = JSON.stringify(data);
  fs.writeFileSync("./Public/json/settings.json", dataToSend);
}

// run when a client connects
io.on("connection", function (socket) {
  let address = socket.handshake.address.split(":");
  console.log("New connection from " + address[3]);
  socket.emit("sendData", "sendData");
  // writeToDisplay("New Connection");
  // writeToDisplay(address[3]);

  socket.on("json", (data) => {
    writeRoomsJsonToFile(data);
  });
  socket.on("disconnect", () => {
    io.emit("message", "a user has left the server");
    io.emit("sendData", "sendData");
  });

  socket.on("command", (payload) => {
    io.emit("command", payload);
  });

  socket.on("settings", (payload) => {
    writeSettingsJsonToFile(payload);
    io.emit("command");
  });
  socket.on("sendData", (payload) => {
    let address = socket.handshake.address.split(":");
    console.log("Got data from: " + address[3]);
    console.log("sendData");
    console.log(payload);
    // writeToDisplay(payload);
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
