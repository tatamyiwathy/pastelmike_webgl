import { ShaderName } from './shader_name.js';
import { basicVertexShaderSource, basicFragmentShaderSource } from './glsl/basic_shader.gsls.js';
import { debugDepth_vertexShaderSource, debugDepth_fragmentShaderSource } from './glsl/debug_depth_shader.glsl.js';
import { particleVertexShaderSource, particleFragmentShaderSource } from './glsl/particle_shader.glsl.js';
import { shadowmapVertexShaderSource, shadowmapFragmentShaderSource } from './glsl/shadowmap_shader.glsl.js';
import { simpleVertexShaderSource, simpleFragmentShaderSource } from './glsl/simple_shader.glsl.js';
import { simpleTextureVertexShaderSource, simpleTextureFragmentShaderSource } from './glsl/simple_texture_shader.glsl.js';
import { skyboxVertexShaderSource, skyboxFragmentShaderSource } from './glsl/skybox_shader.glsl.js';

const shaderSources = {
    [ShaderName.BASIC]: {
        vertex: basicVertexShaderSource,
        fragment: basicFragmentShaderSource,
    },
    [ShaderName.DEBUG_DEPTH]: {
        vertex: debugDepth_vertexShaderSource,
        fragment: debugDepth_fragmentShaderSource,
    },
    [ShaderName.PARTICLE]: {
        vertex: particleVertexShaderSource,
        fragment: particleFragmentShaderSource,
    },
    [ShaderName.SHADOWMAP]: {
        vertex: shadowmapVertexShaderSource,
        fragment: shadowmapFragmentShaderSource,
    },
    [ShaderName.SIMPLE]: {
        vertex: simpleVertexShaderSource,
        fragment: simpleFragmentShaderSource,
    },
    [ShaderName.SIMPLETEX]: {
        vertex: simpleTextureVertexShaderSource,
        fragment: simpleTextureFragmentShaderSource,
    },
    [ShaderName.SKYBOX]: {
        vertex: skyboxVertexShaderSource,
        fragment: skyboxFragmentShaderSource,
    },
};

export { shaderSources };