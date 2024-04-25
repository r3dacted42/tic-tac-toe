import EventDispatcher from "../EventDispatcher.js";
import { playerName, playerRoom } from "../game.js";

export default class Lobby extends Phaser.Scene {
    constructor() {
        super("lobby");
        this.emitter = EventDispatcher.getInstance();
    }

    preload() {
        //
    }

    create() {
        this.add.text(100, 100, `Hello there, ${playerName}~`, {fontSize:'20px'});

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2  - 150, 'Share your code: ', {fontSize:'20px'}).setOrigin(1, 0.5);
        this.myCodeField = this.add.dom(this.cameras.main.width / 2, this.cameras.main.height / 2 - 150).createFromCache('formField').setOrigin(0, 0.5);
        this.myCodeField.getChildByName('field').disabled = true;
        this.myCodeField.getChildByName('field').value = playerRoom;

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Enter a code: ', {fontSize:'20px'}).setOrigin(1, 0.5);
        this.enterCodeField = this.add.dom(this.cameras.main.width / 2, this.cameras.main.height / 2).createFromCache('formField').setOrigin(0, 0.5);
        this.enterCodeField.getChildByName('field').placeholder = 'Enter Code';
    }
}