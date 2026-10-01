import { Container, Graphics, Text } from "pixi.js";
import { GAME_PHASES } from "./main";

export class AnimatedCurve {
    static RIGHT_OFFSET = window.innerWidth < 598 ? 130 : 300;
    static START_X = window.innerWidth < 598 ? 50 : 100;
    
    constructor(game) {
        this.game = game;
        this.app = game.app;
        this.container = new Container();
        this.graphics = new Graphics();
        this.container.addChild(this.graphics);

        // Curve params
        this.curve = {
            frequency: 0.002,
            targetHeight: this.app.screen.height * 0.5,
            heightVariation: 0.2,
        };

        // Anim state
        this.time = 0;
        this.growthProgress = 0;
        this.mainCurveProgress = 0;
        this.isGrowing = false;
        this.elapsedTime = 0;

        // State completion/drop
        this.isDroppingDown = false;
        this.dropProgress = 0;
        this.dropPercentage = 0.5;
        this.dropElapsed = 0;
        this.dropDuration = 1.0;

        // Extending state
        this.isExtendingToFullWidth = false;
        this.extendStartProgress = 0;
        this.extendElapsed = 0;
        this.extendDuration = 0.3;

        // Visual elements
        this.showPotentialCurve = false;
        this.frozenPotentialProgress = null;
        this.mainCurvePoints = [];
        this.topPoint = { x: 0, y: 0 };

        // Multipliers
        this.currentMult = 0;
        this.currentMaxMult = 0;

        // Timers
        this.slowDuration = 2;
        this.fastDuration = 1;
        this.totalDuration = this.slowDuration + this.fastDuration;

        // Text els
        this.multText = this.createText();
        this.maxMultText = this.createText();
        this.container.addChild(this.multText, this.maxMultText);

        this.colorSchemes = {
            normal: {
                mainFill: 0xffffff,
                mainFillAlpha: 0.5,
                mainStroke: 0xffffff,
                potentialFill: 0x4c48fa, 
                potentialFillAlpha: 0.9,
                potentialStroke: 0x00f1fe,
            },
            danger: {
                mainFill: 0xffffff,
                mainFillAlpha: 0.5,
                mainStroke: 0xffffff,
                potentialFill: 0xff2a2a,
                potentialFillAlpha: 0.8,
                potentialStroke: 0xffffff,
            },
        };
        this.activeColors = this.colorSchemes.normal;
    }

    setPotentialCurveDanger(isDanger) {
        this.activeColors = isDanger ? this.colorSchemes.danger : this.colorSchemes.normal;
    }

    createText() {
        const text = new Text({
            text: "",
            style: {
                fontFamily: "Arial",
                fontSize: 24,
                fill: 0x4c48fa,
                fontWeight: "bold",
                stroke: { color: 0xffffff, width: 2 },
            },
        });
        text.visible = false;
        return text;
    }

    changePhase(phase) {
        if (phase === GAME_PHASES.PREPARING) {
            this.reset();
            this.isGrowing = true;
        }
    }

    startCompletion(mult, maxMult) {
        this.currentMult = Number(mult);
        this.currentMaxMult = Number(maxMult);
        this.dropPercentage = Math.min(0.75, 1 - this.currentMult / this.currentMaxMult);
        this.isGrowing = false;

        this.multText.text = `x${this.currentMult.toFixed(2)}`;
        this.maxMultText.text = `x${this.currentMaxMult.toFixed(2)}`;

        this.showPotentialCurve = true;

        if (this.growthProgress < 1) {
            this.isExtendingToFullWidth = true;
            this.extendStartProgress = this.growthProgress;
            this.extendElapsed = 0;
            this.frozenPotentialProgress = this.growthProgress;
        } else {
            this.mainCurveProgress = 1;
            this.isDroppingDown = true;
            this.dropElapsed = 0;
        }
    }

    animate() {
        const dt = this.app.ticker.deltaMS / 1000;

        if (this.isExtendingToFullWidth) {
            this.animateExtension(dt);
        } else if (this.isGrowing) {
            this.animateGrowth(dt);
        }

        if (this.isDroppingDown) {
            this.animateDrop(dt);
        }

        this.time += 0.05 * (this.app.ticker.deltaTime || 1);
        this.drawCurve();
    }

