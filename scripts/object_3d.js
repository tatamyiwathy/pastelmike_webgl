import { mat4, vec4, quat } from 'gl-matrix';


class Animator {
    constructor() {
        console.log('Animator created');
    }
    update(obj, deltaTime) {
    }
}


class Object3d {
    constructor(type = '', options = {}) {
        this.enabled = true;    // 機能が有効かどうか（ライトが点灯）
        this.type = type;   //

        this._position = new Float32Array([0, 0, 0]);
        this._rotation = new Float32Array([0, 0, 0]);
        this._scale = new Float32Array([1, 1, 1]);
        this._up = new Float32Array([0, 1, 0]);
        this._clip = vec4.create(); // クリップ座標

        this.quaternion = quat.create();

        this.mvpMtx = mat4.create();
        this.normalMtx = mat4.create();
        this.worldMtx = mat4.create(); // モデル行列ともいう

        this.needsUpdateMatrix = true;

        this.animator = options.animator || null;

        this.isRenderTarget = false;

        this.parent = null;
        this.children = [];

        this.tagName = options.tagName || '';
    }

    get position(){
        return this._position;
    }

    set position(v){
        if (v instanceof Float32Array) {
            this._position = v;
        } else if (Array.isArray(v)) {
            this._position = new Float32Array(v);
        } else {
            throw new Error('position must be Float32Array or array');
        }
        this.needsUpdateMatrix = true;
    }
    
    get rotation(){
        return this._rotation;
    }

    set rotation(v){
        if (v instanceof Float32Array) {
            this._rotation = v;
        } else if (Array.isArray(v)) {
            this._rotation = new Float32Array(v);
        } else {
            throw new Error('rotation must be Float32Array or array');
        }
        this.needsUpdateMatrix = true;
    }

    get scale(){
        return this._scale;
    }

    set scale(v){
        if (v instanceof Float32Array) {
            this._scale = v;
        } else if (Array.isArray(v)) {
            this._scale = new Float32Array(v);
        } else {
            throw new Error('scale must be Float32Array or array');
        }
        this.needsUpdateMatrix = true;
    }

    get up(){
        return this._up;
    }

    set up(v){
        if (v instanceof Float32Array) {
            this._up = v;
        } else if (Array.isArray(v)) {
            this._up = new Float32Array(v);
        } else {
            throw new Error('up must be Float32Array or array');
        }
        this.needsUpdateMatrix = true;
    }       

    get clip(){
        return this._clip;
    }

    set clip(v){
        if (v instanceof Float32Array) {
            this._clip = v;
        }
        else if (Array.isArray(v)) {
            this._clip = new Float32Array(v);
        }
        else {
            throw new Error('clip must be Float32Array or array');
        }
    }


    updateFrame(deltaTime) { }

    updateMatrix(projection, view, proj_view) {
        // クリップ座標計算
        vec4.transformMat4(this.clip, [this.position[0], this.position[1], this.position[2], 1.0], proj_view);

        // ワールド行列計算
        mat4.fromRotationTranslationScale(this.worldMtx, this.quaternion, this.position, this.scale);

        // モデル・ビュー・プロジェクション行列
        mat4.multiply( this.mvpMtx, proj_view, this.worldMtx);

        // 逆行列を計算
        mat4.invert(this.normalMtx, this.worldMtx);

        // 転置行列を計算
        mat4.transpose(this.normalMtx, this.normalMtx);        

    }

    rotateY(angle) {
        const tmp = quat.create();
        quat.setAxisAngle(tmp, [0, 1, 0], angle);
        quat.multiply(this.quaternion, tmp, this.quaternion);
        quat.normalize(this.quaternion, this.quaternion);
    }

    rotateX(angle) {
        const tmp = quat.create();
        quat.setAxisAngle(tmp, [1, 0, 0], angle);
        quat.multiply(this.quaternion, tmp, this.quaternion);
        quat.normalize(this.quaternion, this.quaternion);
    }
    updateFrame(deltaTime) {
        this.animator &&
            this.animator.update(this, deltaTime);
    }

    add(child) {
        child.parent = this;
        this.children.push(child);
    }

    lookAt(target) {
        const t = vec3.create();
        t[0] = target[0];
        t[1] = target[1];
        t[2] = target[2];
        mat4.lookAt(this.worldMtx, this.position, t, this.up);
    }
}

export { Object3d, Animator };