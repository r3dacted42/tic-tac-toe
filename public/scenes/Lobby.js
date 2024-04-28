import { EventDispatcher, Button } from "../utils.js";
import { lobbyCount, playerName, playerRoom } from "../game.js";

export default class Lobby extends Phaser.Scene {
    constructor() {
        super("lobby");
        this.emitter = EventDispatcher.getInstance();
    }

    preload() {
        //
    }

    create() {
        this.add.text(100, 100, `hello there, ${playerName} :)`, {fontSize:'20px'});

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2  - 150, 'share your code: ', {fontSize:'20px'}).setOrigin(1, 0.5);
        this.myCodeField = this.add.dom(this.cameras.main.width / 2, this.cameras.main.height / 2 - 150).createFromCache('formField').setOrigin(0, 0.5);
        this.myCodeField.getChildByName('field').disabled = true;
        this.myCodeField.getChildByName('field').value = playerRoom;

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'enter a code: ', {fontSize:'20px'}).setOrigin(1, 0.5);
        this.enterCodeField = this.add.dom(this.cameras.main.width / 2, this.cameras.main.height / 2).createFromCache('formField').setOrigin(0, 0.5);
        this.enterCodeField.getChildByName('field').placeholder = 'enter code';

        this.returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.returnKey.on('down', () => {
            var value = this.enterCodeField.getChildByName('field').value;
            console.log('trying to join room ' + value);
        });

        this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 150, 'join random match: ', {fontSize:'20px'}).setOrigin(1, 0.5);
        this.joinButton = new Button(this.cameras.main.width / 2, this.cameras.main.height / 2 + 150, 0, 0.5, 87, 12, 'join', this, () => {
            console.log('join button clicked');
        });
        this.lobbyCountText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 200, 'players available: ', {fontSize:'12px'}).setOrigin(0.5, 0.5);
    }

    update() {
        this.lobbyCountText.setText(`players available: ${lobbyCount - 1}`);
    }
}