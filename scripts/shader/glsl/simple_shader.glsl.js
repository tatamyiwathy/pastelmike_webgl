// シンプルシェーダー
export const simpleVertexShaderSource = `
    in vec3 position;
    uniform mat4 mvpMtx;

    void main() {
        gl_Position = mvpMtx * vec4(position, 1.0);
    }
`;

export const simpleFragmentShaderSource = `
    precision mediump float;

    uniform vec4 color;
    
    out vec4 outColor;
    
    void main() {
        outColor = color;
    }
`;

