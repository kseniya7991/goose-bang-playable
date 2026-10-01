// Статика (картинки)
import bush1 from "./media/bush1.webp?url";
import bush2 from "./media/bush2.webp?url";
import bush3 from "./media/bush3.webp?url";
import cloud1 from "./media/cloud1.webp?url";
import cloud2 from "./media/cloud2.webp?url";
import cloud3 from "./media/cloud3.webp?url";
import cloud4 from "./media/cloud4.webp?url";
import mountains from "./media/mountains.webp?url";
import water1 from "./media/water1.webp?url";
import water2 from "./media/water2.webp?url";

// Spine assets for Goose - import as raw text and data
import gooseSkeletonData from "./media/goose.json";
import gooseAtlasData from "./media/goose_desktop.atlas?raw";
import gooseTexture from "./media/goose_desktop.webp?url";

// Spine assets for Rifle - import as raw text and data
import rifleSkeletonData from "./media/rifle.json";
import rifleAtlasData from "./media/rifle_desktop.atlas?raw";
import rifleTexture from "./media/rifle_desktop.webp?url";

// AUDIO
import audioJson from "./media/audiosprite_pc.json";
import audioSrc from "./media/audiosprite_pc.ogg?url";

export const STATIC_ASSETS = [
    { alias: "bush1", src: bush1 },
    { alias: "bush2", src: bush2 },
    { alias: "bush3", src: bush3 },
    { alias: "cloud1", src: cloud1 },
    { alias: "cloud2", src: cloud2 },
    { alias: "cloud3", src: cloud3 },
    { alias: "cloud4", src: cloud4 },
    { alias: "mountains", src: mountains },
    { alias: "water1", src: water1 },
    { alias: "water2", src: water2 },
];

export const SPINE_ASSETS = {
    goose: {
        skeleton: gooseSkeletonData,
        atlasData: gooseAtlasData,
        texture: gooseTexture,
    },
    rifle: {
        skeleton: rifleSkeletonData,
        atlasData: rifleAtlasData,
        texture: rifleTexture,
    },
};

export const AUDIO_DATA = {
    json: audioJson,
    src: audioSrc,
};
