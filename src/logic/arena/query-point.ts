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
* Created: Aug. 21, 2023
* Supported by: National Key Research and Development Program of China
*/

import IObjectArena from "./arena"
import { Point, Line, Rect, Size } from '../common/types2D'
import { uid } from '../common/uid'

export default class QueryPointArena implements IObjectArena<Point> {
    private _objects: Map<uid, Point> = new Map()
    private _boundRect: Rect = Rect.zero()
    private _cropRect: Rect | null = null
    private _scope: Rect | null = null
    private _paddedScope: Rect | null = null
    private _tolerance: number = 0

    public get empty(): boolean {
        return this._objects.size === 0
    }

    public get objects(): Map<uid, Point> {
        return this._objects
    }

    public get boundRect(): Rect {
        return this._boundRect
    }

    public set cropRect(rect: Rect | null) {
        this._cropRect = rect
        this._calcScope()
    }

    public set tolerance(val: number) {
        this._tolerance = val
        if (this._scope !== null) {
            this._paddedScope = Rect.padding(this._scope, this._tolerance)
        }
    }

    private _calcScope() {
        if (this._cropRect === null) {
            this._scope = this._boundRect
            return
        }
        const inter = Rect.intersection(this._boundRect, this._cropRect)
        if (inter instanceof Rect) {
            this._scope = inter
            this._paddedScope = Rect.padding(this._scope, this._tolerance)
        } else {
            this._scope = null
            this._paddedScope = null
        }
    }

    public clone(): IObjectArena<Point> {
        let ret = new QueryPointArena()
        ret._objects = new Map(this._objects)
        ret._boundRect = this._boundRect.clone()
        ret.cropRect = this._cropRect?.clone() || null
        return ret
    }

    public addObject(id: uid, obj: Point): boolean {
        if (this._objects.has(id)) {
            console.error(`object ${id} already exists`)
            return false
        }
        for (let [k, v] of this._objects) {
            if (v.equals(obj)) {
                console.error(`object ${id} equals with ${k}`)
                return false
            }
        }
        this._objects.set(id, obj)
        if (this.boundRect.isZero()) {
            this._boundRect = new Rect(obj.clone(), new Size(0, 0))
        } else {
            this._boundRect.expandToInclude(obj)
        }
        this._calcScope()
        return true
    }

    public getObject(id: uid): Point | null {
        return this._objects.get(id) || null
    }

    public setObject(id: uid, obj: Point): boolean {
        if (!this._objects.has(id)) {
            console.error(`object ${id} does not exist`)
            return false
        }
        for (let [k, v] of this._objects) {
            if (k === id) continue
            if (v.equals(obj)) {
                console.warn(`object ${id} equals with ${k}`)
                return false
            }
        }
        this._objects.set(id, obj)
        this._boundRect = new Rect(this.objects.values().next().value.clone(), new Size(0, 0))
        for (const [k, v] of this._objects) {
            this._boundRect.expandToInclude(v)
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
            : new Rect(this.objects.values().next().value.clone(), new Size(0, 0))
        for (const [k, v] of this._objects) {
            this._boundRect.expandToInclude(v)
        }
        this._calcScope()
        return true
    }

    public posOccupied(pos: Point): uid | null {
        if (this._paddedScope !== null && !this._paddedScope.containsPoint(pos)) {
            return null
        }
        if (this._tolerance === 0) {
            for (let [k, v] of this._objects) {
                if (v.equals(pos)) {
                    return k
                }
            }
        } else {
            for (let [k, v] of this._objects) {
                if (Point.distance(v, pos) <= this._tolerance) {
                    return k
                }
            }
        }
        return null
    }

    public lineOccupied(line: Line, except: uid): uid | null {
        throw new Error("Method not implemented.")
    }

    public rectOccupied(rect: Rect, except: uid, fill: boolean): uid | null {
        throw new Error("Method not implemented.")
    }

    public lineOccupiedSet(line: Line, except: uid = -1): Set<uid> {
        throw new Error("Method not implemented.")
    }

    public rectOccupiedSet(rect: Rect, except: uid = -1, fill: boolean = true): Set<uid> {
        throw new Error("Method not implemented.")
    }
}