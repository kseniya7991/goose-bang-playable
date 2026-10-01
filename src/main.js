import "@esotericsoftware/spine-pixi-v8";
import { Application, Assets, Container } from "pixi.js";

import { STATIC_ASSETS, SPINE_ASSETS, AUDIO_DATA } from "./assets";
import { Goose } from "./Characters/Goose.js";
import { Rifle } from "./Characters/Rifle.js";
import { Background } from "./World/Background";
import { Clouds } from "./World/Clouds";
import { Mountains } from "./World/Mountains";
import { Water } from "./World/Water";
import { Bushes } from "./World/Bushes";
import { GamePanel } from "./GamePanel";
import { AnimatedCurve } from "./AnimatedCurve";
import { AudioManager } from "./AudioManager";

const GAME_CONTAINER_SELECTOR = ".js-game";
const GAME_MULTIPLIER_SELECTOR = ".js-game__mult";
const GAME_SUM_SELECTOR = ".js-game__sum";
const GAME_WIN_SELECTOR = ".js-game__win";
const GAME_RESULT_SELECTOR = ".js-game__result";
const GAME_CANVAS_SELECTOR = ".js-game__canvas";
const GAME_PLAY_SELECTOR = ".js-game__play";
const GAME_CASHOUT_POPUP = ".js-game__cashout-popup";
const GAME_FINAL_POPUP = ".js-game__final";
const GAME_SOUND_CONTROL_SELECTOR = ".js-game__sound-control";

const ACTIVE_CLASS = "active";
const DISABLED_CLASS = "disabled";
const START_MULT = 1.01;
const MAX_ROUND = 3;
const FINISH_PHASE_DURATION = 4000;
const FINAL_PHASE_DURATION = 2000;
const MULTIPLIERS_PER_ROUND = {
    1: 7,
    2: 4,
    3: 12,
};

export const formatNumber = (value) => new Intl.NumberFormat("ru-RU").format(value);

export const GAME_PHASES = {
    WAITING: "waiting",
    PREPARING: "preparing",
    PLAYING: "playing",
    FINISHING: "finishing",
    STOP: "stop",
};
class Game {
    constructor() {
        this.container = new Container();
        this.el = document.querySelector(GAME_CONTAINER_SELECTOR);

        // DOM elements
        this.multEl = document.querySelector(GAME_MULTIPLIER_SELECTOR);
        this.sumEl = document.querySelector(GAME_SUM_SELECTOR);
        this.resultEl = document.querySelector(GAME_RESULT_SELECTOR);
        this.canvasContainer = document.querySelector(GAME_CANVAS_SELECTOR);
        this.playAgainBtn = document.querySelector(GAME_PLAY_SELECTOR);
        this.cashoutPopup = document.querySelector(GAME_CASHOUT_POPUP);
        this.cashoutWin = this.cashoutPopup?.querySelector(GAME_WIN_SELECTOR);
        this.finalPopup = document.querySelector(GAME_FINAL_POPUP);
        this.soundControl = document.querySelector(GAME_SOUND_CONTROL_SELECTOR);

        // Settings
        this.currentRound = 0;
        this.currentMult = START_MULT;
        this.maxMultThisRound = MULTIPLIERS_PER_ROUND[this.currentRound] || 2;
        this.balance = 100000;
        this.bet = 100;
        this.minBet = 20;
        this.maxBet = 2500;
        this.totalWin = 0;
        this.initialSpeed = 70;
        this.initialStep = 0.01;

        // States
        this.currentPhase = GAME_PHASES.WAITING;
        this.cashoutStage = false;
        this.soundsIsPlaying = false;

        // Other
        this.curveTicker = null;
        this.curveWithGooseTicker = null;
        this.rifleTicker = null;
        this.finishTimer = null;
        this.curveTimer = null;

        this.init();
    }

