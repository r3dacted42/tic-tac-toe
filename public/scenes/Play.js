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
        this.emitter.on('self_move', (data) => this.handleSelfMove(data));
        this.emitter.on('opp_move', (data) => this.handleOppMove(data));
        this.emitter.on('game_complete', (data) => this.handleGameComplete(data));
        this.emitter.on('reset_complete', (data) => {
            this.data = data;
            this.startGame();
        });
    }

    init(data) {
        console.log('inside play');
        this.membersInfo = data.members;
        console.log(this.membersInfo);
        this.data = data.room;
        console.log(this.data);
    }

    preload() {
        this.load.image('board', 'assets/board.png');
        this.load.image('x', 'assets/x.png');
        this.load.image('o', 'assets/o.png');
    }

    create() {
        let myNameText = this.add.text(this.cameras.main.width / 2 - 50, 100, this.membersInfo.me.info.name + '(you)', {fontSize: '25px'}).setOrigin(1, 0.5).setAlpha(0);
        this.myScoreText = this.add.text(this.cameras.main.width / 2 - 50, 150, '0', {fontSize:'30px'}).setOrigin(1, 0.5).setAlpha(0);
        let vsText = this.add.text(this.cameras.main.width / 2, 100, 'vs', {fontSize: '35px'}).setOrigin(0.5, 0.5).setAlpha(0);
        let oppNameText = null;
        this.oppName = "";
        for (const [k, v] of Object.entries(this.membersInfo.members)) {
            if (k != this.membersInfo.me.id) {
                this.oppName = v.name;
                this.oppId = k;
                oppNameText = this.add.text(this.cameras.main.width / 2 + 50, 100, v.name, {fontSize: '25px'}).setOrigin(0, 0.5).setAlpha(0);
            }
        }
        this.oppScoreText = this.add.text(this.cameras.main.width / 2 + 50, 150, '0', {fontSize:'30px'}).setOrigin(0, 0.5).setAlpha(0);
        let board = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'board').setScale(0.5).setAlpha(0);

        this.messages = new Array();
        this.messageTexts = new Array();
        this.sendMessageField = this.add.dom(10, this.cameras.main.height - 35).createFromCache('textField').setOrigin(0, 0.5).setAlpha(0);
        this.sendMessageField.getChildByName('field').placeholder = 'send message';

        let returnKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        returnKey.on('down', () => {
            let field = this.sendMessageField.getChildByName('field');
            let value = field.value.trim();
            field.value = "";
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
            targets: [myNameText, oppNameText, vsText, this.myScoreText, this.oppScoreText, board, this.sendMessageField],
            alpha: 1,
            duration: 700
        }).addListener('complete', () => {
            this.turnText = {
                _txt: this.add.text(this.cameras.main.width / 2, 200, '', {fontSize:'20px'}).setOrigin(0.5, 0.5),
                _twn: null
            };
            this.moveImages = [];
            this.startGame();
        });
    }

    startGame() {
        if (this.data.game_state.next_move_id == playerId) {
            this.setTurnText(0);
            this.moveChar = 'x';
            this.moveType = 1;
            this.oppChar = 'o';
            this.oppType = -1;
            this.drawMoveSuggestions();
        } else {
            this.setTurnText(1);
            this.moveChar = 'o';
            this.moveType = -1;
            this.oppChar = 'x';
            this.oppType = 1;
        }
    }

    /// 0: your turn  1: opp turn  2: waiting  3: draw  -1: win  -2: lose
    setTurnText(type) {
        if (this.turnText._twn != null) this.turnText._twn.complete();
        this.turnText._txt.setAlpha(1);
        this.turnText._txt.setRotation(0);
        if (type == 0) {
            this.turnText._txt.setText('your turn');
            this.turnText._twn = this.tweens.add({
                targets: this.turnText._txt,
                alpha: {from: 0, to: 1},
                duration: 500,
                repeat: -1,
                yoyo: true
            });
        } else if (type == 1) {
            this.turnText._txt.setText('opponent\'s turn');
            this.turnText._twn = null;
        } else if (type == 2) {
            this.turnText._txt.setText('waiting...');
            this.turnText._twn = this.tweens.add({
                targets: this.turnText._txt,
                alpha: {from: 0, to: 1},
                duration: 200,
                repeat: -1,
                yoyo: true
            });
        } else if (type == 3) {
            this.turnText._txt.setText('-draw-');
            this.turnText._twn = this.tweens.add({
                targets: this.turnText._txt,
                alpha: {from: 0.25, to: 1},
                duration: 1000,
                repeat: -1,
                yoyo: true
            });
        } else if (type == -1) {
            this.turnText._txt.setText('you win! :D');
            this.turnText._twn = this.tweens.add({
                targets: this.turnText._txt,
                alpha: {from: 0.5, to: 1},
                rotation: {from: -0.05, to: 0.05},
                duration: 500,
                repeat: -1,
                yoyo: true
            });
        } else if (type == -2) {
            this.turnText._txt.setText('you lost :/');
            this.turnText._twn = null;
        }
    }

    getCoordsFromPos(pos) {
        let center = {
            x: this.cameras.main.width / 2,
            y: this.cameras.main.height / 2
        };
        let spacing = 128;
        return {
            x: center.x + spacing * (pos % 3 - 1),
            y: center.y + spacing * (Math.floor(pos / 3) - 1)
        };
    }

    drawMoveSuggestions() {
        let counter = 0;
        this.moveSuggestions = [];
        this.clearMoveSuggestions();
        for (const posState of this.data.game_state.board_state) {
            if (posState == 0) {
                const _count = counter;
                let _pos = this.getCoordsFromPos(_count);
                let _img = this.add.image(_pos.x, _pos.y, this.moveChar);
                _img.setOrigin(0.5).setScale(0.35).setAlpha(0).setInteractive().on('pointerup', () => {
                    // blur chat for phones
                    document.activeElement.blur();
                    
                    console.log(`clicked count: ${_count}`);
                    this.clearMoveSuggestions();
                    this.setTurnText(2);
                    this.emitter.emit('made_move', {
                        pos: _count,
                        type: this.moveType
                    });
                });
                let _twn = this.tweens.add({
                    targets: _img,
                    alpha: {from: 0.15, to: 0.85},
                    duration: 500,
                    repeat: -1,
                    yoyo: true
                });
                this.moveSuggestions.push({
                    _img: _img,
                    _twn: _twn
                });
            }
            console.log(`spawning count: ${counter}`);
            counter++;
        }
    }

    clearMoveSuggestions() {
        for (const pos of this.moveSuggestions) {
            pos._twn.complete();
            pos._img.destroy();
        }
    }

    drawMove(pos, char) {
        let _pos = this.getCoordsFromPos(pos);
        this.moveImages.push(this.add.image(_pos.x, _pos.y, char).setOrigin(0.5).setScale(0.42));
    }

    handleSelfMove(data) {
        if (data.status != null) this.data = data.status;
        if (data.success) {
            this.drawMove(data.pos, this.moveChar);
            this.setTurnText(1);
        } else {
            this.drawMoveSuggestions();
            this.setTurnText(0);
        }
    }

    handleOppMove(data) {
        if (data.status != null) this.data = data.status;
        if (data.success) {
            this.drawMove(data.pos, this.oppChar);
            this.drawMoveSuggestions();
            this.setTurnText(0);
        }
    }

    handleGameComplete(data) {
        if (data.success) {
            this.drawMove(data.pos, (data.type == -1 ? 'o' : 'x'));
            if (data.status.game_state.draw === true) {
                this.setTurnText(3);
            } else {
                this.setTurnText((data.status.game_state.winner === playerId) ? -1 : -2);
            }
            this.myScoreText.setText(`${data.status.game_state.scores[(this.moveType == 1 ? 0 : 1)]}`);
            this.oppScoreText.setText(`${data.status.game_state.scores[(this.moveType == 1 ? 1 : 0)]}`);
            this.resetGame();
        }
    }

    resetGame() {
        let resetCounter = 10;
        let resetText = this.add.text(this.cameras.main.width / 2, 250, `game resets in ${resetCounter}`, {fontSize: '20px'}).setOrigin(0.5);
        let resetTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                resetCounter--;
                resetText.setText(`game resets in ${resetCounter}`);
            },
            loop: true
        });
        setTimeout(() => {
            resetTimer.destroy();
            resetText.destroy();
            for (const img of this.moveImages) {
                img.destroy();
            }
            this.setTurnText(2);
            this.emitter.emit('reset_game');
        }, resetCounter * 1000);
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