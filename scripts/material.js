import { ShaderName } from "./shader.js";

class Material {
    static BlendMode = {
        NONE: 0,
        ALPHA: 1,
        ADD: 2,
        MULTIPLY: 3
    }

    constructor(materialContext = {}) {
        this.shaderName = materialContext.shaderName || ''
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.isWireframe = materialContext.isWireframe || false;
        this.textures = materialContext.textures || null;
        this.useTexture = materialContext.useTexture || false;
        this.specular = materialContext.specular || false;
        this.blendMode = materialContext.blendMode || Material.BlendMode.NONE; //アルファブレンド 加算 乗算
    }

    dispose(gl) {
        if (this.textures) {
            gl.deleteTexture(this.textures);
        }
    }
}

class MeshSimpleMaterial extends Material {
    constructor(gl, params = {}) {
        super(params);
        this.shaderName = ShaderName.SIMPLE;
    }
}

class MeshSpecularMaterial extends Material {
    constructor(gl, materialContext) {
        super(materialContext);
        this.shaderName = ShaderName.BASIC;
    }
}


class CubeMapMaterial extends Material {
    constructor(gl, materialContext) {
        super({shaderName: ShaderName.SKYBOX});
        this.textures = materialContext.textures;
    }
}

class ParticleMaterial extends Material {
    constructor(gl, options = {}) {
        super();
        this.shaderName = ShaderName.PARTICLE;
        this.particleSize = options.particleSize || 50.0;
        this.alphaScale = options.alphaScale || 1.0;
        this.color = options.color || [1.0, 1.0, 1.0, 1.0];
    }

}

export { CubeMapMaterial, ParticleMaterial, MeshSpecularMaterial, MeshSimpleMaterial, Material };