// デバッグ用：深度テクスチャ可視化シェーダー
export const debugDepth_vertexShaderSource = `
layout(location = 0) in vec2 a_position;
layout(location = 1) in vec2 a_texcoord;

out vec2 v_texcoord;

void main() {
    v_texcoord = a_texcoord;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const debugDepth_fragmentShaderSource = `
precision highp float;

in vec2 v_texcoord;
out vec4 outColor;

uniform sampler2D u_depthTexture;

void main() {
    float depth = texture(u_depthTexture, v_texcoord).r;
    // 深度値を可視化（0.0=黒, 1.0=白）
    outColor = vec4(vec3(depth), 1.0);
}
`;

