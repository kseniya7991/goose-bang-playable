import { Container } from "pixi.js";
import { createSpineFromData } from "../utils/createSpineFromData";
import { GAME_PHASES } from "../main.js";
import { SPINE_ASSETS } from "../assets";

export class Rifle {
    static SKELETON = "rifleSkeleton";
    static ATLAS = "rifleAtlas";
    static CURRENT_SCALE = window.innerWidth < 598 ? 0.4 : 0.8;

    constructor(game) {
        this.game = game;
        this.app = game.app;

        this.defaultPosition = { x: 0, y: 0 };

        this.isAppearing = false;
        this.isDisappearing = false;
        this.lerpSpeed = 0.05;
        this.targetPosition = { x: 0, y: 0 };

        this.init();
    }

    init() {
        this.container = new Container();

        try {
            this.spine = createSpineFromData(SPINE_ASSETS.rifle, "rifleTexture");

            this.container.addChild(this.spine);
            this.spine.scale.set(Rifle.CURRENT_SCALE);
            this.setUpRifle();
        } catch (error) {
            console.error("Failed to create rifle spine:", error);
        }
    }

    setUpRifle() {
        requestAnimationFrame(() => {
            const bounds = this.container.getBounds();
            if (bounds.width === 0 || bounds.height === 0) return;

            this.defaultPosition = {
                x: 0,
                y: bounds.height,
            };
            this.container.position.set(this.defaultPosition.x, this.defaultPosition.y);
        });
    }

    animateIn() {
        this.isDisappearing = false;
        this.isAppearing = true;
        this.container.alpha = 1;

        this.targetPosition = {
            x: this.app.screen.width / 2,
            y: -40 * Rifle.CURRENT_SCALE,
        };
    }

    animateOut() {
        this.isAppearing = false;
        this.isDisappearing = true;

        this.targetPosition = {
            x: this.container.x,
            y: this.defaultPosition.y,
        };
    }

    update() {
        const dt = this.app.ticker.deltaTime;
        const lerpFactor = this.lerpSpeed * dt;

        if (this.isAppearing) {
            this.container.x += (this.targetPosition.x - this.container.x) * lerpFactor;
            this.container.y += (this.targetPosition.y - this.container.y) * lerpFactor;

            if (Math.abs(this.container.y - this.targetPosition.y) < 1) {
                this.container.position.set(this.targetPosition.x, this.targetPosition.y);
                this.isAppearing = false;
            }
        } else if (this.isDisappearing) {
            this.container.y += (this.targetPosition.y - this.container.y) * lerpFactor;
            this.container.alpha -= 0.05 * dt;

            if (this.container.alpha <= 0) {
                this.container.alpha = 0;
                this.container.y = this.targetPosition.y;
                this.isDisappearing = false;
            }
        }
    }

    changePhase(phase, isCashout = false) {
        if (phase === GAME_PHASES.PLAYING) {
            this.game.audio.playSoundWithId("press_start");
            this.spine.state.setAnimation(0, "idle", true);
            this.animateIn();
        } else if (phase === GAME_PHASES.FINISHING) {
            if (isCashout) {
                this.game.audio.playSoundWithId("shot_win");
                const shootAnimation = this.spine.state.setAnimation(0, "shoot", false);
                shootAnimation.listener = {
                    complete: () => {
                        this.animateOut();
                    },
                };
            } else {
                this.animateOut();
            }
        } else if (phase === GAME_PHASES.WAITING) {
            this.setUpRifle();
            this.container.alpha = 1;
            this.isAppearing = false;
            this.isDisappearing = false;
        }
    }
}
