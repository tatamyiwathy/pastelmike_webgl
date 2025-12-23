import { Object3d } from "./object_3d.js";
import { MathUtils } from "./math_utils.js";

class Camera extends Object3d {
    constructor(options = {}) {
        super('camera', options);
    }
    lookAt(target) { }
}

class PerspectiveCamera extends Camera {
    constructor(fov, aspect, near, far, options = {}) {
        super(options);
        this.fov = fov;
        this.aspect = aspect;
        this.near = near;
        this.far = far;

        this.projMtx = MathUtils.perspectiveMatrix(fov, aspect, near, far);
        this.lookAt([0, 0, 0]);
    }

    lookAt(target) {
        this.mdlViewMtx = MathUtils.lookAt(this.position, target, this.up);
    }
}

export { Camera, PerspectiveCamera };