import { Sprite, Texture, Container } from "pixi.js";

export class Background {
    static TOP_COLOR = "#357BF8";
    static BOTTOM_COLOR = "#87E7FF";

    constructor(app) {
        this.app = app;
        this.container = new Container();

        this.init();
    }

    init() {
        this.bg = new Sprite(this.createGradientTexture());
        this.updateBgSize();
        this.container.addChild(this.bg);
    }

    updateBgSize() {
        this.bg.width = this.app.screen.width;
        this.bg.height = this.app.screen.height;
    }

    createGradientTexture() {
        const canvas = document.createElement("canvas");
        canvas.width = this.app.screen.width;
        canvas.height = this.app.screen.height;

        const ctx = canvas.getContext("2d");
        const grd = ctx.createLinearGradient(0, 0, 0, this.app.screen.height);
        grd.addColorStop(0, Background.TOP_COLOR);
        grd.addColorStop(1, Background.BOTTOM_COLOR);

        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, this.app.screen.width, this.app.screen.height);

        return Texture.from(canvas);
    }

    resize() {
        this.app.renderer.resize(window.innerWidth, window.innerHeight);
        this.updateBgSize();
    }
}