    animateExtension(dt) {
        this.extendElapsed += dt;
        const t = Math.min(this.extendElapsed / this.extendDuration, 1);

        this.mainCurveProgress =
            this.extendStartProgress + (1 - this.extendStartProgress) * this.easeOutCubic(t);

        if (t >= 1) {
            this.isExtendingToFullWidth = false;
            this.mainCurveProgress = 1;
            this.onCompletionFinished?.();
        }
    }

    animateGrowth(dt) {
        this.elapsedTime += dt;
        const t = Math.min(this.elapsedTime / this.totalDuration, 1);
        this.growthProgress = this.getGrowthProgress(t);
        this.mainCurveProgress = this.growthProgress;

        if (t >= 1) {
            this.isGrowing = false;
        }
    }

    animateDrop(dt) {
        this.dropElapsed += dt;
        const t = Math.min(this.dropElapsed / this.dropDuration, 1);
        this.dropProgress = this.easeInOutQuad(t);

        if (t >= 1) {
            this.isDroppingDown = false;
            this.growthProgress *= 1 - this.dropPercentage;
            this.onCompletionFinished?.();
        }
    }

    drawCurve() {
        this.graphics.clear();

        const width = Math.min(
            this.app.screen.width * 0.7,
            this.app.screen.width - AnimatedCurve.RIGHT_OFFSET
        );
        const startX = AnimatedCurve.START_X;
        const baseY = 0;

        const heightMult =
            1 + Math.sin(this.time * this.curve.frequency * 100) * this.curve.heightVariation;
        const maxExpValue = Math.exp((width + 1) / 500) - Math.exp(1 / 500);

        this.drawMainCurve(startX, baseY, width, heightMult, maxExpValue);

        if (this.showPotentialCurve) {
            this.drawPotentialCurve(startX, baseY);
        } else {
            this.drawGrowingCurve(startX, baseY, width, heightMult, maxExpValue);
        }

        this.updateTextPositions();
    }

    drawMainCurve(startX, baseY, width, heightMult, maxExpValue) {
        const mainWidth = width * this.mainCurveProgress;
        const mainHeight = this.curve.targetHeight * heightMult * this.mainCurveProgress;

        this.mainCurvePoints = this.calculateCurvePoints(
            startX,
            baseY,
            mainWidth,
            mainHeight,
            maxExpValue
        );

        if (this.mainCurvePoints.length === 0) {
            this.topPoint = { x: startX, y: baseY };
            return;
        }

        const lastPoint = this.mainCurvePoints[this.mainCurvePoints.length - 1];
        this.topPoint = { x: lastPoint.x, y: lastPoint.y };

        this.fillCurveArea(
            this.mainCurvePoints,
            startX,
            baseY,
            this.activeColors.mainFill,
            this.activeColors.mainFillAlpha
        );

        this.strokeCurve(this.mainCurvePoints, this.activeColors.mainStroke, 4);
    }

    drawPotentialCurve(startX, baseY) {
        if (this.mainCurvePoints.length === 0) return;

        const effectiveProgress = this.getEffectiveProgress();
        const targetIndex = Math.floor(this.mainCurvePoints.length * effectiveProgress);
        const points = this.mainCurvePoints.slice(0, targetIndex + 1);

        if (points.length === 0) return;

        const lastPoint = points[points.length - 1];

        this.fillCurveArea(
            points,
            startX,
            baseY,
            this.activeColors.potentialFill,
            this.activeColors.potentialFillAlpha
        );

        this.strokeCurve(points, this.activeColors.potentialStroke, 4);

        if (this.isDroppingDown || effectiveProgress < 1) {
            this.drawDashedLine(lastPoint.x, lastPoint.y, baseY);
        }
    }

    drawGrowingCurve(startX, baseY, width, heightMult, maxExpValue) {
        const currentWidth = width * this.growthProgress;
        const currentHeight = this.curve.targetHeight * heightMult * this.growthProgress;

        const points = this.calculateCurvePoints(
            startX,
            baseY,
            currentWidth,
            currentHeight,
            maxExpValue
        );

        if (points.length === 0) return;

        const lastPoint = points[points.length - 1];
        this.topPoint = { x: lastPoint.x, y: lastPoint.y };

        this.fillCurveArea(
            points,
            startX,
            baseY,
            this.activeColors.potentialFill,
            this.activeColors.potentialFillAlpha
        );

        this.strokeCurve(points, this.activeColors.potentialStroke, 4);
    }

