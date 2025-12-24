class ObjGroup {
    static SortOrderKind = {
        ASC: 1,
        NONE: 0,
        DESC: -1
    };

    constructor() {
        this.objects = [];
        this.sortOrder = ObjGroup.SortOrderKind.ASC; 
    }
    addObject(obj) {
        this.objects.push(obj);
    }
}

class Scene {
    objGroups = [];
    lights = [];

    layers = 3;
    constructor() {
        this.objGroups = Array.from({ length: this.layers }, () => new ObjGroup());
        this.objGroups[0].sortOrder = ObjGroup.SortOrderKind.ASC;
        this.objGroups[1].sortOrder = ObjGroup.SortOrderKind.ASC;
        this.objGroups[2].sortOrder = ObjGroup.SortOrderKind.DESC;  // 透明オブジェクト用

        this.isFog = false;

        this.fogColor = [0.5, 0.5, 0.5, 0.0]; // フォグの色
        this.fogStart = 100.0; // フォグが始まる距離
        this.fogEnd = 100.0; // フォグが完全に不透明になる距離

    }


    addObject(obj, options = {layer: 1}) {
        this.objGroups[options.layer].addObject(obj);

        if(obj.type === 'light'){
            this.lights.push(obj);
        }
    }

    updateFrame(deltaTime) {
        this.objGroups.forEach(group => {
            group.objects.forEach(obj => {
                obj.updateFrame(deltaTime);
            });
        });
    }
}

export { Scene, ObjGroup };