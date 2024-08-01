/**
 * Copyright (c) 2022 Beijing Jiaotong University
 * PhotLab is licensed under [Open Source License].
 * You can use this software according to the terms and conditions of the [Open Source License].
 * You may obtain a copy of [Open Source License] at: [https://open.source.license/]
 *
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 *
 * See the [Open Source License] for more details.
 *
 * Author: Zhenjie Wei
 * Created: Jul. 21, 2023
 * Supported by: National Key Research and Development Program of China
 */

export default class XPSChecker {
    private timeCache: { [key: string]: number }
    private perfCache: { [key: string]: number }
    private lastHead: string

    constructor() {
        this.timeCache = {}
        this.perfCache = {}
        this.lastHead = ''
    }

    public start() {
        this.timeCache = {}
        this.lastHead = ''
        this.timeCache[''] = performance.now()
    }

    public check(head: string, dif_from: string = '-1', factor: number = 1) {
        this.timeCache[head] = performance.now()
        if (dif_from === '-1') {
            dif_from = this.lastHead
        }
        const diff = this.timeCache[head] - this.timeCache[dif_from]
        let xps: number = 0
        const cache = this.perfCache[head]
        if (diff > 0) {
            xps = Math.floor((1000 / diff) * factor)
            xps = cache ? Math.floor(cache * 0.7 + xps * 0.3) : xps
        } else {
            xps = cache ? cache : 0
        }
        this.perfCache[head] = xps
        this.lastHead = head
    }

    public get(head: string, tail: string = ''): string {
        const xps = this.perfCache[head]
        return `${head}: ${xps}${tail}`
    }

    public getPerfDesc(): string {
        let desc = ''
        for (const [head, xps] of Object.entries(this.perfCache)) {
            desc += `${head}:${xps.toString().padStart(5)}; `
        }
        return desc
    }
}
