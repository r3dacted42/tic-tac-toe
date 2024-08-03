import Login from './scenes/Login.js';
import Lobby from './scenes/Lobby.js';
import Play from './scenes/Play.js';
import { EventDispatcher } from "./utils.js";

Pusher.logToConsole = true;

export var playerName = "";
var signingIn = false;
export var signedIn = false;
export var playerId = "";
export var playerRoom = "";
export var lobbyCount = 0;
export var roomCount = 0;

const pusher = new Pusher('338268c30f0c785cfd2f', {
    cluster: 'ap2',
    userAuthentication: {
        endpoint: '/api/auth',
        paramsProvider: () => { return { name: playerName }; },
    },
    channelAuthorization: {
        endpoint: "/api/auth-chan",
        paramsProvider: () => { return { id: playerId, name: playerName }; },
    },
});

const lobbyCountCallback = (data) => {
    lobbyCount = data.subscription_count;
    document.getElementById('lobby-count').textContent = `players in lobby: ${lobbyCount}/98`;
};

const emitter = EventDispatcher.getInstance();
var roomChannel = null;

async function getRoomStatus(roomCode, callback) {
    if (!roomCode.startsWith('presence-')) {
        roomCode = 'presence-' + roomCode;
    }
    var res = await fetch(`${window.location.origin}/api/room-status`, {
        method: "POST",
        body: JSON.stringify({
            id: playerId,
            channel_name: roomCode,
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });
    console.log(res);
    callback(res);
}

emitter.on('name_submitted', function (name) {
    if (signedIn || signingIn) return;
    playerName = name;
    pusher.signin();
    signingIn = true;
    pusher.bind('pusher:signin_success', function (data) {
        var user_data = JSON.parse(data.user_data);
        console.log(user_data);
        playerId = user_data.id;
        document.getElementById('player-id').textContent = `player id: ${playerId}`;

        let lobbyChannel = pusher.subscribe('lobby');
        lobbyChannel.bind("pusher:subscription_count", lobbyCountCallback);

        playerRoom = user_data.user_info.room;
        roomChannel = pusher.subscribe('presence-' + playerRoom);
        roomChannel.bind("pusher:subscription_succeeded", (data) => {
            pusher.unsubscribe('lobby');
            document.getElementById('lobby-count').textContent = '';
            console.log(`joined room channel!!!!!11  members count: ${roomChannel.members.count}`);
            roomCount = roomChannel.members.count;
            roomChannel.bind("pusher:member_added", (member) => {
                console.log('member added');
                console.log(member);
                roomCount = roomChannel.members.count;
                if (roomCount == 2) {
                    getRoomStatus(playerRoom, async (res) => {
                        if (res.status == 200) {
                            res = await res.json();
                            console.log(res.room);
                            emitter.emit('game_start', {room: res.room, members: roomChannel.members});
                        }
                    });
                }
            });
            roomChannel.bind("pusher:member_removed", (member) => {
                console.log('member removed');
                console.log(member);
            });
            roomChannel.bind("client-message", (message) => {
                emitter.emit("message_received", message);
            });
            roomChannel.bind("client-move", (data) => {
                emitter.emit("opp_move", data);
            });
            roomChannel.bind("client-game-complete", (data) => {
                emitter.emit('game_complete', data);
            });
            roomChannel.bind("client-game-reset", (data) => {
                emitter.emit("reset_complete", data);
            });
        });
        roomChannel.bind("pusher:subscription_error", (error) => {
            console.log(error);
        });

        signedIn = true;
        emitter.emit('signin_success');
    });
});

function joinChannel(channel) {
    pusher.unsubscribe('lobby');
    document.getElementById('lobby-count').textContent = '';
    pusher.unsubscribe('presence-' + playerRoom);
    playerRoom = channel.substring(9);
    roomChannel = pusher.subscribe(channel);
    roomChannel.bind("pusher:subscription_succeeded", (data) => {
        console.log(`joined room channel!!!!!11  members count: ${roomChannel.members.count}`);
        roomCount = roomChannel.members.count;
        roomChannel.bind("pusher:member_removed", (member) => {
            console.log('member removed');
            console.log(member);
        });
        roomChannel.bind("client-message", (message) => {
            emitter.emit("message_received", message);
        });
        roomChannel.bind("client-move", (data) => {
            emitter.emit("opp_move", data);
        });
        roomChannel.bind("client-game-complete", (data) => {
            emitter.emit("game_complete", data);
        });
        roomChannel.bind("client-game-reset", (data) => {
            emitter.emit("reset_complete", data);
        });
        if (roomCount == 2) {
            getRoomStatus(channel, async (res) => {
                if (res.status == 200) {
                    res = await res.json();
                    console.log(res.room);
                    emitter.emit('game_start', {room: res.room, members: roomChannel.members});
                }
            });
        }
    });
    roomChannel.bind("pusher:subscription_error", (error) => {
        console.log(error);
        emitter.emit('join_failed');
    });
}

emitter.on('entered_room_code', async (enteredCode) => {
    console.log('gonna join room ' + enteredCode);
    getRoomStatus(enteredCode, (res) => {
        if (res.status != 404) {
            joinChannel('presence-' + enteredCode);
        } else {
            console.log('entered invalid room code');
        }
    });
});

async function joinRandom(callback) {
    let res = await fetch(`${window.location.origin}/api/join-random`, {
        method: "POST",
        body: JSON.stringify({
            id: playerId,
            channel_name: 'presence-' + playerRoom,
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });
    console.log(res);
    callback(res);
}

emitter.on('join_button_clicked', () => {
    console.log('gonna search');
    joinRandom(async (res) => {
        const result = await res.json();
        if (res.status == 202) {
            console.log(result);
        } else if (res.status == 200) {
            console.log(result);
            joinChannel(result.channel);
        } else {
            console.log('something fucked up');
        }
    });
});

emitter.on('message_sent', (message) => {
    roomChannel.trigger('client-message', message);
});

emitter.on('made_move', async (data) => {
    let res = await fetch(`${window.location.origin}/api/make-move`, {
        method: "POST",
        body: JSON.stringify({
            id: playerId,
            channel_name: 'presence-' + playerRoom,
            pos: data.pos,
            type: data.type,
            room_data: data.roomData,
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });
    let resStatus = res.status;
    res = await res.json();
    let msgData = {
        success: true,
        pos: data.pos,
        type: data.type,
        status: res.status
    };
    console.log(msgData);
    if (resStatus == 200) {
        // move success
        emitter.emit('self_move', msgData);
        roomChannel.trigger('client-move', msgData);
    } else if (resStatus == 202) {
        // game completed
        emitter.emit('game_complete', msgData);
        roomChannel.trigger('client-game-complete', msgData);
    }
});

emitter.on('reset_game', async () => {
    let res = await fetch(`${window.location.origin}/api/reset-game`, {
        method: "POST",
        body: JSON.stringify({
            id: playerId,
            channel_name: 'presence-' + playerRoom
        }),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    });
    let resStatus = res.status;
    res = await res.json();
    if (resStatus == 202) {
        console.log('reset initiated');
    } else if (resStatus == 200) {
        roomChannel.trigger('client-game-reset', res.status);
        emitter.emit('reset_complete', res.status);
    }
});


const config = {
    type: Phaser.AUTO,
    width: 768,
    height: 1024,
    backgroundColor: 0x111111,
    parent: 'game-container',
    dom: {
        createContainer: true,
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [Login, Lobby, Play]
};

const game = new Phaser.Game(config);
