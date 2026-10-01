import { Texture, Sprite, Container, Assets } from "pixi.js";

export class Clouds {
    constructor(app) {
        this.app = app;
        this.cloudTextures = [
            Assets.get("cloud1"),
            Assets.get("cloud2"),
            Assets.get("cloud3"),
            Assets.get("cloud4"),
        ];

        this.totalClouds = 5;
        this.visibleClouds = 4;
        this.cloudSpeed = 0.5;
        this.cloudPaddingY = 40;

        this.container = new Container();
        this.scale = window.innerWidth < 598 ? 0.5 : 1;

        const maxWidth = Math.max(app.screen.width, 1400);
        this.rowSize = Math.min(Math.max((app.screen.height - 200) / 4, 0), 500);
        this.rows = 4;
        this.spacing = maxWidth / this.visibleClouds;
        this.clouds = [];
        this.rightMostX = 0;

        this.init();
    }

    init() {
        this.layout();
        this.moveClouds();
    }

    getRandomRow(excludeRows = []) {
        if (excludeRows.length === 0) {
            return Math.floor(Math.random() * this.rows);
        }

        const availableRows = [];
        for (let i = 0; i < this.rows; i++) {
            if (!excludeRows.includes(i)) {
                availableRows.push(i);
            }
        }

        return availableRows.length > 0
            ? availableRows[Math.floor(Math.random() * availableRows.length)]
            : Math.floor(Math.random() * this.rows);
    }

    getRandomTexture() {
        return this.cloudTextures[Math.floor(Math.random() * this.cloudTextures.length)];
    }

    createCloud(x, excludeRows = []) {
        const sprite = new Sprite(this.getRandomTexture());
        const row = this.getRandomRow(excludeRows);

        sprite.scale.set(this.scale);
        sprite.row = row;
        sprite.x = x;
        sprite.y = this.cloudPaddingY + row * this.rowSize;

        return sprite;
    }

    layout() {
        for (let i = 0; i < this.totalClouds; i++) {
            const nearbyRows = this.clouds.slice(-2).map((c) => c.row);
            const cloud = this.createCloud(i * this.spacing, nearbyRows);

            this.container.addChild(cloud);
            this.clouds.push(cloud);
        }
        this.container.y = Math.min(-this.container.getBounds().height, -this.app.screen.height);
    }

    updateRightMostX() {
        this.rightMostX = Math.max(...this.clouds.map((c) => c.x));
    }

    repositionCloud(cloud) {
        cloud.texture = this.getRandomTexture();
        cloud.x = this.rightMostX + this.spacing;

        const cloudsOnRight = this.clouds.filter(
            (c) => c.x > this.app.screen.width / 2 && c !== cloud
        );
        const excludeRows = cloudsOnRight.map((c) => c.row);

        cloud.row = this.getRandomRow(excludeRows);
        cloud.y = this.cloudPaddingY + cloud.row * this.rowSize;

        this.rightMostX = cloud.x;
    }

    moveClouds() {
        this.app.ticker.add(() => {
            this.updateRightMostX();

            for (const cloud of this.clouds) {
                cloud.x -= this.cloudSpeed;

                if (cloud.x + cloud.width < 0) {
                    this.repositionCloud(cloud);
                }
            }
        });
    }
}
