import { mat3 } from 'gl-matrix';
import { mat4, vec3, vec4, quat, glMatrix } from gl - matrix';
import { Object3d } from './object_3d.js';


class DirectionLight extends Object3d {
    constructor(gl, args = {}) {
        super('light');
        // this.position = args.position || [0, 10, 0]; Object3dのpositionを使用
        this._direction = args.direction || [0, -1, 0];
        this.color = args.color || [1, 1, 1]; // 白色光源
        this.lightKind = "directional";
        this.enableShadow = args.enableShadow || false;
        this.shadowBoxSize = args.shadowBoxSize || 10; // シャドウマップに含める範囲の半分の長さ
        this.lightSpaceMatrix = mat4.create();
    }


    get direction() {
        return this._direction;
    }

    // 正規化される
    set direction(v) {
        if (v instanceof Float32Array) {
            this._direction = v;
        } else if (Array.isArray(v)) {
            this._direction = glMatrix.vec3.fromValues(...v);
        } else {
            throw new Error('direction must be Float32Array or array');
        }
        glMatrix.vec3.normalize(this._direction, this._direction);
    }

    updateMatrix(projection, view, proj_view) {
        if (!this.enableShadow) {
            return;
        }
        const target = vec3.add(vec3.create(), this.position, this.direction);
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