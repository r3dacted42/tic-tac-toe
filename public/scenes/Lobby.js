import { EventDispatcher, Button } from "../utils.js";
import { lobbyCount, playerName, playerRoom, roomCount } from "../game.js";

export default class Lobby extends Phaser.Scene {
    constructor() {
        super("lobby");
        this.emitter = EventDispatcher.getInstance();
    }

    preload() {
        //
    }

    create() {
        let hello = this.add.text(100, 100, `hello there, ${playerName} :)`, {fontSize:'20px'}).setAlpha(0);

        let myCodeText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2  - 150, 'share your code: ', {fontSize:'20px'}).setOrigin(1, 0.5).setAlpha(0);
        this.myCodeField = this.add.dom(this.cameras.main.width / 2, this.cameras.main.height / 2 - 150).createFromCache('formField').setOrigin(0, 0.5).setAlpha(0);
        this.myCodeField.getChildByName('field').disabled = true;
        this.myCodeField.getChildByName('field').value = playerRoom;
        this.roomCountText = this.add.text(this.cameras.main.width - 100, 100, 'players in room: ', {fontSize:'12px'}).setOrigin(1, 0.5).setAlpha(0);

        let enterCodeText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'enter a code: ', {fontSize:'20px'}).setOrigin(1, 0.5).setAlpha(0);
        this.enterCodeField = this.add.dom(this.cameras.main.width / 2, this.cameras.main.height / 2).createFromCache('formField').setOrigin(0, 0.5).setAlpha(0);
        this.enterCodeField.getChildByName('field').placeholder = 'enter code';

        let returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        returnKey.on('down', () => {
            var value = this.enterCodeField.getChildByName('field').value;
            this.emitter.emit('entered_room_code', value);
        });

        let joinText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 150, 'join random match: ', {fontSize:'20px'}).setOrigin(1, 0.5).setAlpha(0);
        this.joinButton = new Button(this.cameras.main.width / 2, this.cameras.main.height / 2 + 150, 0, 0.5, 87, 12, 'join', this, () => {
            this.emitter.emit('join_button_clicked');
            this.tweens.add({
                targets: this.searchingText,
                alpha: 1,
                duration: 500
            });
            this.searchingTimer = this.time.addEvent({
                delay: 300,
                callback: () => {
                    if (this.searchingText.text == 'searching') this.searchingText.setText('searching.');
                    else if (this.searchingText.text == 'searching.') this.searchingText.setText('searching..');
                    else if (this.searchingText.text == 'searching..') this.searchingText.setText('searching...');
                    else this.searchingText.setText('searching');
                },
                loop: true
            });
        });
        this.joinButton.setAlpha(0);
        this.searchingText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 200, 'searching', {fontSize:'15px'}).setOrigin(0.5, 0.5).setAlpha(0);

        this.tweens.add({
            targets: [hello, myCodeText, this.myCodeField, this.roomCountText, enterCodeText, this.enterCodeField, joinText, this.joinButton],
            alpha: 1,
            duration: 700
        });

        this.emitter.on('game_start', (members) => {
            this.tweens.add({
                targets: [hello, myCodeText, this.myCodeField, this.roomCountText, enterCodeText, this.enterCodeField, joinText, this.joinButton, this.searchingText],
                alpha: 0,
                duration: 500
            }).addListener('complete', () => {
                this.scene.start('play', members);
            });
        });
    }

    update() {
        this.roomCountText.setText(`players in room: ${roomCount}`);
    }
}