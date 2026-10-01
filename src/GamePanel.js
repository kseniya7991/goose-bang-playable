import { GAME_PHASES, formatNumber } from "./main";
export class GamePanel {
    constructor(game) {
        this.game = game;

        this.betSteps = [
            20, 40, 60, 80, 100, 120, 140, 200, 240, 300, 350, 400, 500, 600, 700, 800, 900, 1000,
            1200, 1400, 1600, 1800, 2000, 2500,
        ];

        this.cacheElements();
        this.bindEvents();
        this.render();
    }

    cacheElements() {
        this.root = document.getElementById("game-ui");
        this.balanceEl = document.getElementById("balance");
        this.winEl = document.getElementById("win");
        this.betEl = document.getElementById("bet");
        this.minusBtn = document.getElementById("bet-minus");
        this.plusBtn = document.getElementById("bet-plus");
        this.actionBtn = document.getElementById("action-btn");

        if (
            !this.root ||
            !this.balanceEl ||
            !this.winEl ||
            !this.betEl ||
            !this.minusBtn ||
            !this.plusBtn ||
            !this.actionBtn
        ) {
            throw new Error("HtmlGamePanelController: required DOM elements not found");
        }
    }


    /* ---------- EVENTS ---------- */

    bindEvents() {
        this.onMinusClick = () => this.decreaseBet();
        this.onPlusClick = () => this.increaseBet();
        this.onActionClick = () => this.handleAction();

        this.minusBtn.addEventListener("click", this.onMinusClick);
        this.plusBtn.addEventListener("click", this.onPlusClick);
        this.actionBtn.addEventListener("click", this.onActionClick);
    }

    /* ---------- GAME LOGIC ---------- */

    decreaseBet() {
        const currentIndex = this.betSteps.indexOf(this.game.bet);

        if (currentIndex === -1) return;

        const prevIndex = Math.max(currentIndex - 1, 0);

        this.game.bet = this.betSteps[prevIndex];
        this.render();
    }

    increaseBet() {
        const currentIndex = this.betSteps.indexOf(this.game.bet);

        if (currentIndex === -1) return;
        const nextIndex = Math.min(currentIndex + 1, this.betSteps.length - 1);

        this.game.bet = this.betSteps[nextIndex];
        this.render();
    }

    handleAction() {
        if (this.game.currentPhase === GAME_PHASES.WAITING) {
            this.game.setPreparingPhase();
        } else if (this.game.currentPhase === GAME_PHASES.PLAYING) {
            this.game.setCashout();
        } else {
            return;
        }
    }

    startGame() {
        if (this.game.balance < this.game.bet) {
            console.warn("Недостаточно средств");
            return;
        }

        this.game.balance -= this.game.bet;
        this.game.gameState = "playing";
        this.actionBtn.textContent = "■";

        window.dispatchEvent(
            new CustomEvent("gameStart", {
                detail: { bet: this.game.bet },
            })
        );

        this.render();
    }

    finishGame() {
        this.actionBtn.disabled = true;
    }


    resetGame(winAmount = 0) {
        this.game.win = winAmount;
        this.game.balance += winAmount;
        this.actionBtn.disabled = false;
        this.render();
    }

    setBalance(value) {
        this.game.balance = value;
        this.render();
    }

    setWin(value) {
        this.game.win = value;
        this.render();
    }

    reset() {
        this.game.win = 0;
        this.render();
    }

    render() {
        this.balanceEl.textContent = formatNumber(this.game.balance);
        this.winEl.textContent = formatNumber(this.game.win);
        this.betEl.textContent = this.game.bet;

        const isWaiting = this.game.currentPhase === GAME_PHASES.WAITING;

        this.minusBtn.disabled = !isWaiting;
        this.plusBtn.disabled = !isWaiting;
    }

    destroy() {
        this.minusBtn.removeEventListener("click", this.onMinusClick);
        this.plusBtn.removeEventListener("click", this.onPlusClick);
        this.actionBtn.removeEventListener("click", this.onActionClick);
    }
}
