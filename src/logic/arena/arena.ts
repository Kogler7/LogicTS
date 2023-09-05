import { Point, Line, Rect } from '@/common/types2D'
import { uid } from '@/common/uid'

export interface IObjectArena {
    get empty(): boolean
    get boundRect(): Rect
    addObject(id: uid, rect: Rect): boolean
    getObject(id: uid): Rect | null
    setObject(id: uid, rect: Rect): boolean
    delObject(id: uid): boolean
    posOccupied(pos: Point): uid | null
    lineOccupied(line: Line, except: uid): uid | null
    rectOccupied(rect: Rect, except: uid, fill: boolean): uid | null
    lineOccupiedList(line: Line, except: uid): uid[]
    rectOccupiedList(rect: Rect, except: uid, fill: boolean): uid[]
}

export class QueryObjectArena implements IObjectArena {
    private _objects: Map<uid, Rect> = new Map()
    private _boundRect: Rect = Rect.zero()

    public get empty(): boolean {
        return this._objects.size === 0
    }

    public get boundRect(): Rect {
        return this._boundRect
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
        this._boundRect = this._boundRect.union(rect)
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
                console.error(`object ${id} intersects with ${k}`)
                return false
            }
        }
        this._objects.set(id, rect)
        this._boundRect = this._boundRect.union(rect)
        return true
    }

    public delObject(id: uid): boolean {
        if (!this._objects.has(id)) {
            console.error(`object ${id} does not exist`)
            return false
        }
        this._objects.delete(id)
        this._boundRect = Rect.zero()
        for (let [k, v] of this._objects) {
            this._boundRect = this._boundRect.union(v)
        }
        return true
    }

    public posOccupied(pos: Point): uid | null {
        for (let [k, v] of this._objects) {
            if (v.containsPoint(pos)) {
                return k
            }
        }
        return null
    }

    public lineOccupied(line: Line, except: uid): uid | null {
        for (let [k, v] of this._objects) {
            if (k === except) continue
            if (v.intersectsLine(line)) {
                return k
            }
        }
        return null
    }

    public rectOccupied(rect: Rect, except: uid, fill: boolean): uid | null {
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

    public lineOccupiedList(line: Line, except: uid): uid[] {
        let ret: uid[] = []
        for (let [k, v] of this._objects) {
            if (k === except) continue
            if (v.intersectsLine(line)) {
                ret.push(k)
            }
        }
        return ret
    }

    public rectOccupiedList(rect: Rect, except: uid, fill: boolean): uid[] {
        let ret: uid[] = []
        for (let [k, v] of this._objects) {
            if (k === except) continue
            if (fill) {
                if (v.intersectsRect(rect)) {
                    ret.push(k)
                }
            } else {
                for (let line of rect.edges) {
                    if (v.intersectsLine(line)) {
                        ret.push(k)
                        break
                    }
                }
            }
        }
        return ret
    }
}

// export class RTreeObjectArena implements IObjectArena {
//     public get boundRect(): Rect { }
    
//     public addObject(id: uid, rect: Rect): boolean { }
    
//     public getObject(id: uid): Rect | null { }
    
//     public setObject(id: uid, rect: Rect): boolean { }
    
//     public delObject(id: uid): boolean { }
    
//     public posOccupied(pos: Point): uid | null { }
    
//     public lineOccupied(line: Line, except: uid): uid | null { }
    
//     public rectOccupied(rect: Rect, except: uid, fill: boolean): uid | null { }
    
//     public lineOccupiedList(line: Line, except: uid): uid[] { }
    
//     public rectOccupiedList(rect: Rect, except: uid, fill: boolean): uid[] { }
// }

// export class CanvasObjectArena implements IObjectArena {
//     public get boundRect(): Rect { }
//     public addObject(id: uid, rect: Rect): boolean { }
//     public getObject(id: uid): Rect | null { }
//     public setObject(id: uid, rect: Rect): boolean { }
//     public delObject(id: uid): boolean { }
//     public posOccupied(pos: Point): uid | null { }
//     public lineOccupied(line: Line, except: uid): uid | null { }
//     public rectOccupied(rect: Rect, except: uid, fill: boolean): uid | null { }
//     public lineOccupiedList(line: Line, except: uid): uid[] { }
//     public rectOccupiedList(rect: Rect, except: uid, fill: boolean): uid[] { }
// }