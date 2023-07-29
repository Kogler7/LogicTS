export default class XPSChecker {
    private timeCache: { [key: string]: number }
    private perfCache: { [key: string]: number | string }
    private lastHead: string

    constructor() {
        this.timeCache = {}
        this.perfCache = {}
        this.lastHead = ""
    }

    public start() {
        this.timeCache = {}
        this.lastHead = ""
        this.timeCache[""] = performance.now()
    }

    public check(head: string, dif_from: string = "-1", factor: number = 1) {
        this.timeCache[head] = performance.now()
        if (dif_from === "-1") {
            dif_from = this.lastHead
        }
        const diff = this.timeCache[head] - this.timeCache[dif_from]
        let xps: string | number = "inf"
        if (diff > 0) {
            xps = Math.floor(1000 / diff * factor)
            if (xps === 0) {
                xps = `-${Math.floor(diff)}`
            }
        }
        this.perfCache[head] = xps
        this.lastHead = head
    }

    public get(head: string, tail: string = ""): string {
        const xps = this.perfCache[head]
        return `${head}: ${xps}${tail}`
    }
}
