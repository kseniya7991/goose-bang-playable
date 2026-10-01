import { Container } from "pixi.js";
import { createSpineFromData } from "../utils/createSpineFromData";
import { GAME_PHASES } from "../main.js";
import { SPINE_ASSETS } from "../assets";

export class Goose {
    static SKELETON = "gooseSkeleton";
    static ATLAS = "gooseAtlas";
    static BOTTOM_OFFSET = window.innerWidth < 598 ? 20 : 40;
    static RIGHT_OFFSET = window.innerWidth < 598 ? 20 : 40;
    static CURRENT_SCALE = window.innerWidth < 598 ? 1 : 1.5;
    constructor(game) {
        this.game = game;
        this.app = game.app;
        this.defaultPosition = { x: 0, y: 0 };
        this.ticker = null;
        this.init();
    }

    init() {
        this.createGooseSpine();
        this.createEagleSpine();
    }

    createEagleSpine() {
        this.eagleContainer = new Container();

        try {
            this.eagleSpine = createSpineFromData(SPINE_ASSETS.goose, "gooseTexture");

            this.eagleSpine.skeleton.setSkinByName("default");
            this.eagleSpine.skeleton.setToSetupPose();

            this.eagleContainer.addChild(this.eagleSpine);

            this.eagleSpine.scale.set(Goose.CURRENT_SCALE);

            this.addEagleToScene();
        } catch (error) {
            console.error("Failed to create eagle spine:", error);
        }
    }

    addEagleToScene() {
        this.eagleContainer.y = -this.app.screen.height;
        this.eagleContainer.x = this.app.screen.width / 2;
    }

    updateContainerPosition(pos) {
        this.gooseContainer.position.set(pos.x, Math.min(pos.y, this.defaultPosition.y));
    }

    createGooseSpine() {
        this.gooseContainer = new Container();

        try {
            this.gooseSpine = createSpineFromData(SPINE_ASSETS.goose, "gooseTexture");

            this.state = this.gooseSpine.state;
            this.gooseContainer.addChild(this.gooseSpine);

            this.gooseSpine.scale.set(Goose.CURRENT_SCALE);
            this.setUpGoose();
        } catch (error) {
            console.error("Failed to create goose spine:", error);
        }
    }

    setUpGoose() {
        this.gooseSpine.visible = true;
        this.gooseSpine.state.setAnimation(0, "idle", true);
        this.game.audio.playSoundWithId("duck_in");
        setTimeout(() => this.addGooseToScene(), 0);
    }

    addGooseToScene() {
        const speed = 600;

        let targetX = 0;
        let targetY = 0;

        const moveGoose = () => {
            const bounds = this.gooseContainer.getBounds();
            if (bounds.width === 0 || bounds.height === 0) return;
            this.defaultPosition = {
                x: bounds.width / 2 + Goose.RIGHT_OFFSET,
                y: bounds.height / -2 + Goose.BOTTOM_OFFSET / 2,
            };
            if (!this._gooseTargetReady) {
                this._gooseTargetReady = true;

                targetX = this.defaultPosition.x;
                targetY = this.defaultPosition.y;

                this.gooseContainer.x = -bounds.width;
                this.gooseContainer.y = targetY;
            }

            const deltaSeconds = this.app.ticker.deltaMS / 1000;

            this.gooseContainer.x += speed * deltaSeconds;

            if (this.gooseContainer.x >= targetX) {
                this.gooseContainer.x = targetX;
                this.gooseContainer.y = targetY;

                this.app.ticker.remove(moveGoose);
                this._gooseTargetReady = false;
            }
        };

        this.app.ticker.add(moveGoose);
    }

    changePhase(phase, isCashout = false) {
        if (phase === GAME_PHASES.PREPARING) {
            this.playRunFlyAnimation();
        } else if (phase === GAME_PHASES.FINISHING && isCashout) {
            this.playShootAnimation();
        } else if (phase === GAME_PHASES.FINISHING && !isCashout) {
            this.playEagleAnimation();
        } else if (phase === GAME_PHASES.WAITING) {
            this.setUpGoose();
        }
    }
    playRunFlyAnimation() {
        let runCounter = 0;
        this.state.clearListeners();

        this.state.addListener({
            complete: (entry) => {
                if (entry.animation.name === "run") {
                    runCounter++;
                    if (runCounter === 3) {
                        this.game.setPlayingPhase();
                        this.game.audio.stopSoundByName("duck_run_loop");
                        this.game.audio.stopSoundByName("duck_run");
                        this.game.audio.playSoundWithId("duck_lift_off");
                    }
                }
            },
        });

        this.game.audio.playSoundWithId("duck_run_loop");
        this.game.audio.playSoundWithId("duck_run");

        this.gooseSpine.state.setAnimation(0, "run", false);
        this.gooseSpine.state.addAnimation(0, "run", false, 0);
        this.gooseSpine.state.addAnimation(0, "run", false, 0);

        this.gooseSpine.state.addAnimation(0, "r_f", false, 0);
        this.gooseSpine.state.addAnimation(0, "fly", true, 0);
    }

