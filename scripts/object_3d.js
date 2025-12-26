import { mat4 } from './math_utils.js';


class Animator {
    constructor() {
        console.log('Animator created');
    }
    update(obj, deltaTime) {
        console.log('Animator update', deltaTime);
        console.log(obj.type);
    }
}


class Object3d {
    constructor(type = '', options = {}) {
        this.type = type;   //

        this.position = new Float32Array([0, 0, 0]);
        this.rotation = new Float32Array([0, 0, 0]);
        this.scale = new Float32Array([1, 1, 1]);
        this.up = new Float32Array([0, 1, 0]);
        this.quaternion = glMatrix.quat.create();
        this.clip = glMatrix.vec4.create(); // クリップ座標

        this.mvpMtx = glMatrix.mat4.create();
        this.normalMtx = glMatrix.mat4.create();
        this.worldMtx = glMatrix.mat4.create(); // モデル行列ともいう

        this.needsUpdateMatrix = true;

        this.animator = options.animator || null;

        this.isRenderTarget = false;

        this.parent = null;
        this.children = [];
    }

    updateFrame(deltaTime) { }

    updateMatrix(projection, view, proj_view) {
        // クリップ座標計算
        glMatrix.vec4.transformMat4(this.clip, [this.position[0], this.position[1], this.position[2], 1.0], proj_view);

        // ワールド行列計算
        glMatrix.mat4.fromRotationTranslationScale(this.worldMtx, this.quaternion, this.position, this.scale);

        // モデル・ビュー・プロジェクション行列
        glMatrix.mat4.multiply( this.mvpMtx, proj_view, this.worldMtx);

        // 逆行列を計算
        glMatrix.mat4.invert(this.normalMtx, this.worldMtx);

        // 転置行列を計算
        glMatrix.mat4.transpose(this.normalMtx, this.normalMtx);        

    }

    rotateY(angle) {
        const tmp = glMatrix.quat.create();
        glMatrix.quat.setAxisAngle(tmp, [0, 1, 0], angle);
        glMatrix.quat.multiply(this.quaternion, tmp, this.quaternion);
        glMatrix.quat.normalize(this.quaternion, this.quaternion);
    }

    rotateX(angle) {
        const tmp = glMatrix.quat.create();
        glMatrix.quat.setAxisAngle(tmp, [1, 0, 0], angle);
        glMatrix.quat.multiply(this.quaternion, tmp, this.quaternion);
        glMatrix.quat.normalize(this.quaternion, this.quaternion);
    }
    updateFrame(deltaTime) {
        this.animator &&
            this.animator.update(this, deltaTime);
    }

    add(child) {
        child.parent = this;
        this.children.push(child);
    }
}

export { Object3d, Animator };