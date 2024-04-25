import EventDispatcher from "./EventDispatcher.js";

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
        this.nameField = this.add.dom(this.cameras.main.width / 2, this.cameras.main.height / 2 + 150).createFromCache('formField').setAlpha(0);
        
        this.tweens.add({
            targets: this.logo,
            alpha: 1,
            duration: 1200
        });
        
        setTimeout(() => {
            this.tweens.add({
                targets: this.logo,
                y: this.cameras.main.height / 2 - 100,
                duration: 500
            }).addListener('complete', () => {
                console.log('logo tweens ended');
                this.tweens.add({
                    targets: this.nameField,
                    alpha: 1,
                    duration: 500
                });
            });
        }, 2000);
        
        this.returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this.returnKey.on("down", event => {
            var enteredName = this.nameField.getChildByName('name').value.trim();
            if (enteredName != "") {
                this.emitter.emit('nameSubmitted', enteredName);
            }
        });
    }
}