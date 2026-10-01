import { Sprite, Texture, Container, Assets } from "pixi.js";

export class Water {
    constructor(app) {
        this.app = app;
        this.speedTopLine = 1.2;
        this.speedBottomLine = 0.8;
        this.yAnchorTopLine = 2;
        this.yAnchorBottomLine = 1;
        this.scaleYTopLine = 5;
        this.scaleYBottomLine = 4;
        this.alphaTopLine = 1;
        this.alphaBottomLine = 0.9;
        
        this.scale = window.innerWidth < 598 ? 0.8 : 1;

        this.init();
    }

    init() {
        this.createTopLine();
        this.createBottomLine();
    }

    createTopLine() {
        const texture = Assets.get("water1");
        this.topLine = this.createSprites(texture);
        this.topLineContainer = new Container();
        this.setWaterLine(
            this.topLine,
            this.yAnchorTopLine,
            this.scaleYTopLine,
            this.alphaTopLine,
            this.topLineContainer
        );
        this.layout(this.topLine);
    }

    createBottomLine() {
        const texture = Assets.get("water2");
        this.bottomLine = this.createSprites(texture);
        this.bottomLineContainer = new Container();
        this.setWaterLine(
            this.bottomLine,
            this.yAnchorBottomLine,
            this.scaleYBottomLine,
            this.alphaBottomLine,
            this.bottomLineContainer
        );
        this.layout(this.bottomLine);
    }

    createSprites(texture) {
        return { w1: new Sprite(texture), w2: new Sprite(texture) };
    }

    setWaterLine(line, yAnchor = 1, scaleY = 3, alpha = 1, container) {
        const { w1, w2 } = line;
        [w1, w2].forEach((w) => {
            w.anchor.set(0, yAnchor);
            w.scale.set(1, scaleY * this.scale);
            
            w.alpha = alpha;
            container.addChild(w1, w2);
        });
    }

    layout(line) {
        const { w1, w2 } = line;
        const width = 5000;

        w1.width = width;
        w2.width = width;

        w1.x = 0;
        w2.x = width;
    }

    resize() {
        this.layout(this.topLine);
        this.layout(this.bottomLine);
    }

    moveFaster() {
        this.isFaster = true;
    }

    moveNormal() {
        this.isFaster = false;
    }

    moveWater() {
        this.app.ticker.add(() => {
            this.moveWaterLine(this.topLine, this.speedTopLine);
            this.moveWaterLine(this.bottomLine, this.speedBottomLine);
        });
    }

    moveWaterLine(line, speed) {
        const { w1, w2 } = line;

        w1.x -= speed + (this.isFaster ? 8 : 0);
        w2.x -= speed + (this.isFaster ? 8 : 0);

        if (w1.x + w1.width <= 0) {
            w1.x = w2.x + w2.width;
        }
        if (w2.x + w2.width <= 0) {
            w2.x = w1.x + w1.width;
        }
    }
}
