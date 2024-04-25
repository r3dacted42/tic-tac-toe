import EventDispatcher from "../EventDispatcher.js";
import { playerName } from "../game.js";

export default class Login extends Phaser.Scene {
    constructor() {
        super("login");
        this.emitter = EventDispatcher.getInstance();
    }

    preload() {
        this.load.image('logo', 'assets/logo.png');
        this.load.html('formField', 'assets/formField.html');
    }

    create() {
        this.logo = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'logo').setScale(0.5).setAlpha(0);
        this.nameField = this.add.dom(this.cameras.main.width / 2, this.cameras.main.height / 2 + 100).createFromCache('formField').setAlpha(0);
        this.nameField.getChildByName('field').placeholder = 'Enter Your Name';
        this.welcomeMessage = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 100, "", {fontSize:'20px'}).setAlpha(0).setOrigin(0.5);

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

        this.returnKey.on("down", event => {
            var enteredName = this.nameField.getChildByName('field').value.trim();
            if (enteredName != "") {
                this.emitter.emit('nameSubmitted', enteredName);
                this.tweens.add({
                    targets: this.nameField,
                    y: this.cameras.main.height / 2 + 200,
                    alpha: 0,
                    duration: 500
                });
                this.welcomeMessage.setText(`Welcome, ${playerName}`);
                this.tweens.add({
                    targets: this.welcomeMessage,
                    y: this.cameras.main.height / 2 + 150,
                    alpha: 1,
                    duration: 500
                }).addListener('complete', () => {
                    setTimeout(() => {
                        this.tweens.add({
                            targets: [this.welcomeMessage, this.logo],
                            alpha: 0,
                            duration: 500
                        });
                        this.scene.start('lobby');
                    }, 2000);
                });
            }
        });
    }
}