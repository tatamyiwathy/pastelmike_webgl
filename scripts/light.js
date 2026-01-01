import { Object3d } from './object_3d.js';


class DirectionLight extends Object3d {
    constructor(gl, args = {}) {
        super('light');
        this._direction = args.direction || [0, -1, 0];
        this.color = [1, 1, 1]; // 白色光源
        this.lightKind = "directional";
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