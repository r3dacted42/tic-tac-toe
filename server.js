const Pusher = require("pusher");
const http = require('http');
const express = require('express');
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use(express.static(__dirname + '/public'));

const pusher = new Pusher({
    appId: "1793495",
    key: "338268c30f0c785cfd2f",
    secret: process.env.PUSHER_SECRET,
    cluster: "ap2",
    useTLS: true
});

var totalNumOfUsers = 0;

app.post("/pusher/user-auth", (req, res) => {
    const socketId = req.body.socket_id;
    const user = {
        id: `ttt_${Date.now()}`,
        user_info: {
            name: req.body.playername,
        },
    };
    const authResponse = pusher.authenticateUser(socketId, user);
    totalNumOfUsers++;
    res.send(authResponse);
});

const port = process.env.PORT || 5000;
app.listen(port);
