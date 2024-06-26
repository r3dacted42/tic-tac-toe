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
        members: [],
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
            console.log(users);
            if (users.length < 2) {
                const authResponse = pusher.authorizeChannel(socketId, channel, {
                    user_id: req.body.id,
                    user_info: {
                        name: req.body.name,
                    },
                });
                res.status(200).send(authResponse);
                console.log(`authorized member #${users.length + 1} for ${channel}`);
                var members = new Array([req.body.id]);
                if (users.length > 0) members.push(users[0].id);
                if (users.length == 1) {
                    console.log('can start game on ' + channel);
                    rooms.set(channel, {
                        status: "ready",
                        count: users.length + 1,
                        members: members,
                        game_state: {
                            next_move_id: req.body.id,
                            next_move_type: 1, // 1 = X, -1 = O
                            board_state: [0, 0, 0,
                                0, 0, 0,
                                0, 0, 0],
                        },
                    });
                    // remove room of new user
                    let roomToRemove = userRooms.get(req.body.id);
                    rooms.delete(roomToRemove);
                    userRooms.delete(req.body.id);
                } else {
                    rooms.set(channel, {
                        status: "waiting",
                        count: users.length + 1,
                        members: members,
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
// { id: _ , channel_name: _ }
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
        members: [req.body.id],
    });
    res.status(202).send({ message: 'waiting now' });
});

// make a move
// { id: _ , channel_name: _ , pos: _ , type: _ }
// pos: [0, 8, 1] , type: {-1, 0, 1}
app.post("/api/make-move", async (req, res) => {
    const channel = req.body.channel_name;
    if (!rooms.has(channel)) {
        res.sendStatus(404);
        return;
    }
    
    const id = req.body.id;
    const opp_id = rooms.get(channel).members[((rooms.get(channel).members[0] == id) ? 1 : 0)];
    const pos = req.body.pos;
    const type = req.body.type;
    var state = rooms.get(channel).game_state;
    if (id != state.next_move_id) {
        res.status(403).send({ message: 'not your turn >:(' });
        return;
    }
    if (type != state.next_move_type) {
        res.status(403).send({ message: 'wrong type of move' });
        return;
    }
    if (state.board_state[pos] != 0) {
        res.status(403).send({ message: 'position already occupied' });
        return;
    }
    state.board_state[pos] = type;
    if (checkWinningState(state.board_state) !== false) {
        rooms.set(channel, {
            status: 'complete',
            count: 2,
            members: rooms.get(channel).members,
            game_state: {
                winner: id,

                board_state: state.board_state,
            }
        });
        res.status(202).send({ message: 'game complete' });
        return;
    }
    rooms.set(channel, {
        status: 'running',
        count: 2,
        members: rooms.get(channel).members,
        game_state: {
            next_move_id: opp_id,
            next_move_type: ((type == 1) ? -1 : 1),
            board_state: state.board_state,
        },
    });
    res.sendStatus(200);
    return;
});

function checkWinningState(board) {
    // vertical
    for (let i = 0; i <= 2; i++) {
        if (board[i] != 0 && board[i] == board[i + 3] && board[i + 3] == board[i + 6]) return [i, i+6];
    }
    // horizontal
    for (let i = 0; i <= 6; i += 3) {
        if (board[i] != 0 && board[i] == board[i + 1] && board[i + 1] == board[i + 2]) return [i, i+2];
    }
    // diagonal
    if (board[0] != 0 && board[0] == board[4] && board[4] == board[8]) return [0, 8];
    if (board[2] != 0 && board[2] == board[4] && board[4] == board[6]) return [2, 6];

    return false;
}

const port = process.env.PORT || 5000;
if (process.env.DEV) {
    console.log('running at http://localhost:' + port);
}
app.listen(port);

export default app;
