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
* Created: Oct. 13, 2023
* Supported by: National Key Research and Development Program of China
*/

import LogicCore from "@/logic/core"
import { Point, Vector, Direction, Rect } from "@/logic/common/types2D"

const SHOW_CTRL_POINTS = false

export class WayPoint extends Point {
    public direction: Direction = Direction.RIGHT

    constructor(x: number, y: number, direction: Direction) {
        super(x, y)
        this.direction = direction
    }

    static fromPoint(point: Point, direction: Direction): WayPoint {
        return new WayPoint(point.x, point.y, direction)
    }
}

export default class RenderPath {
    private _area: Rect
    private _dirty: boolean = false
    private _wayPoints: WayPoint[] = []
    // cache the control points for each way point
    // the control points are used to draw bezier curve
    // weak map is used to avoid memory leak
    private _ctrlPoints: WeakMap<WayPoint, [number, Point, Point]> = new WeakMap()

    constructor(initPoint: Point, dir: Direction = Direction.RIGHT) {
        this._wayPoints.push(WayPoint.fromPoint(initPoint, dir))
        this._area = Rect.fromLTWH(initPoint.x, initPoint.y, 0, 0)
    }

    static fromPoints(points: Array<[Point, Direction]>): RenderPath {
        const path = new RenderPath(points[0][0], points[0][1])
        for (let i = 1; i < points.length; i++) {
            const [point, dir] = points[i]
            path.addWayPoint(point, dir)
        }
        return path
    }

    public get area(): Rect {
        if (this._dirty) {
            this._dirty = false
            const { x, y } = this._wayPoints[0]
            this._area = Rect.fromLTWH(x, y, 0, 0)
            for (const p of this._wayPoints) {
                this._area.expandToInclude(p)
            }
        }
        return this._area
    }

    public get wayPoints(): WayPoint[] {
        return this._wayPoints
    }

    public get length(): number {
        return this._wayPoints.length
    }

    public get firstDir(): Direction {
        return this._wayPoints[0].direction
    }

    public get lastDir(): Direction {
        return this._wayPoints[this._wayPoints.length - 1].direction
    }

    private _getCtrlPoint(p: WayPoint, length: number, isSrc: boolean): Point {
        if (this._ctrlPoints.has(p)) {
            const [len, ctrl1, ctrl2] = this._ctrlPoints.get(p)!
            if (len === length) {
                return isSrc ? ctrl1 : ctrl2
            }
        }
        let ctrl1: Point
        let ctrl2: Point
        switch (p.direction) {
            case Direction.LEFT:
                ctrl1 = new Point(p.x - length, p.y)
                ctrl2 = new Point(p.x + length, p.y)
                break
            case Direction.RIGHT:
                ctrl1 = new Point(p.x + length, p.y)
                ctrl2 = new Point(p.x - length, p.y)
                break
            case Direction.UP:
                ctrl1 = new Point(p.x, p.y - length)
                ctrl2 = new Point(p.x, p.y + length)
                break
            case Direction.DOWN:
                ctrl1 = new Point(p.x, p.y + length)
                ctrl2 = new Point(p.x, p.y - length)
                break
        }
        // cache the control points in the weak map
        this._ctrlPoints.set(p, [length, ctrl1, ctrl2])
        this._dirty = true // the area is changed
        return isSrc ? ctrl1 : ctrl2
    }

    private _getCtrlPair(src: WayPoint, dst: WayPoint): [Point, Point] {
        const length = Vector.fromPoints(src, dst).length / 2
        const ctrl1 = this._getCtrlPoint(src, length, true)
        const ctrl2 = this._getCtrlPoint(dst, length, false)
        return [ctrl1, ctrl2]
    }

    public addWayPoint(point: Point, direction: Direction): void {
        this._wayPoints.push(WayPoint.fromPoint(point, direction))
        this._dirty = true // the area is changed
    }

    public setFirstWayPoint(point: Point, direction: Direction): void {
        if (this._wayPoints.length === 0) {
            this._wayPoints.push(WayPoint.fromPoint(point, direction))
        } else {
            this._wayPoints[0] = WayPoint.fromPoint(point, direction)
        }
        this._dirty = true // the area is changed
    }

    public setLastWayPoint(point: Point, direction: Direction): void {
        if (this._wayPoints.length === 0) {
            this._wayPoints.push(WayPoint.fromPoint(point, direction))
        } else {
            this._wayPoints[this._wayPoints.length - 1] = WayPoint.fromPoint(point, direction)
        }
        this._dirty = true // the area is changed
    }

    public strokeOn(ctx: CanvasRenderingContext2D, core: LogicCore) {
        if (this._wayPoints.length < 2) {
            return
        }
        const crd2pos = core.crd2pos.bind(core)
        let lastP = this._wayPoints[0]
        ctx.beginPath()
        ctx.moveTo(...crd2pos(lastP).values)
        for (let i = 1; i < this._wayPoints.length; i++) {
            const currP = this._wayPoints[i]
            const [ctrl1, ctrl2] = this._getCtrlPair(lastP, currP)
            ctx.bezierCurveTo(...crd2pos(ctrl1).values, ...crd2pos(ctrl2).values, ...crd2pos(currP).values)
            lastP = currP
        }
        ctx.stroke()
        if (SHOW_CTRL_POINTS) {
            let lastP = this._wayPoints[0]
            ctx.save()
            ctx.lineWidth = 1
            ctx.strokeStyle = 'grey'
            for (let i = 1; i < this._wayPoints.length; i++) {
                const currP = this._wayPoints[i]
                const [ctrl1, ctrl2] = this._getCtrlPair(lastP, currP)
                ctx.beginPath()
                ctx.setLineDash([5, 2])
                ctx.moveTo(...crd2pos(lastP).values)
                ctx.lineTo(...crd2pos(currP).values)
                ctx.stroke()
                ctx.strokeStyle = 'red'
                ctx.fillStyle = 'red'
                ctx.beginPath()
                ctx.setLineDash([])
                ctx.moveTo(...crd2pos(lastP).values)
                ctx.lineTo(...crd2pos(ctrl1).values)
                ctx.stroke()
                ctx.beginPath()
                ctx.arc(...crd2pos(ctrl1).values, 3, 0, 2 * Math.PI)
                ctx.fill()
                ctx.strokeStyle = 'blue'
                ctx.fillStyle = 'blue'
                ctx.beginPath()
                ctx.moveTo(...crd2pos(currP).values)
                ctx.lineTo(...crd2pos(ctrl2).values)
                ctx.stroke()
                ctx.beginPath()
                ctx.arc(...crd2pos(ctrl2).values, 3, 0, 2 * Math.PI)
                ctx.fill()
                lastP = currP
                ctx.strokeStyle = 'grey'
            }
            ctx.strokeRect(...core.crd2posRect(this.area).ltwh)
            ctx.restore()
        }
    }
}