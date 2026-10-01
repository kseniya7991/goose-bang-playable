import { Sprite, Container, Assets } from "pixi.js";

export class Mountains {
    static BOTTOM_OFFSET = window.innerWidth < 598 ? 32 : 40;
    constructor(app) {
        this.app = app;
        this.container = new Container();
        this.init();
    }
    init() {
        this.sprite = Sprite.from(Assets.get("mountains"));
        this.sprite.anchor.set(0, 1);
        this.container.addChild(this.sprite);
        this.container.y = -Mountains.BOTTOM_OFFSET;

        this.layout();
    }

    layout() {
        this.sprite.width = Math.max(1000, this.app.screen.width);
        this.sprite.x = 0;
    }

    resize() {
        this.layout();
    }
}
