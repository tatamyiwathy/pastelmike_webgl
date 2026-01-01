import { Object3d } from "./object_3d.js";
import { MathUtils } from "./math_utils.js";

class Camera extends Object3d {
    constructor(options = {}) {
        super('camera', options);
        this.up = options.up || [0, 1, 0];
        this.position = options.position || [0, 0, 0];
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
        this.mdlViewMtx = glMatrix.mat4.create();
        this.projMtx = MathUtils.perspectiveMatrix(fov, aspect, near, far);
        this.lookAt([0, 0, 0]);
    }

    lookAt(target) {
        const p = glMatrix.vec3.create();
        p[0] = this.position[0];
        p[1] = this.position[1];
        p[2] = this.position[2];
        const t = glMatrix.vec3.create();
        t[0] = target[0];
        t[1] = target[1];
        t[2] = target[2];
        const u = glMatrix.vec3.create();
        u[0] = this.up[0];
        u[1] = this.up[1];
        u[2] = this.up[2];
        glMatrix.mat4.lookAt(this.mdlViewMtx, this.position, target, this.up);
    }

    look(forward) {
        const lookat = this.position.map((v, i) => v + forward[i]);
        this.lookAt(lookat);
    }
}

export { Camera, PerspectiveCamera };