import { EventDispatcher, Button } from "../utils.js";
import { playerName, playerRoom } from "../game.js";

export default class Play extends Phaser.Scene {
    constructor() {
        super("play");
        this.emitter = EventDispatcher.getInstance();
    }

    preload() {
        //
    }

    create() {
        //
    }
}