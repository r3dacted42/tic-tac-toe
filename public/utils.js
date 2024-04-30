let instance = null;

export class EventDispatcher extends Phaser.Events.EventEmitter {
    constructor() {
        super();       
    }
    static getInstance() {
        if (instance == null) {
            instance = new EventDispatcher();
        }
        return instance;
    }
}

export class Button extends Phaser.GameObjects.Container {
    constructor(x, y, originX, originY, padX, padY, label, scene, callback) {
        super(scene);
        this.scene = scene;
        const button = scene.add.text(x, y, label, {fontSize:'20px'})
            .setOrigin(originX, originY)
            .setPadding(padX, padY)
            .setStyle({ backgroundColor: '#202020' })
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => callback())
            .on('pointerover', () => button.setStyle({ fill: '#f39c12' }))
            .on('pointerout', () => button.setStyle({ fill: '#FFF' }));
        this.add(button);
        this.scene.add.existing(this);
    }
}