    async init() {
        await this.initPixiApp();
        await this.loadAssets();
        this.audio = await new AudioManager(AUDIO_DATA);

        this.addWorldItems();
        await this.createWorld();

        this.gamePanel = new GamePanel(this);
        this.audio.init();

        this.container.y = this.app.screen.height;
        this.app.stage.addChild(this.container);

        this.playAgainBtn.addEventListener("click", () => this.setWaitingPhase());

        window.addEventListener("click", () => this.playSounds(), { once: true });
        this.soundControl.addEventListener("click", () => {
            this.soundsIsPlaying = !this.soundsIsPlaying;
            this.audio.mute(!this.soundsIsPlaying);
            this.soundControl.classList.toggle(DISABLED_CLASS, !this.soundsIsPlaying);
        });

        this.setWaitingPhase();
    }

    playSounds() {
        this.audio.playSoundWithId("main_loop2", { loop: true });
        this.soundsIsPlaying = true;
    }

    async initPixiApp() {
        this.app = new Application();
        await this.app.init({
            resizeTo: this.canvasContainer,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            antialias: true,
        });
        this.canvasContainer.appendChild(this.app.canvas);
    }

    async loadAssets() {
        await Assets.load(STATIC_ASSETS);
        await Assets.load({ alias: "gooseTexture", src: SPINE_ASSETS.goose.texture });
        await Assets.load({ alias: "rifleTexture", src: SPINE_ASSETS.rifle.texture });
    }

    addWorldItems() {
        this.background = new Background(this.app);
        this.app.stage.addChildAt(this.background.container, 0);

        this.gameContainer = new Container();
        this.container.addChild(this.gameContainer);

        this.mountains = new Mountains(this.app);
        this.clouds = new Clouds(this.app);
        this.bushes = new Bushes(this.app);
        this.water = new Water(this.app);
        this.gameContainer.addChild(
            this.mountains.container,
            this.clouds.container,
            this.bushes.container,
        );
    }

    createWorld() {
        this.gameContainer.addChild(this.water.topLineContainer);

        this.curve = new AnimatedCurve(this);
        this.goose = new Goose(this);
        this.rifle = new Rifle(this);

        this.gameContainer.addChild(
            this.curve.container,
            this.goose.gooseContainer,
            this.goose.eagleContainer,
            this.water.bottomLineContainer,
            this.rifle.container,
        );
        this.water.moveWater();

        window.addEventListener("resize", () => {
            this.water.resize();
            this.mountains.resize();
            this.background.resize();
            this.container.y = this.canvasContainer.offsetHeight;
        });
    }

    setWaitingPhase() {
        this.goose.resetGoose();
        clearTimeout(this.finishTimer);
        clearTimeout(this.curveTimer);
        this.curve.setPotentialCurveDanger(false);
        this.isCounterStopped = false;
        this.changePhase(GAME_PHASES.WAITING);

        this.goose.changePhase(this.currentPhase);
        this.rifle.changePhase(this.currentPhase);
        this.curve.changePhase(this.currentPhase);
        this.gamePanel.reset();

        this.cashoutStage = false;
        this.cashoutPopup?.classList.remove(ACTIVE_CLASS);
        this.resetCurve();
        this.app.ticker.remove(this.rifleTicker);
    }

    setPreparingPhase() {
        this.changePhase(GAME_PHASES.PREPARING);

        this.goose.changePhase(this.currentPhase);
        this.curve.changePhase(this.currentPhase);
        this.gamePanel.setBalance(this.balance - this.bet);

        this.bushes.startBushes();
        this.water.moveFaster();

        this.nextRound();
        this.startCurve();
    }

    setPlayingPhase() {
        this.changePhase(GAME_PHASES.PLAYING);
        this.rifle.changePhase(this.currentPhase);
        this.rifleTicker = () => this.rifle.update();
        this.app.ticker.add(this.rifleTicker);
        this.countUpToMult();
    }

    setCashout() {
        this.cashoutStage = true;
        this.gamePanel.setWin(this.totalWin);
        this.cashoutWin.textContent = formatNumber(this.totalWin);

        this.setFinishingPhase();
    }

