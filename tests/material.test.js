import { Material } from '../scripts/material.js';
import { MeshSimpleMaterial } from '../scripts/material.js';
import { MeshSpecularMaterial } from '../scripts/material.js';
import { ParticleMaterial } from '../scripts/material.js';
import { ShaderName } from '../scripts/shader.js';

QUnit.module('Material', function() {
    QUnit.test('Materialの初期値', function(assert) {
        const m = new Material();
        assert.strictEqual(m.shaderName, '', 'デフォルトのshaderNameは空文字');
        assert.deepEqual(m.color, [1.0, 1.0, 1.0, 1.0], 'デフォルトのcolor');
        assert.strictEqual(m.isWireframe, false, 'デフォルトのisWireframeはfalse');
        assert.strictEqual(m.textures, null, 'デフォルトのtexturesはnull');
        assert.strictEqual(m.useTexture, false, 'デフォルトのuseTextureはfalse');
        assert.strictEqual(m.specular, false, 'デフォルトのspecularはfalse');
        assert.strictEqual(m.blendMode, Material.BlendMode.NONE, 'デフォルトのblendMode');
    });

    QUnit.test('Materialのプロパティ設定', function(assert) {
        const m = new Material({
            shaderName: 'test',
            isWireframe: true,
            textures: 'tex',
            useTexture: true,
            specular: true,
            blendMode: Material.BlendMode.ADD
        });
        assert.strictEqual(m.shaderName, 'test');
        assert.strictEqual(m.isWireframe, true);
        assert.strictEqual(m.textures, 'tex');
        assert.strictEqual(m.useTexture, true);
        assert.strictEqual(m.specular, true);
        assert.strictEqual(m.blendMode, Material.BlendMode.ADD);
    });
});

QUnit.module('MeshSimpleMaterial', function() {
    QUnit.test('MeshSimpleMaterialの初期化', function(assert) {
        const gl = {};
        const mat = new MeshSimpleMaterial(gl);
        assert.strictEqual(mat.shaderName, ShaderName.SIMPLE);
    });
});

QUnit.module('MeshSpecularMaterial', function() {
    QUnit.test('MeshSpecularMaterialの初期化', function(assert) {
        const gl = {};
        const mat = new MeshSpecularMaterial(gl, {});
        assert.strictEqual(mat.shaderName, ShaderName.BASIC);
    });
});

QUnit.module('ParticleMaterial', function() {
    QUnit.test('ParticleMaterialの初期化', function(assert) {
        const gl = {};
        const mat = new ParticleMaterial(gl, { particleSize: 10, alphaScale: 0.5, color: [0.1,0.2,0.3,0.4] });
        assert.strictEqual(mat.shaderName, ShaderName.PARTICLE);
        assert.strictEqual(mat.particleSize, 10);
        assert.strictEqual(mat.alphaScale, 0.5);
        assert.deepEqual(mat.color, [0.1,0.2,0.3,0.4]);
    });
});
