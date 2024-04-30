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
    useTLS: true,
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
var rooms = new Map();

// pusher authentication
app.post("/api/auth", (req, res) => {
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
    userRooms.set(userId, 'presence-' + userRoom);
    rooms.set('presence-' + userRoom, {
        status: "waiting",
        count: 0,
    });
    console.log(authResponse);
    res.status(200).send(authResponse);
});

// pusher authorization
app.post("/api/auth-chan", async (req, res) => {
    const socketId = req.body.socket_id;
    const channel = req.body.channel_name;
    if (channel.startsWith('presence-') && rooms.has(channel)) {
        const countRes = await pusher.get({ path: `/channels/${channel}/users` });
        if (countRes.status === 200) {
            const body = await countRes.json();
            const users = body.users;
            if (users.length < 2) {
                const authResponse = pusher.authorizeChannel(socketId, channel, {
                    user_id: req.body.id,
                    user_info: {
                        name: req.body.name,
                    },
                });
                res.status(200).send(authResponse);
                console.log(`authorized member #${users.length + 1} for ${channel}`);
                if (users.length == 1) {
                    console.log('can start game on ' + channel);
                    rooms.set(channel, {
                        status: "ready",
                        count: users.length + 1,
                    });
                    // remove room of new user
                    let roomToRemove = userRooms.get(req.body.id);
                    rooms.delete(roomToRemove);
                    userRooms.delete(req.body.id);
                } else {
                    rooms.set(channel, {
                        status: "waiting",
                        count: users.length + 1,
                    });
                }
                return;
            }
        }
    }
    console.log(`rejected user auth req for ${channel}`);
    res.status(403).send({ message: ">:( who you" });
});

// get game status for channel
// { channel_name: _ }
app.post("/api/room-status", (req, res) => {
    const channel = req.body.channel_name;
    if (rooms.has(channel)) {
        console.log('someone trynna access status');
        res.status(200).send(rooms.get(channel));
        return;
    }
    console.log(`room status not found for ${channel}`);
    res.status(404);
});

// join random game
// { channel_name: _ }
app.post("/api/join-random", async (req, res) => {
    var toJoin = null;
    for (const [k, v] of rooms) {
        if (toJoin == null && v.status == "random") {
            const countRes = await pusher.get({ path: `/channels/${k}/users` });
            if (countRes.status === 200) {
                const body = await countRes.json();
                const users = body.users;
                if (users.length > 0) {
                    if (toJoin == null) toJoin = k;
                } else {
                    rooms.delete(k);
                }
            } else {
                rooms.delete(k);
            }
        }
    }
    if (toJoin != null) {
        res.status(200).send({ channel: toJoin });
        return;
    }
    const channel = req.body.channel_name;
    rooms.set(channel, {
        status: "random",
        count: 1,
    });
    res.status(202).send({ message: 'waiting now' });
});

const port = process.env.PORT || 5000;
if (process.env.DEV) {
    console.log('running at http://localhost:' + port);
}
app.listen(port);

export default app;