    setFinishingPhase() {
        this.changePhase(GAME_PHASES.FINISHING);

        this.stopCounter();

        this.goose.changePhase(this.currentPhase, this.cashoutStage);
        this.rifle.changePhase(this.currentPhase, this.cashoutStage);
        this.bushes.stopBushes();
        this.water.moveNormal();

        this.stopCurve();

        if (this.cashoutStage) this.audio.playSoundWithId("win4");

        if (this.currentRound >= MAX_ROUND) {
            this.stopGame();
            return;
        } else if (this.cashoutStage) {
            this.cashoutPopup?.classList.add(ACTIVE_CLASS);
        } else if (!this.cashoutStage) {
            this.finishTimer = setTimeout(() => {
                this.setWaitingPhase();
            }, FINISH_PHASE_DURATION);
        }
    }

    startCurve() {
        this.curveTicker = () => {
            this.curve.animate();
        };
        this.curveWithGooseTicker = () => {
            const curvePoint = this.curve.getTopPoint();
            this.goose.updateContainerPosition(curvePoint);
        };
        this.app.ticker.add(this.curveTicker);
        this.app.ticker.add(this.curveWithGooseTicker);
    }

    stopCurve() {
        if (this.cashoutStage) {
            this.curve.startCompletion(this.currentMult, this.maxMultThisRound);
            this.app.ticker.remove(this.curveWithGooseTicker);
            this.curve.onCompletionFinished = () => {
                this.app.ticker.remove(this.curveTicker);
            };
        } else {
            this.curve.setPotentialCurveDanger(true);
            setTimeout(() => {
                this.app.ticker.remove(this.curveWithGooseTicker);
                this.app.ticker.remove(this.curveTicker);
            }, 0);
        }
    }

    resetCurve() {
        this.app.ticker.remove(this.curveTicker);
        this.curve.reset();
    }

    stopGame() {
        clearTimeout(this.finishTimer);
        clearTimeout(this.curveTimer);
        this.el.dataset.phase = GAME_PHASES.STOP;
        this.finishTimer = setTimeout(() => {
            this.resetCurve();
            this.finalPopup?.classList.add(ACTIVE_CLASS);
        }, FINAL_PHASE_DURATION);
    }

    nextRound() {
        this.currentRound += 1;
    }

    changePhase(phase) {
        this.currentPhase = phase;
        this.el.dataset.phase = phase;
    }

    countUpToMult() {
        let multiplier = START_MULT;
        let speed = this.initialSpeed;
        let step = this.initialStep;
        let lastIntegerMultiplier = 1;

        const updateMultiplierDisplay = (multiplier) => {
            this.currentMult = multiplier.toFixed(2);
            this.multEl.textContent = this.currentMult;

            this.totalWin = Number(this.bet * this.currentMult).toFixed(0);
            this.sumEl.textContent = this.totalWin;
        };

        const updateCounter = () => {
            if (this.isCounterStopped) {
                updateMultiplierDisplay(multiplier);
                return;
            }

            this.maxMultThisRound = MULTIPLIERS_PER_ROUND[this.currentRound] || 2;

            if (multiplier >= this.maxMultThisRound) {
                updateMultiplierDisplay(this.maxMultThisRound);
                this.setFinishingPhase();
                return;
            }

            multiplier += step;
            updateMultiplierDisplay(parseFloat(multiplier));

            // Scale result
            const currentInt = Math.floor(multiplier);

            if (currentInt !== lastIntegerMultiplier && currentInt <= 5) {
                lastIntegerMultiplier = currentInt;
                const scaleValue = 1 + (currentInt - 1) * 0.2;
                this.audio.playSoundWithId("counter_up");
                this.resultEl.style.transform = `scale(${scaleValue})`;
            }
            //=================

            if (multiplier.toFixed(0) / 10 > 1) step = 0.015;
            if (multiplier.toFixed(0) / 50 > 1) step = 0.025;

            if (Math.floor(multiplier) !== Math.floor(multiplier - 0.01)) {
                speed /= 1.5;
            }

            this.counterTimer = setTimeout(updateCounter, speed);
        };

        updateCounter();
    }

    stopCounter() {
        this.isCounterStopped = true;

        if (this.counterTimer) {
            clearTimeout(this.counterTimer);
            this.counterTimer = null;
        }
    }
}

new Game();
