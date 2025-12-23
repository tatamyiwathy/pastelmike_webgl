class Clock {
    constructor() {
        this.last = performance.now();
    }
    elapsedTime() {
        const now = performance.now();  // 現在の時刻をミリ秒で取得
        const delta = now - this.last;
        this.last = now;
        return delta / 1000;  // 秒単位で返す
    }

}

export { Clock };