    getEffectiveProgress() {
        if (this.frozenPotentialProgress !== null) {
            return this.frozenPotentialProgress;
        }
        if (this.isDroppingDown) {
            return this.growthProgress * (1 - this.dropPercentage * this.dropProgress);
        }
        return this.growthProgress;
    }

    calculateCurvePoints(startX, baseY, width, targetHeight, maxExpValue) {
        const points = [];
        const expBase = Math.exp(1 / 500);
        
        for (let x = 0; x <= width; x++) {
            const expValue = Math.exp((x + 1) / 500) - expBase;
            const normalizedValue = (expValue / maxExpValue) * targetHeight;
            const y = baseY - normalizedValue;
            points.push({ x: startX + x, y });
        }
        return points;
    }

    fillCurveArea(points, startX, baseY, color, alpha) {
        const lastPoint = points[points.length - 1];
        this.graphics.moveTo(startX, baseY);
        
        for (let i = 0; i < points.length; i++) {
            this.graphics.lineTo(points[i].x, points[i].y);
        }
        
        this.graphics.lineTo(lastPoint.x, baseY);
        this.graphics.lineTo(startX, baseY);
        this.graphics.closePath();
        this.graphics.fill({ color, alpha });
    }

    strokeCurve(points, color, width) {
        if (points.length === 0) return;
        
        this.graphics.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            this.graphics.lineTo(points[i].x, points[i].y);
        }
        
        this.graphics.stroke({ color, width });
    }

    drawDashedLine(x, startY, endY) {
        const dashLength = 8;
        const gapLength = 6;
        const totalLength = dashLength + gapLength;
        const dashCount = Math.ceil((endY - startY) / totalLength);

        for (let i = 0; i < dashCount; i++) {
            const currentY = startY + i * totalLength;
            const dashEnd = Math.min(currentY + dashLength, endY);
            
            if (currentY >= endY) break;
            
            this.graphics.moveTo(x, currentY);
            this.graphics.lineTo(x, dashEnd);
            this.graphics.stroke({ color: 0xffffff, width: 3 });
        }
    }

    updateTextPositions() {
        if (!this.showPotentialCurve || this.mainCurvePoints.length === 0) {
            this.maxMultText.visible = false;
            this.multText.visible = false;
            return;
        }

        const lastMain = this.mainCurvePoints[this.mainCurvePoints.length - 1];
        this.maxMultText.x = lastMain.x - this.maxMultText.width / 2;
        this.maxMultText.y = lastMain.y - 40;
        this.maxMultText.visible = true;

        const effectiveProgress = this.getEffectiveProgress();
        const targetIndex = Math.floor(this.mainCurvePoints.length * effectiveProgress);
        
        if (targetIndex >= 0 && targetIndex < this.mainCurvePoints.length) {
            const point = this.mainCurvePoints[targetIndex];
            this.multText.x = point.x - this.multText.width / 2;
            this.multText.y = point.y - 40;
            this.multText.visible = true;
        }
    }

    getGrowthProgress(t) {
        const slowPart = this.slowDuration / this.totalDuration;
        if (t < slowPart) {
            return 0.3 * (t / slowPart);
        }
        return 0.3 + 0.7 * ((t - slowPart) / (1 - slowPart));
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    reset() {
        this.time = 0;
        this.growthProgress = 0;
        this.mainCurveProgress = 0;
        this.elapsedTime = 0;
        this.isGrowing = false;
        this.isDroppingDown = false;
        this.dropProgress = 0;
        this.isExtendingToFullWidth = false;
        this.showPotentialCurve = false;
        this.frozenPotentialProgress = null;
        this.mainCurvePoints = [];
        this.multText.visible = false;
        this.maxMultText.visible = false;
        this.graphics.clear();
    }

    resize(newWidth, newHeight) {
        this.curve.targetHeight = newHeight * 0.5;
        this.drawCurve();
    }

    getTopPoint() {
        return this.topPoint;
    }

    destroy() {
        this.graphics.destroy();
        this.multText.destroy();
        this.maxMultText.destroy();
        this.container.destroy();
    }
}