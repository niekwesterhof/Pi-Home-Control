const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const PORT = 54000 || process.env.PORT;
const io = socketio(server, {
  pingTimeout: 5000,
  pingInterval: 10000,
  cookie: false,
});

console.log(__dirname)

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

let newDevice = [
  {
    Hostname: "",
    IPAddress: "",
  },
];

var settings = {
  Type: [""],
  Device: [
    {
      Name: "",
      ID: "",
      Room: "",
      Type: "",
      Hostname: "",
      IPAddress: "",
      Status: "",
    },
  ],
  wakeUp: { Time: "", Day: 0 },
};
fs.readFile(__dirname + "/Public/json/rooms.json", "utf-8", (err, data) => {
  if (err) throw err;
  rooms = JSON.parse(data);
});

fs.readFile(__dirname + "/Public/json/settings.json", "utf-8", (err, data) => {
  if (err) throw err;
  settings = JSON.parse(data);
});

function writeRoomsJsonToFile(data) {
  let dataToSend = JSON.stringify(data);
  fs.writeFileSync(__dirname + "/Public/json/rooms.json", dataToSend);
}

function writeSettingsJsonToFile(data) {
  let dataToSend = JSON.stringify(data);
  fs.writeFileSync(__dirname + "/Public/json/settings.json", dataToSend);
}

// run when a client connects
io.on("connection", function (socket) {
  let address = socket.handshake.address.split(":");
  console.log("New connection from " + address[3]);
  socket.emit("sendData", "sendData");
  socket.emit("settings", JSON.stringify(settings));
  // writeToDisplay("New Connection");
  // writeToDisplay(address[3]);

  socket.on("json", (data) => {
    writeRoomsJsonToFile(data);
  });
  socket.on("connect_error", (error) => {
    console.log("Connection Error");
    console.log(error);
  });

  socket.on("disconnect", (reason) => {
    let address = socket.handshake.address.split(":");
    console.log(address[3] + " has left the server");
    console.log(reason);
    let deviceID;
    for (i = 0; i < settings.Device.length; i++) {
      if (settings.Device[i].IPAddress == address[3]) {
        settings.Device[i].Status = 3;
        deviceID = settings.Device[i].ID;
      }
    }

    for (var j = 0; j < rooms.length; j++) {
      for (var i = 0; i < rooms[j].ID.length; i++) {
        if (rooms[j].ID[i].DEVICE_ID == deviceID) {
          rooms[j].ID[i].STATUS = 3;
        }
      }
    }

    writeSettingsJsonToFile(settings);
    io.emit("message", address[3] + " has left the server");
    io.emit("reloadRooms", rooms);
    io.emit("reloadSettings", settings);
  });

  socket.on("settings", (payload) => {
    writeSettingsJsonToFile(payload);
    settings = payload;
    var data = "Settings--wakeUpLedTime--" + settings.wakeUp.Time + "-" + settings.wakeUp.Day + "-";

    io.emit("command", data);
  });

  socket.on("command", (payload) => {
    io.emit("command", payload);
  });

  socket.on("sendData", (payload) => {
    let address = socket.handshake.address.split(":");
    let notfound = false;
    console.log("Got data from: " + address[3]);
    // writeToDisplay(payload);
    var deviceData = payload.split("-");
    for (var i = 0; i < rooms.length; i++) {
      for (var j = 0; j < rooms[i].ID.length; j++) {
        if (rooms[i].ID[j].DEVICE_ID == deviceData[0]) {
          rooms[i].ID[j].VALUE = deviceData[1];
          rooms[i].ID[j].STATUS = deviceData[2];
          writeRoomsJsonToFile(rooms);
          notfound = true;
        }
      }
    }
    for (i = 0; i < settings.Device.length; i++) {
      if (settings.Device[i].ID == deviceData[0]) {
        settings.Device[i].Hostname = deviceData[6] + "-" + deviceData[7];
        settings.Device[i].IPAddress = address[3];
        settings.Device[i].Status = 1;
        writeSettingsJsonToFile(settings);
        notfound = true;
      }
    }
    if (!notfound && deviceData[0] >= 0) {
      let index = newDevice.length;
      if (newDevice[0].Hostname === "") {
        newDevice[0].Hostname = deviceData[6] + "-" + deviceData[7];
        newDevice[0].IPAddress = address[3];
      } else {
        newDevice[index] = {
          Hostname: deviceData[6] + "-" + deviceData[7],
          IPAddress: address[3],
        };
      }
    }
    io.emit("reloadRooms", rooms);
    io.emit("reloadSettings", settings);
  });

  socket.on("newDevice", (payload) => {
    let data = payload.split("-");
    if (data[0] == "pingForNewDevices") {
      io.emit("sendData", "");
    }
    if (newDevice[0].Hostname != "") {
      io.emit("newDeviceFound", newDevice);
      newDevice = [{ Hostname: "", IPAddress: "" }];
      console.log(newDevice);
    } else {
      io.emit("newDeviceFound", "NoDeviceFound");
    }
  });

  socket.on("connectedDevices", () => { });
});

app.use(express.static(__dirname + "/Public/"));
server.listen(PORT, () => console.log("Server running on port " + PORT));
