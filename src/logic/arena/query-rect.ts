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
* Created: Oct. 24, 2023
* Supported by: National Key Research and Development Program of China
*/

import IObjectArena from "./arena"
import { Point, Line, Rect } from '../common/types2D'
import { uid } from '../common/uid'

export default class QueryRectArena implements IObjectArena<Rect> {
    private _objects: Map<uid, Rect> = new Map()
    private _boundRect: Rect = Rect.zero()
    private _cropRect: Rect | null = null
    private _scope: Rect | null = null

    public get empty(): boolean {
        return this._objects.size === 0
    }

    public get objects(): Map<uid, Rect> {
        return this._objects
    }

    public get boundRect(): Rect {
        return this._boundRect
    }

    public set cropRect(rect: Rect | null) {
        this._cropRect = rect
        this._calcScope()
    }

    public set tolerance(val: number) { }

    private _calcScope() {
        if (this._cropRect === null) {
            this._scope = this._boundRect
            return
        }
        const inter = Rect.intersection(this._boundRect, this._cropRect)
        if (inter instanceof Rect) {
            this._scope = inter
        } else {
            this._scope = null
        }
    }

    public clone(): IObjectArena<Rect> {
        let ret = new QueryRectArena()
        ret._objects = new Map(this._objects)
        ret._boundRect = this._boundRect.clone()
        ret.cropRect = this._cropRect?.clone() || null
        return ret
    }

    public addObject(id: uid, rect: Rect): boolean {
        if (this._objects.has(id)) {
            console.error(`object ${id} already exists`)
            return false
        }
        for (let [k, v] of this._objects) {
            if (v.intersectsRect(rect)) {
                console.error(`object ${id} intersects with ${k}`)
                return false
            }
        }
        this._objects.set(id, rect)
        if (this.boundRect.isZero()) {
            this._boundRect = rect.clone()
        } else {
            this._boundRect.union(rect)
        }
        this._calcScope()
        return true
    }

    public getObject(id: uid): Rect | null {
        return this._objects.get(id) || null
    }

    public setObject(id: uid, rect: Rect): boolean {
        if (!this._objects.has(id)) {
            console.error(`object ${id} does not exist`)
            return false
        }
        for (let [k, v] of this._objects) {
            if (k === id) continue
            if (v.intersectsRect(rect)) {
                console.warn(`object ${id} intersects with ${k}`)
                return false
            }
        }
        this._objects.set(id, rect)
        this._boundRect = this._objects.values().next().value.clone()
        for (let [k, v] of this._objects) {
            this._boundRect.union(v)
        }
        this._calcScope()
        return true
    }

    public delObject(id: uid): boolean {
        if (!this._objects.has(id)) {
            console.error(`object ${id} does not exist`)
            return false
        }
        this._objects.delete(id)
        this._boundRect = this._objects.size === 0 ? Rect.zero()
            : this._objects.values().next().value.clone()
        for (let [k, v] of this._objects) {
            this._boundRect.union(v)
        }
        this._calcScope()
        return true
    }

    public posOccupied(pos: Point): uid | null {
        if (this._scope !== null && !this._scope.containsPoint(pos)) {
            return null
        }
        for (let [k, v] of this._objects) {
            if (v.containsPoint(pos)) {
                return k
            }
        }
        return null
    }

    public lineOccupied(line: Line, except: uid): uid | null {
        if (this._scope !== null && !this._scope.containsLine(line)) {
            return null
        }
        for (let [k, v] of this._objects) {
            if (k === except) continue
            if (v.intersectsLine(line)) {
                return k
            }
        }
        return null
    }

    public rectOccupied(rect: Rect, except: uid, fill: boolean): uid | null {
        if (this._scope !== null && !this._scope.intersectsRect(rect)) {
            return null
        }
        for (let [k, v] of this._objects) {
            if (k === except) continue
            if (fill) {
                if (v.intersectsRect(rect)) {
                    return k
                }
            } else {
                for (let line of rect.edges) {
                    if (v.intersectsLine(line)) {
                        return k
                    }
                }
            }
        }
        return null
    }

    public lineOccupiedSet(line: Line, except: uid = -1): Set<uid> {
        if (this._scope !== null && !this._scope.containsLine(line)) {
            return new Set()
        }
        let ret: Set<uid> = new Set()
        for (let [k, v] of this._objects) {
            if (k === except) continue
            if (v.intersectsLine(line)) {
                ret.add(k)
            }
        }
        return ret
    }

    public rectOccupiedSet(rect: Rect, except: uid = -1, fill: boolean = true): Set<uid> {
        if (this._scope !== null && !this._scope.intersectsRect(rect)) {
            return new Set()
        }
        let ret: Set<uid> = new Set()
        for (let [k, v] of this._objects) {
            if (k === except) continue
            if (fill) {
                if (v.intersectsRect(rect)) {
                    ret.add(k)
                }
            } else {
                for (let line of rect.edges) {
                    if (v.intersectsLine(line)) {
                        ret.add(k)
                        break
                    }
                }
            }
        }
        return ret
    }
}