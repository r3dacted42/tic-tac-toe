import Login from './scenes/Login.js';
import EventDispatcher from "./EventDispatcher.js";

Pusher.logToConsole = true;

var playerName = "";
var signedIn = false;
var playerId = "";

const pusher = new Pusher('338268c30f0c785cfd2f', {
    cluster: 'ap2',
    userAuthentication: {
        paramsProvider: () => { return { player_name: playerName }; },
    },
});

const emitter = EventDispatcher.getInstance();

emitter.on('nameSubmitted', function (name) {
    if (signedIn) return;
    playerName = name;
    pusher.signin();
    signedIn = true;
    const lobbyChannel = pusher.subscribe('lobby-channel');
    pusher.bind('pusher:signin_success', function (data) {
        var user_data = JSON.parse(data.user_data);
        playerId = user_data.id;
        document.getElementById('player-id').textContent = `Player ID: ${playerId}`;
    
        lobbyChannel.bind("pusher:subscription_count", (data) => {
            document.getElementById('lobby-count').textContent = `Lobby Count: ${data.subscription_count}`;
        });
    });
});

const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 1024,
    backgroundColor: 0x111111,
    parent: 'game-container',
    dom: {
        createContainer: true,
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
    },
    scene: [ Login ]
};

const game = new Phaser.Game(config);
