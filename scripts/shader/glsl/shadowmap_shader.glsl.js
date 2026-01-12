export const shadowmapVertexShaderSource = `
layout(location = 0) in vec3 a_position;

uniform mat4 lightSpaceMatrix;
uniform mat4 modelMatrix;

void main() {
    // ライトから見た座標に変換
    gl_Position = lightSpaceMatrix * modelMatrix * vec4(a_position, 1.0);
}
    `;

export const shadowmapFragmentShaderSource = `
precision highp float;

void main() {
    // WebGL 2.0 + 深度アタッチメントのみの場合、
    // 何も書かなくても自動的に深度が書き込まれます。
    // (空でOKです)
}
`;
