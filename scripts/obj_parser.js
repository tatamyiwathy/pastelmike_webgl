// faces: array of faces; each face is array of tokens like {v: int, vn: int}
// vertices: array of [x,y,z], indexed 0-based
// vns: array of [x,y,z], indexed 0-based (OBJ の vn)
function expandPerTriangle(vertices, vns, uvs, faces) {
    const pos = [];
    const norm = [];
    const uv = [];
    const indices = [];
    let idx = 0;

    const combined_v_vn_uv = {};

    for (const face of faces) {
        // face is a triangle (array length 3)
        for (let i = 0; i < face.length; ++i) {
            const vIndex = face[i].v;
            const nIndex = face[i].vn == null ? vIndex : face[i].vn;  // faceで法線の指定がない場合は頂点と同じインデックスを使う
            const tIndex = face[i].vt == null ? -1 : face[i].vt;

            const key = `${vIndex}_${nIndex}_${tIndex}`;


            if (key in combined_v_vn_uv) {
                indices.push(combined_v_vn_uv[key].i);
            }
            else {
                combined_v_vn_uv[key] = { i:idx};
                pos.push(...vertices[vIndex]);
                norm.push(...vns[nIndex]);
                if (tIndex !== -1) {
                    uv.push(...uvs[tIndex]);
                }
                indices.push(idx++);
            }
        }
    }
    return [
        new Float32Array(pos),
        new Float32Array(norm),
        new Float32Array(uv),
        new Uint32Array(indices) // optional; you can gl.drawArrays instead
    ];
}

function _parseObj(text) {
    const lines = text.split('\n');

    const vertices = [];
    const normals = [];
    const uvs = [];
    const faces = [];
    const mtllibs = []; // mtllibは複数指定可能

    for (const line of lines) {
        const trimed = line.trim();
        const parts = trimed.split(/\s+/).slice(1);
        if (trimed.startsWith('v ')) {
            const v = parts.slice(0, 3).map(Number);
            if (v.length < 3) throw new Error('Invalid vertex line: ' + line);
            vertices.push(v);
        } else if (trimed.startsWith('vn ')) {
            const n = parts.slice(0, 3).map(Number);
            if (n.length < 3) throw new Error('Invalid normal line: ' + line);
            normals.push(n);
        } else if (trimed.startsWith('vt ')) {
            const n = [parseFloat(parts[0]), parseFloat(parts[1])];
            uvs.push(n);
        } else if (trimed.startsWith('f ')) {

            const verts = parts.map(token => {
                const [v, vt, vn] = token.split('/');
                return {
                    v: parseInt(v, 10) - 1,
                    vt: vt ? parseInt(vt, 10) - 1 : null,
                    vn: vn ? parseInt(vn, 10) - 1 : null
                };
            });

            // fan triangulation
            for (let i = 1; i < verts.length - 1; i++) {
                faces.push([
                    verts[0],
                    verts[i],
                    verts[i + 1]
                ]);
            }
        }
        else if (trimed.startsWith('mtllib ')) {
            mtllibs.push(trimed.substring(7).trim());
        }
    }

    if(normals.length === 0){
        // 法線データがない場合は仮の法線データを作成
        for(let i=0; i<faces.length; i++){
            const face = faces[i];
            const v0 = vertices[face[0].v];
            const v1 = vertices[face[1].v];
            const v2 = vertices[face[2].v];
            const edge1 = [
                v0[0] - v1[0],
                v0[1] - v1[1],
                v0[2] - v1[2]
            ];
            const edge2 = [
                v0[0] - v2[0],
                v0[1] - v2[1],
                v0[2] - v2[2]
            ];
            glMatrix.vec3.cross(edge1, edge2, edge1);
            glMatrix.vec3.normalize(edge1, edge1);
            normals.push(edge1);
            const normalIndex = normals.length -1;
            face[0].vn = normalIndex;
            face[1].vn = normalIndex;
            face[2].vn = normalIndex;
        }
    }

    const obj = expandPerTriangle(vertices, normals, uvs, faces);
    return [ obj, mtllibs ];
}


// URLからOBJファイルを取得し、パースしてジオメトリデータを返す
// [vertices, normals, uvs, indeces]
export async function parseObj(url) {
    console.log(`Loading OBJ file from: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const text = await response.text();
    return _parseObj(text);
}