    playEagleAnimation() {
        const duration = 0.5;
        const startX = this.eagleContainer.x;
        const startY = this.eagleContainer.y;

        const targetX = this.gooseContainer.x;
        const targetY = this.gooseContainer.y;

        let elapsed = 0;

        const moveToGoose = () => {
            const deltaSeconds = this.app.ticker.deltaMS / 1000;
            elapsed += deltaSeconds;

            let t = Math.min(elapsed / duration, 1);
            t = t * t;

            this.eagleContainer.x = startX + (targetX - startX) * t;
            this.eagleContainer.y = startY + (targetY - startY) * t;

            if (t >= 1) {
                this.app.ticker.remove(moveToGoose);

                this.game.audio.playSoundWithId("duck_wings_flap");
                this.game.audio.playSoundWithId("lose_eagle");
                this.eagleSpine.state.setAnimation(0, "catch", true);
                const feathersEntry = this.gooseSpine.state.setAnimation(0, "feathers", false);

                this.flyToCorner();

                feathersEntry.listener = {
                    complete: () => {
                        this.gooseSpine.visible = false;
                    },
                };
            }
        };

        this.app.ticker.add(moveToGoose);
        this.eagleSpine.state.setAnimation(0, "eagle", false);
    }

    playShootAnimation() {
        const state = this.gooseSpine.state;

        state.setAnimation(0, "shoot", false);
        const downEntry = state.addAnimation(0, "down", false, 0);

        const downAnimation = this.gooseSpine.skeleton.data.findAnimation("down");
        const downDuration = downAnimation.duration;

        downEntry.listener = {
            start: () => {
                this.goDown(downDuration);
            },
            complete: () => {
                this.stopGoDown();
            },
        };
    }

    flyToCorner() {
        const duration = 0.5;
        const startX = this.eagleContainer.x;
        const startY = this.eagleContainer.y;

        const targetX = this.app.screen.width;
        const targetY = -this.app.screen.height;

        let elapsed = 0;

        const moveTicker = () => {
            const deltaSeconds = this.app.ticker.deltaMS / 1000;
            elapsed += deltaSeconds;

            let t = Math.min(elapsed / duration, 1);
            t = t * t;

            this.eagleContainer.x = startX + (targetX - startX) * t;
            this.eagleContainer.y = startY + (targetY - startY) * t;

            if (t >= 1) {
                this.app.ticker.remove(moveTicker);
                this.flewAway();
            }
        };

        this.app.ticker.add(moveTicker);
    }

    flewAway() {
        this.gooseSpine.state.clearTracks();
        this.eagleSpine.state.clearTracks();
        this.gooseSpine.skeleton.setToSetupPose();
        this.eagleSpine.skeleton.setToSetupPose();
    }

    goDown(duration) {
        const startY = this.gooseContainer.y;
        const targetY = 0;
        const distance = Math.abs(targetY - startY);

        const minSpeed = 2000;
        const neededSpeed = distance / duration;
        const speed = Math.max(minSpeed, neededSpeed);
        const direction = Math.sign(targetY - startY);

        this.ticker = () => {
            const deltaSeconds = this.app.ticker.deltaMS / 1000;
            const nextY = this.gooseContainer.y + direction * speed * deltaSeconds;

            if ((direction > 0 && nextY >= targetY) || (direction < 0 && nextY <= targetY)) {
                this.stopGoDown();
                return;
            }

            this.gooseContainer.y = nextY;
        };
        this.app.ticker.add(this.ticker);
    }

    stopGoDown() {
        if (this.ticker) {
            this.app.ticker.remove(this.ticker);
            this.ticker = null;
            this.gooseSpine.state.setAnimation(0, "splash", false);
        }
    }

    resetGoose() {
        this.gooseSpine.visible = false;
        this.ticker = null;
        this.app.ticker.remove(this.ticker);
    }
}
