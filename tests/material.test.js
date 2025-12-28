import { describe, test, expect } from 'vitest';
import { Material, MeshSimpleMaterial, MeshSpecularMaterial, ParticleMaterial } from '../scripts/material.js';
import { ShaderName } from '../scripts/shader.js';

describe('Material', () => {
    test('Materialの初期値', () => {
        const m = new Material();
        expect(m.shaderName).toBe('');
        expect(m.color).toEqual([1.0, 1.0, 1.0, 1.0]);
        expect(m.isWireframe).toBe(false);
        expect(m.textures).toBe(null);
        expect(m.useTexture).toBe(false);
        expect(m.specular).toBe(false);
        expect(m.blendMode).toBe(Material.BlendMode.NONE);
    });

    test('Materialのプロパティ設定', () => {
        const m = new Material({
            shaderName: 'test',
            isWireframe: true,
            textures: 'tex',
            useTexture: true,
            specular: true,
            blendMode: Material.BlendMode.ADD
        });
        expect(m.shaderName).toBe('test');
        expect(m.isWireframe).toBe(true);
        expect(m.textures).toBe('tex');
        expect(m.useTexture).toBe(true);
        expect(m.specular).toBe(true);
        expect(m.blendMode).toBe(Material.BlendMode.ADD);
    });
});

describe('MeshSimpleMaterial', () => {
    test('MeshSimpleMaterialの初期化', () => {
        const gl = {};
        const mat = new MeshSimpleMaterial(gl);
        expect(mat.shaderName).toBe(ShaderName.SIMPLE);
    });
});

describe('MeshSpecularMaterial', () => {
    test('MeshSpecularMaterialの初期化', () => {
        const gl = {};
        const mat = new MeshSpecularMaterial(gl, {});
        expect(mat.shaderName).toBe(ShaderName.BASIC);
    });
});

describe('ParticleMaterial', () => {
    test('ParticleMaterialの初期化', () => {
        const gl = {};
        const mat = new ParticleMaterial(gl, { particleSize: 10, alphaScale: 0.5, color: [0.1,0.2,0.3,0.4] });
        expect(mat.shaderName).toBe(ShaderName.PARTICLE);
        expect(mat.particleSize).toBe(10);
        expect(mat.alphaScale).toBe(0.5);
        expect(mat.color).toEqual([0.1,0.2,0.3,0.4]);
    });
});
