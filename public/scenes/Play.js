import { EventDispatcher, Button } from "../utils.js";
import { playerId, playerName, playerRoom } from "../game.js";

export default class Play extends Phaser.Scene {
    constructor() {
        super("play");
        this.emitter = EventDispatcher.getInstance();
        this.emitter.on('message_recvd', (message) => {
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
        //
    }

    create() {
        let playText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'you can talk for now :)', { fontSize: '20px' }).setOrigin(0.5, 0.5).setAlpha(0);
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

        this.messages = new Array();
        this.messageTexts = new Array();
        this.sendMessageField = this.add.dom(100, this.cameras.main.height - 100).createFromCache('textField').setOrigin(0, 0.5).setAlpha(0);
        this.sendMessageField.getChildByName('field').placeholder = 'send message';

        let returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        returnKey.on('down', () => {
            var value = this.sendMessageField.getChildByName('field').value;
            this.sendMessageField.getChildByName('field').value = "";
            this.emitter.emit('message_sent', value);
            this.messages.push({
                sender: playerName,
                type: 'text',
                message: value,
            });
            this.updateMessagesList();
        });

        this.tweens.add({
            targets: [playText, myNameText, oppNameText, vsText, this.sendMessageField],
            alpha: 1,
            duration: 1000
        });
    }

    updateMessagesList() {
        if (this.messages.length > 10) {
            this.messages.splice(0, 1);
        }
        this.messageTexts.forEach((v, i, arr) => {
            v.destroy();
        });
        this.messages.forEach((m, i, arr) => {
            let txt = this.add.text(100, this.cameras.main.height - 120 - 220 + (10 - this.messages.length + i) * 22, `${m.sender} : ${m.message}`, {fontSize: '20px'}).setOrigin(0, 0.5);
            this.messageTexts.push(txt);
        });
    }
}