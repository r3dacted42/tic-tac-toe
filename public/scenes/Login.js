import { EventDispatcher } from "../utils.js";
import { playerName } from "../game.js";

export default class Login extends Phaser.Scene {
    constructor() {
        super("login");
        this.emitter = EventDispatcher.getInstance();

        this.emitter.on('signin_success', () => this.moveToLobby());
    }

    preload() {
        this.load.image('logo', 'assets/logo.png');
        this.load.html('formField', 'assets/formField.html');
    }

    create() {
        this.logo = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'logo').setScale(0.4).setAlpha(0);
        this.nameField = this.add.dom(this.cameras.main.width / 2, this.cameras.main.height / 2 + 100).createFromCache('formField').setAlpha(0);
        this.nameField.getChildByName('field').placeholder = 'enter your name';
        this.welcomeMessage = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 100, "", { fontSize: '20px' }).setAlpha(0).setOrigin(0.5);

        this.tweens.add({
            targets: this.logo,
            alpha: 1,
            duration: 1000
        });

        setTimeout(() => {
            this.tweens.add({
                targets: this.logo,
                y: this.cameras.main.height / 2 - 100,
                duration: 500
            }).addListener('complete', () => {
                this.tweens.add({
                    targets: this.nameField,
                    y: this.cameras.main.height / 2 + 150,
                    alpha: 1,
                    duration: 500
                });
            });
        }, 1200);

        this.returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this.returnKey.on('down', event => {
            var enteredName = this.nameField.getChildByName('field').value.trim();
            if (enteredName != "") {
                this.tweens.add({
                    targets: this.nameField,
                    y: this.cameras.main.height / 2 + 200,
                    alpha: 0,
                    duration: 500
                });
                this.welcomeMessage.setText(`welcome, ${enteredName}`);
                this.tweens.add({
                    targets: this.welcomeMessage,
                    y: this.cameras.main.height / 2 + 150,
                    alpha: 1,
                    duration: 500
                }).addListener('complete', () => {
                    this.emitter.emit('nameSubmitted', enteredName);                    
                });
            }
        });
    }

    moveToLobby() {
        setTimeout(() => {
            this.tweens.add({
                targets: [this.welcomeMessage, this.logo],
                alpha: 0,
                duration: 500
            }).addListener('complete', () => {
                this.scene.start('lobby');
            });
        }, 2000);
    }
}