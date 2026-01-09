import { Mesh } from './mesh.js';
import { create_plain_geometry } from './geometry.js';
import { Material } from './material.js';
import { ShaderName } from './shader.js';
import { mat4 } from 'gl-matrix';

class SpriteMaterial extends Material {
    constructor(texture) {
        super({ shaderName: ShaderName.SIMPLETEX, blendMode: Material.BlendMode.ALPHA, useTexture: true, textures: texture });
    }
}

class Sprite extends Mesh {
    constructor(gl, texture, options = {}) {
        super(gl, create_plain_geometry(gl, 1), new SpriteMaterial(texture));
    }
    updateMatrix(cameraMatrix, vpMtx) {
        // 1. まず位置とスケールでワールド行列を作る
        // ※ this.quaternion は無視するか、identityにする（ビルボードなので）
        mat4.fromTranslation(this.worldMtx, this.position);
        mat4.scale(this.worldMtx, this.worldMtx, this.scale);

        // 2. ビュー行列の転置（カメラのローカル軸）をワールド行列に代入
        // gl-matrix のインデックス: 
        // 0,1,2 = Right軸,  4,5,6 = Up軸,  8,9,10 = Forward軸

        // Right
        this.worldMtx[0] = cameraMatrix.view[0];
        this.worldMtx[1] = cameraMatrix.view[4];
        this.worldMtx[2] = cameraMatrix.view[8];

        // Up
        this.worldMtx[4] = cameraMatrix.view[1];
        this.worldMtx[5] = cameraMatrix.view[5];
        this.worldMtx[6] = cameraMatrix.view[9];

        // Forward
        this.worldMtx[8] = cameraMatrix.view[2];
        this.worldMtx[9] = cameraMatrix.view[6];
        this.worldMtx[10] = cameraMatrix.view[10];

        // 3. スケールを再適用
        // 回転を上書きした際にスケールが1.0に戻ってしまうため、再度掛ける
        this.worldMtx[0] *= this.scale[0];
        this.worldMtx[1] *= this.scale[0];
        this.worldMtx[2] *= this.scale[0];

        this.worldMtx[4] *= this.scale[1];
        this.worldMtx[5] *= this.scale[1];
        this.worldMtx[6] *= this.scale[1];

        this.worldMtx[8] *= this.scale[2];
        this.worldMtx[9] *= this.scale[2];
        this.worldMtx[10] *= this.scale[2];

        mat4.rotateX(this.worldMtx, this.worldMtx, Math.PI / 2);
        mat4.multiply(this.mvpMtx, vpMtx, this.worldMtx);
    }
}


export { SpriteMaterial, Sprite };