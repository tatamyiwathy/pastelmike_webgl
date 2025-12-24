import { ShaderManager } from './shader.js';
import { ObjGroup } from './scene.js';
import { Frustum } from './frustum.js';
import { Clock } from './clock.js';
import { vec3 } from './math_utils.js';

export class Renderer {
    constructor(canvas) {
        this.gl = canvas.getContext('webgl2', { depth: true });

        if (!this.gl) {
            alert('WebGL not supported');
            return;
        }
        
        this.readyShader = false;

        this.frustum = new Frustum();

        this.enableCulling = true;

        this.clock = new Clock();

        this.vpMtx = glMatrix.mat4.create();

        this.shaderContext = {
            isFog: true,
        };

    }

    getDirectionLightDir(gl, scene) {

        const lightsDir = scene.lights.reduce( ( acc, light) => vec3.add(acc, light.direction), [0,0,0]);
        return vec3.normalize(lightsDir);
    }

    setupShaders(gl, shaderContext) {
        let shaderConfigs = "#version 300 es\n";
        if( shaderContext.isFog ){
            shaderConfigs += "#define USE_FOG\n";
        }
        if( shaderContext.isSpecular ){
            shaderConfigs += "#define USE_SPECULAR\n";
        }

        // Todo: Singleton化する
        new ShaderManager(this.gl, shaderConfigs); // シェーダーの初期化
    }

    render(scene, camera) {
        const gl = this.gl;

        // オブジェクトのモデル行列を更新
        scene.updateFrame(this.clock.elapsedTime());

        
        if( this.readyShader == false ) {
            this.shaderContext.isFog = scene.isFog ? true : false;
            console.log("Shader isFog:", this.shaderContext.isFog);
            scene.objGroups.forEach((group) => {
                group.objects.forEach((obj) => {
                    this.shaderContext.isSpecular = obj.material && obj.material.specular ? true : false;
                });
            });

            this.setupShaders(gl, this.shaderContext);
            this.readyShader = true;
        }



        // ビューポートの設定
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // 深度テストを有効にするが、常に最大値で合格するように設定する
        // これにより、スカイボックスは他のオブジェクトの背後に描画される
        gl.enable(gl.DEPTH_TEST);
        // gl.depthFunc(gl.LEQUAL);
        gl.depthFunc(gl.LESS);


        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1.0); // Zバッファのクリア値を1.0（最も遠い）に設定
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        glMatrix.mat4.multiply( this.vpMtx, camera.projMtx, camera.mdlViewMtx);

        // カリング用にフラスタムを更新
        this.frustum.extractPlanes(this.vpMtx);


        scene.objGroups.forEach((group) => {

            // カリング
            const culled = this.enableCulling ? this.frustumCulling(group.objects) : group.objects;



            if( group.sortOrder == ObjGroup.SortOrderKind.DESC ) {
                // カメラからの距離でソート（後ろのものから描画する）
                culled.sort( (a, b) => {
                    return b.clip[2] - a.clip[2];
                });
            }
            else if( group.sortOrder == ObjGroup.SortOrderKind.ASC ) {
                // カメラからの距離でソート（近いものから描画する）
                culled.sort( (a, b) => {
                    return a.clip[2] - b.clip[2];
                });
            }


            culled.forEach((obj) => {
                obj.updateMatrix(camera.projMtx, camera.mdlViewMtx, this.vpMtx);
                Renderer.renderContext = {
                    viewMatrix: camera.mdlViewMtx,
                    projectionMatrix: camera.projMtx,
                    viewProjectionMatrix: this.vpMtx,
                    modelViewProjection: obj.mvpMtx,
                    normalMatrix: obj.normalMtx,
                    modelMatrix: obj.worldMtx,
                    color: obj.material ? obj.material.color : Renderer.defaultColor,
                    textures: obj.material ? obj.material.textures : null,
                    wireFrame: obj.material ? obj.material.isWireframe : false,
                    useTexture: obj.material ? obj.material.useTexture : false,
                    size: obj.material ? obj.material.size : false,
                    directionalLightDir: this.getDirectionLightDir(gl, scene),
                    directionalLightColor: scene.lights.length > 0 ? scene.lights[0].color : [1,1,1],
                    uCubeMap: 0,
                    fogColor: scene.fogColor, // フォグの色
                    fogStart: scene.fogStart, // フォグが始まる距離
                    fogEnd: scene.fogEnd, // フォグが完全に不透明になる距離
                    cameraPos: camera.position, // 追加：カメラのワールド座標
                    shininess: 32.0, // 追加：鏡面反射の鋭さ
                    alphaScale: 1.0, // 追加：アルファスケール
                }

                if( obj.type == 'mesh' ){
                    const shader = ShaderManager.shader( obj.material.shaderName );
                    shader.render(this.gl, Renderer.renderContext, obj.geometry)
                }
            });
        });
    }

    static defaultFogColor = [0.5, 0.5, 0.5, 1.0];
    static defaultColor = [1.0, 1.0, 1.0, 1.0];
    static renderContext;

    frustumCulling(objects) {
        const culled = []
        objects.forEach(obj => {
            if(this.frustum.isSphereInside(obj.position, 2.0)) {
                culled.push(obj);
            }
        });
        return culled;
    }
}