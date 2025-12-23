import { Object3d } from './object_3d.js';
import { vec3 } from './math_utils.js';


class Light extends Object3d {
    constructor(gl, x, y, z) {
        super('light');
        this.direction = [x,y,z]
        this.color = [1,1,1]; // 白色光源
    }
    
    direction = [0, 1, 0];

    render(gl) {}
}

export { Light };