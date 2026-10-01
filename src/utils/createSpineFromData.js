import { Assets } from "pixi.js";
import {
    TextureAtlas,
    AtlasAttachmentLoader,
    SkeletonJson,
    Spine,
} from "@esotericsoftware/spine-pixi-v8";
export function createSpineFromData(spineAsset, textureAlias) {
    const pixiTexture = Assets.cache.get(textureAlias);

    if (!pixiTexture) {
        console.error(`Texture ${textureAlias} not found in cache`);
        return null;
    }

    const atlas = new TextureAtlas(spineAsset.atlasData, (path) => {
        return pixiTexture;
    });

    atlas.pages.forEach((page) => {
        page.texture = pixiTexture;
    });

    atlas.regions.forEach((region) => {
        region.texture = { texture: pixiTexture };
        if (region.page) {
            region.page.texture = pixiTexture;
        }
    });

    const atlasLoader = new AtlasAttachmentLoader(atlas);
    const skeletonJson = new SkeletonJson(atlasLoader);
    const skeletonData = skeletonJson.readSkeletonData(spineAsset.skeleton);

    const spine = new Spine(skeletonData);

    if (spine.attachmentCacheData) {
        spine.attachmentCacheData.forEach((cache, index) => {
            if (cache && cache.region && cache.region.page) {
                cache.region.page.texture = pixiTexture;
            }
        });
    }

    return spine;
}
