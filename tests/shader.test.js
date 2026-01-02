import { ShaderManager, ShaderName } from "../scripts/shader.js";

// WebGLのモックを作成
function createMockGL() {
  return {
    VERTEX_SHADER: 0x8B31,
    FRAGMENT_SHADER: 0x8B30,
    TRIANGLES: 0x0004,
    LINES: 0x0001,
    UNSIGNED_INT: 0x1405,
    ARRAY_BUFFER: 0x8892,
    ELEMENT_ARRAY_BUFFER: 0x8893,
    TEXTURE_2D: 0x0DE1,
    TEXTURE_CUBE_MAP: 0x8513,
    TEXTURE0: 0x84C0,
    BLEND: 0x0BE2,
    DEPTH_TEST: 0x0B71,
    LEQUAL: 0x0203,
    SRC_ALPHA: 0x0302,
    ONE: 1,
    ONE_MINUS_SRC_ALPHA: 0x0303,
    FLOAT: 0x1406,
    createShader: () => ({}),
    shaderSource: () => {},
    compileShader: () => {},
    getShaderParameter: () => true,
    getShaderInfoLog: () => "",
    deleteShader: () => {},
    createProgram: () => ({}),
    attachShader: () => {},
    linkProgram: () => {},
    getProgramParameter: () => true,
    getProgramInfoLog: () => "",
    deleteProgram: () => {},
    useProgram: () => {},
    getAttribLocation: () => 0,
    getUniformLocation: () => 0,
    enableVertexAttribArray: () => {},
    vertexAttribPointer: () => {},
    bindBuffer: () => {},
    uniformMatrix4fv: () => {},
    uniform4f: () => {},
    uniform3f: () => {},
    uniform1f: () => {},
    uniform1i: () => {},
    enable: () => {},
    blendFunc: () => {},
    bindTexture: () => {},
    activeTexture: () => {},
    drawElements: () => {},
    drawArrays: () => {},
    depthMask: () => {},
    depthFunc: () => {},
    disable: () => {},
  };
}

describe("ShaderManager", () => {
  it("should initialize all shader types", () => {
    const gl = createMockGL();
    const manager = new ShaderManager(gl, "");
    const names = Object.values(ShaderName);
    for (const name of names) {
      expect(ShaderManager.shader(name)).toBeDefined();
    }
    expect(Object.keys(ShaderManager.shaders())).toEqual(names);
  });
});

describe("各Shaderクラスのインスタンス化", () => {
  it("SimpleShader, SimpleTextureShader, BasicShader, SkyBoxShader, ParticleShaderが生成できる", () => {
    const gl = createMockGL();
    const manager = new ShaderManager(gl, "");
    expect(ShaderManager.shader(ShaderName.SIMPLE)).toBeDefined();
    expect(ShaderManager.shader(ShaderName.SIMPLETEX)).toBeDefined();
    expect(ShaderManager.shader(ShaderName.BASIC)).toBeDefined();
    expect(ShaderManager.shader(ShaderName.SKYBOX)).toBeDefined();
    expect(ShaderManager.shader(ShaderName.PARTICLE)).toBeDefined();
  });
});
