import { mat4, vec3} from 'gl-matrix';
import { Object3d } from './object_3d.js';
import { createShadowFramebuffer } from './offscreen.js';


class DirectionLight extends Object3d {
    constructor(gl, args = {}) {
        super('light');
        // 位置を設定（指定がなければ上空のデフォルト位置）
        this.position = args.position || [0, 10, 0];
        this.targetPosition = args.targetPosition || [0, 0, 0];
        this.color = args.color || [1, 1, 1]; // 白色光源
        this.lightKind = "directional";
        this.enableShadow = args.enableShadow || false;
        this._direction = vec3.create();
        vec3.sub(this._direction, this.targetPosition, this.position);
        vec3.normalize(this._direction, this._direction);
        // Y軸ベクトルとdirectionベクトルが平行かどうか
        const d = vec3.dot(this._direction, [0, 1, 0]);
        if (Math.abs(d) > 0.999) {
            // 平行ならばZ軸を上向きベクトルにする
            this.up = vec3.fromValues(0, 0, 1);
        } else {
            this.up = vec3.fromValues(0, 1, 0);
        }

        // シャドウマップ用のパラメータ
        if (this.enableShadow) {
            this.near = args.near || 1.0;
            this.far = args.far || 50.0;

            this.shadowBoxSize = args.shadowBoxSize || 10; // シャドウマップに含める範囲の半分の長さ
            this.lightSpaceMatrix = mat4.create();

            const {framebuffer, texture} = createShadowFramebuffer(gl, 1024);
            this.frameBuffer = framebuffer;
            this.texture = texture;
            this.frameBufferSize = 1024;
        }
    }
    
    get targetPosition() {
        return this._targetPosition;
    }

    set targetPosition(v) {
        if (v instanceof Float32Array) {
            this._targetPosition = v;
        } else if (Array.isArray(v)) {
            this._targetPosition = vec3.fromValues(...v);
        } else {
            throw new Error('targetPosition must be Float32Array or array');
        }
    }

    // directionはpositionとtargetPositionから自動計算されるため、setterは用意しない
    get direction() {
        return this._direction;
    }

    updateMatrix(projection, view, proj_view) {
        // directionを更新
        vec3.sub(this._direction, this.targetPosition, this.position);
        vec3.normalize(this._direction, this._direction);

        if (!this.enableShadow) {
            return;
        }
        // ライト位置 + 方向ベクトルを注視点とする
        const target = vec3.create();
        vec3.add(target, this.position, this.direction);
        const lightViewMatrix = mat4.lookAt(mat4.create(), this.position, target, this.up);
        const size = this.shadowBoxSize; // ライトがカバーする範囲（半径）
        const lightProjectionMatrix = mat4.ortho(mat4.create(), -size, size, -size, size, this.near, this.far);
        // lightSpaceMatrix = P * V
        mat4.multiply(this.lightSpaceMatrix, lightProjectionMatrix, lightViewMatrix);
    }
}



class PointLight extends Object3d {
    constructor(gl, args = {}) {
        super('light', args);
        this.lightKind = "point";
        this.color = args.color || [1, 1, 1]; // 白色光源
        this.constant = args.constant || 1.0; // 減衰係数（定数項）
        this.linear = args.linear || 0.001; // 減衰係数（一次項）
        this.quadratic = args.quadratic || 0; // 減衰係数（二次項）
    }
}
export { DirectionLight, PointLight };