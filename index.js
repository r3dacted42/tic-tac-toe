import Pusher from "pusher";
import express, { json, urlencoded } from 'express';
import cors from "cors";

const app = express();
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cors());
app.use(express.static('public'));

const pusher = new Pusher({
    appId: "1793495",
    key: "338268c30f0c785cfd2f",
    secret: process.env.PUSHER_SECRET,
    cluster: "ap2",
    useTLS: true
});

function makeid(length) {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

var userRooms = new Map();

app.post("/pusher/user-auth", (req, res) => {
    const socketId = req.body.socket_id;
    var userId = `ttt_${Date.now()}`;
    var userRoom = makeid(8);
    const user = {
        id: userId,
        user_info: {
            name: req.body.name,
            room: userRoom,
        },
    };
    const authResponse = pusher.authenticateUser(socketId, user);
    res.send(authResponse);
    userRooms.set(userRoom, userId);
});

const port = process.env.PORT || 5000;
if (process.env.DEV) {
    console.log('running at http://localhost:' + port);
}
app.listen(port);

export default app;
