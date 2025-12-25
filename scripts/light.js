import { Object3d } from './object_3d.js';
import { vec3 } from './math_utils.js';


class Light extends Object3d {
    constructor(gl, x, y, z) {
        super('light');
        this.direction = [x,y,z]
        this.color = [1,1,1]; // 白色光源
        this.lightKind = "directional";
    }
    
    direction = [0, 1, 0];

}



class PointLight extends Object3d{
    constructor(gl, args={}) {
        super('light', args);
        this.lightKind = "point";
        this.color = args.color || [1,1,1]; // 白色光源
        this.constant = args.constant || 1.0; // 減衰係数（定数項）
        this.linear = args.linear || 0.001; // 減衰係数（一次項）
        this.quadratic = args.quadratic || 0; // 減衰係数（二次項）
    }
}
export { Light, PointLight };