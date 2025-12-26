import { Mesh } from '../scripts/mesh.js';
import { create_plain_geometry } from './geometry.js';
import { Material } from './material.js';
import { ShaderName } from './shader.js';

class SpriteMaterial extends Material {
    constructor(texture) {
        super({shaderName: ShaderName.SIMPLETEX, blendMode: Material.BlendMode.ALPHA, useTexture: true, textures: texture});
    }
}

class Sprite extends Mesh {
    constructor(gl, texture, options = {}) {
        super('sprite', create_plain_geometry(gl,1), new SpriteMaterial(texture));
    }

    updateMatrix(projMtx, viewMtx, vpMtx) {
        super.updateMatrix(projMtx, viewMtx, vpMtx);

        // スプライトは常にカメラの方を向くようにする
        // ワールド行列から回転成分を取り除く
        this.worldMtx[0] = 1.0; this.worldMtx[1] = 0.0; this.worldMtx[2] = 0.0;
        this.worldMtx[4] = 0.0; this.worldMtx[5] = 1.0; this.worldMtx[6] = 0.0;
        this.worldMtx[8] = 0.0; this.worldMtx[9] = 0.0; this.worldMtx[10] = 1.0;
    }
}


export { SpriteMaterial, Sprite };