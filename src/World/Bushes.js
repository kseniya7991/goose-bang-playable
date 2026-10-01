import { Texture, Sprite, Container, Assets } from "pixi.js";

export class Bushes {
    static MIN_GAP = 100;
    static BOTTOM_OFFSET = window.innerWidth < 598 ? 32 : 40;

    constructor(app) {
        this.app = app;
        this.bushTextures = [Assets.get("bush1"), Assets.get("bush2"), Assets.get("bush3")];
        this.container = new Container();
        this.bushesTicker = null;
        this.maxVisibleBushes = 3;
        this.bushSpeed = 6;
        this.bushY = -Bushes.BOTTOM_OFFSET;
        this.bushes = [];
        this.bushesWidth = 0;

        this.scale = window.innerWidth < 598 ? 0.6 : 1;

        this.init();
    }

    init() {
        this.bushesWidth = this.calcBushesTotalWidth();
        this.gap = this.calcGap();

        this.startPositioning();
    }

    calcBushesTotalWidth() {
        let totalWidth = 0;
        for (let i = 0; i < this.maxVisibleBushes; i++) {
            totalWidth += this.bushTextures[i % this.bushTextures.length].width;
        }
        return totalWidth;
    }

    calcGap() {
        return Math.max(
            Bushes.MIN_GAP,
            (this.app.screen.width - this.bushesWidth) / (this.maxVisibleBushes - 1)
        );
    }

    startPositioning() {
        let xCursor = 0;
        for (let i = 0; i < this.maxVisibleBushes + 1; i++) {
            const texture = this.bushTextures[i % this.bushTextures.length];
            const bush = new Sprite(texture);

            bush.scale.set(this.scale);
            bush.x = xCursor;
            bush.y = this.bushY;
            bush.anchor.set(0, 1);

            xCursor += bush.width + this.gap;

            this.container.addChild(bush);
            this.bushes.push(bush);
        }
    }

    startBushes() {
        if (this.bushesTicker) return;

        this.bushesTicker = () => {
            for (const bush of this.bushes) {
                bush.x -= this.bushSpeed;
            }

            let rightMostBush = this.bushes.reduce((max, b) =>
                b.x + b.width > max.x + max.width ? b : max
            );

            for (const bush of this.bushes) {
                if (bush.x + bush.width < 0) {
                    bush.x = rightMostBush.x + rightMostBush.width + this.gap;
                    rightMostBush = bush;
                }
            }
        };

        this.app.ticker.add(this.bushesTicker);
    }

    stopBushes() {
        if (!this.bushesTicker) return;

        this.app.ticker.remove(this.bushesTicker);
        this.bushesTicker = null;
    }
}
