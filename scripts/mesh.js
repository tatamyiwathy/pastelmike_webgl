import { Object3d } from './object_3d.js';

class Mesh extends Object3d {
    constructor(gl, geometry, material) {
        super('mesh');

        this.geometry = geometry;
        this.material = material;
        this.isRenderTarget = true;
    }
}

export { Mesh };