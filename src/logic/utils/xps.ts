export default class XPSChecker {
    private cache: { [key: string]: number };
    private last_head: string;

    constructor() {
        this.cache = {};
        this.last_head = "";
    }

    start() {
        this.cache = {};
        this.last_head = "";
        this.cache[""] = performance.now();
    }

    check(head: string, tail: string = "", dif_from: string = "-1", factor: number = 1) {
        this.cache[head] = performance.now();
        if (dif_from === "-1") {
            dif_from = this.last_head;
        }
        const diff = this.cache[head] - this.cache[dif_from];
        let xps: string | number = "inf";
        if (diff > 0) {
            xps = Math.floor(1000 / diff * factor);
            if (xps === 0) {
                xps = `-${Math.floor(diff)}`;
            }
        }
        console.log(`${head}: ${xps}${tail}`);
        this.last_head = head;
    }
}
