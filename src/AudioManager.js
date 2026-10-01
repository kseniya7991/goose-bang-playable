import { Howl, Howler } from "howler";

export class AudioManager {
    constructor(audioData) {
        this.audioData = audioData || null;

        this.sounds = null;
        this.musicId = null;
        this.muted = false;
        this.activeSounds = {};

        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    async init() {
        if (!this.audioData) {
            console.error("No audio data provided!");
            return false;
        }

        return new Promise((resolve) => {
            this.sounds = new Howl({
                src: [this.audioData.src],
                sprite: this.audioData.json.sprite,
                volume: 1,
                preload: true,
                format: ["mp3"],
                onload: () => {
                    this.setupListeners();
                    resolve(true);
                },
                onloaderror: (id, err) => {
                    console.error("Audio Load Error", err);
                    resolve(false);
                },
            });
        });
    }

    setupListeners() {
        document.addEventListener("visibilitychange", this.handleVisibilityChange);

        window.addEventListener("blur", () => this.pauseAllGlobally());
        window.addEventListener("focus", () => this.resumeAllGlobally());
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.pauseAllGlobally();
        } else {
            this.resumeAllGlobally();
        }
    }

    pauseAllGlobally() {
        Howler.mute(true);
    }

    resumeAllGlobally() {
        if (!this.muted) {
            Howler.mute(false);
        }
    }

    playSoundWithId(name, options = {}) {
        if (!this.sounds || (this.muted && !options.ignoreMute)) return null;

        const id = this.sounds.play(name);

        if (options.volume !== undefined) {
            this.sounds.volume(options.volume, id);
        }

        if (options.loop !== undefined) {
            this.sounds.loop(options.loop, id);
        }

        if (options.rate !== undefined) {
            this.sounds.rate(options.rate, id);
        }

        this.activeSounds[name] = id;

        this.sounds.once(
            "end",
            () => {
                if (this.activeSounds[name] === id) {
                    delete this.activeSounds[name];
                }
            },
            id,
        );

        return id;
    }

    stopSoundByName(name) {
        const id = this.activeSounds[name];
        if (id !== undefined) {
            this.sounds.stop(id);
            delete this.activeSounds[name];
        }
    }

    stopAllSounds() {
        if (this.sounds) {
            this.sounds.stop();
        }
        this.activeSounds = {};
    }

    mute(value) {
        this.muted = value;
        Howler.mute(value);
    }

    destroy() {
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
        window.removeEventListener("blur", this.pauseAllGlobally);
        window.removeEventListener("focus", this.resumeAllGlobally);
        this.stopAllSounds();
        if (this.sounds) {
            this.sounds.unload();
        }
    }
}
