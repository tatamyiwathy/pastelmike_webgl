import { Object3d } from './object_3d.js';

class ObjGroup extends Object3d {
    static SortOrderKind = {
        ASC: 1,
        NONE: 0,
        DESC: -1
    };

    constructor() {
        super("group");
        this.sortOrder = ObjGroup.SortOrderKind.ASC; 
    }

    // Object3d.add()
    // add(){}

    dispose(gl) {
        this.children.forEach((obj) => {
            obj.dispose(gl);
        });
    }
}

class Scene extends Object3d {
    lights = [];

    layers = 3;
    constructor() {
        super('scene');

        for (let i = 0; i < this.layers; i++) {
            super.add(new ObjGroup());
        }

        this.children[0].sortOrder = ObjGroup.SortOrderKind.ASC;
        this.children[1].sortOrder = ObjGroup.SortOrderKind.ASC;
        this.children[2].sortOrder = ObjGroup.SortOrderKind.DESC;  // 透明オブジェクト用

        this.isFog = false;
        this.fogColor = [0.5, 0.5, 0.5, 0.0]; // フォグの色
        this.fogStart = 100.0; // フォグが始まる距離
        this.fogEnd = 100.0; // フォグが完全に不透明になる距離

        this.ambientColor = [0.2, 0.2, 0.2]; // 環境光の色
    }


    add(obj, options = {layer: 1}) {
        this.children[options.layer].add(obj);

        if(obj.type === 'light'){
            console.log("Add light:", obj);
            this.lights.push(obj);
        }
    }

    updateFrame(deltaTime) {
        this.children.forEach(group => {
            group.children.forEach(obj => {
                obj.updateFrame(deltaTime);
            });
        });
    }

    getPointLights() {
        return this.lights.filter(light => light.lightKind === "point");
    }

    dispose(gl) {
        this.children.forEach((group) => {
            group.dispose(gl);
        });
    }
}

export { Scene, ObjGroup };