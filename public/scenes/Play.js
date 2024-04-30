import { EventDispatcher, Button } from "../utils.js";
import { playerName, playerRoom } from "../game.js";

export default class Play extends Phaser.Scene {
    constructor() {
        super("play");
        this.emitter = EventDispatcher.getInstance();
    }

    init(members) {
        this.membersInfo = members;
    }

    preload() {
        //
    }

    create() {
        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'you can play now :)', { fontSize: '20px' }).setOrigin(0.5, 0.5);
        console.log(this.membersInfo);
    }
}