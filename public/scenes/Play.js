import { EventDispatcher, Button } from "../utils.js";
import { playerId, playerName, playerRoom } from "../game.js";

export default class Play extends Phaser.Scene {
    constructor() {
        super("play");
        this.emitter = EventDispatcher.getInstance();
        this.emitter.on('message_received', (message) => {
            console.log(message);
            this.messages.push({
                sender: this.oppName,
                type: 'text',
                message: message,
            });
            this.updateMessagesList();
        });
    }

    init(members) {
        this.membersInfo = members;
    }

    preload() {
        this.load.image('board', 'assets/board.png');
    }

    create() {
        let myNameText = this.add.text(this.cameras.main.width / 2 - 50, 100, this.membersInfo.me.info.name + '(you)', {fontSize: '25px'}).setOrigin(1, 0.5).setAlpha(0);
        let vsText = this.add.text(this.cameras.main.width / 2, 100, 'vs', {fontSize: '35px'}).setOrigin(0.5, 0.5).setAlpha(0);
        let oppNameText = null;
        this.oppName = "";
        for (const [k, v] of Object.entries(this.membersInfo.members)) {
            if (k != this.membersInfo.me.id) {
                this.oppName = v.name;
                oppNameText = this.add.text(this.cameras.main.width / 2 + 50, 100, v.name, {fontSize: '25px'}).setOrigin(0, 0.5).setAlpha(0);
            }
        }
        let board = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'board').setScale(0.5).setAlpha(0);

        this.messages = new Array();
        this.messageTexts = new Array();
        this.sendMessageField = this.add.dom(10, this.cameras.main.height - 35).createFromCache('textField').setOrigin(0, 0.5).setAlpha(0);
        this.sendMessageField.getChildByName('field').placeholder = 'send message';

        let returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        returnKey.on('down', () => {
            var value = this.sendMessageField.getChildByName('field').value.trim();
            this.sendMessageField.getChildByName('field').value = "";
            if (value != "") {
                this.emitter.emit('message_sent', value);
                this.messages.push({
                    sender: playerName,
                    type: 'text',
                    message: value,
                });
                this.updateMessagesList();
            }
        });

        this.tweens.add({
            targets: [myNameText, oppNameText, vsText, board, this.sendMessageField],
            alpha: 1,
            duration: 700
        });
    }

    drawBoard() {
    }

    updateMessagesList() {
        if (this.messages.length > 7) {
            this.messages.splice(0, 1);
            this.tweens.add({
                targets: this.messageTexts[0],
                alpha: 0,
                y: this.messageTexts[0].y - 25,
                duration: 70,
            }).addListener('complete', () => {
                this.messageTexts[0].destroy();
                this.messageTexts.splice(0, 1);
            });
        }
        this.messageTexts.forEach((v, i, arr) => {
            this.tweens.add({
                targets: v,
                y: v.y - 25,
                duration: 70,
            });
        });
        let m = this.messages[this.messages.length - 1];
        let txt = this.add.text(15, this.cameras.main.height - 50, `${m.sender}: ${m.message}`, {fontSize: '20px'}).setOrigin(0, 0.5).setAlpha(0);
        this.messageTexts.push(txt);
        this.tweens.add({
            targets: txt,
            y: txt.y - 30,
            alpha: 1,
            duration: 70,
        });
    }
}