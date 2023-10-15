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
* Created: Sep. 26, 2023
* Supported by: National Key Research and Development Program of China
*/

import { uid } from "@/logic/common/uid"
import LogicCore from "@/logic/core"
import LogicLayer from "../logic/layer"
import { Point, Vector, Direction } from "@/logic/common/types2D"

class WayPoint extends Point {
    public direction: Direction = Direction.RIGHT
    constructor(x: number, y: number, direction: Direction) {
        super(x, y)
        this.direction = direction
    }

    public static fromPoint(point: Point, direction: Direction): WayPoint {
        return new WayPoint(point.x, point.y, direction)
    }
}

export class LinkRoute {
    private _wayPoints: WayPoint[] = []

    constructor(initPoint: Point, dir: Direction = Direction.RIGHT) {
        this._wayPoints.push(WayPoint.fromPoint(initPoint, dir))
    }

    public get wayPoints(): WayPoint[] {
        return this._wayPoints
    }

    public get length(): number {
        return this._wayPoints.length
    }

    private _getCtrlPoint(p: WayPoint, length: number, isSrc: boolean): Point {
        if (!isSrc) {
            // reverse the length if it is the destination
            length = -length
        }
        switch (p.direction) {
            case Direction.LEFT:
                return new Point(p.x - length, p.y)
            case Direction.RIGHT:
                return new Point(p.x + length, p.y)
            case Direction.UP:
                return new Point(p.x, p.y - length)
            case Direction.DOWN:
                return new Point(p.x, p.y + length)
        }
    }

    private _getCtrlPair(src: WayPoint, dst: WayPoint): [Point, Point] {
        const length = Vector.fromPoints(src, dst).length / 2
        const ctrl1 = this._getCtrlPoint(src, length, true)
        const ctrl2 = this._getCtrlPoint(dst, length, false)
        return [ctrl1, ctrl2]
    }

    public addWayPoint(point: Point, direction: Direction): void {
        this._wayPoints.push(WayPoint.fromPoint(point, direction))
    }

    public setLastWayPoint(point: Point, direction: Direction): void {
        this._wayPoints[this._wayPoints.length - 1] = WayPoint.fromPoint(point, direction)
    }

    public renderOn(ctx: CanvasRenderingContext2D, core: LogicCore) {
        const crd2pos = core.crd2pos.bind(core)
        const start = this._wayPoints[0]
        ctx.beginPath()
        ctx.moveTo(...crd2pos(start).values)
        for (let i = 1; i < this._wayPoints.length; i++) {
            const crd = this._wayPoints[i]
            const [ctrl1, ctrl2] = this._getCtrlPair(this._wayPoints[i - 1], crd)
            ctx.bezierCurveTo(...crd2pos(ctrl1).values, ...crd2pos(ctrl2).values, ...crd2pos(crd).values)
        }
        ctx.stroke()
    }
}


export default class LinkLayer extends LogicLayer {
    private _objectIds: Set<uid> = new Set()
    private _route: LinkRoute = new LinkRoute(Point.zero())
    private _linking: boolean = false
    private _lastPos: Point = Point.zero()
    private _dirLocked: boolean = false
    private _currDir: Direction = Direction.RIGHT

    public onMounted(core: LogicCore): void {
        this._objectIds = core.logicObjectIds
        core.on('memory.switch.after', () => {
            this._objectIds = core.logicObjectIds
        })
        core.on('mousedown', this._onMouseDown.bind(this), -1)
        core.on('mousemove', this._onMouseMove.bind(this), -1)
        core.on('keydown.shift', () => { this._dirLocked = true })
        core.on('keyup.shift', () => { this._dirLocked = false })
    }

    private _onMouseDown(e: MouseEvent) {
        if (e.button === 0) {
            if (!this._linking) {
                this._linking = true
                const pos = new Point(e.offsetX, e.offsetY)
                const crd = this.core?.pos2crd(pos)
                if (!crd) return
                this._route = new LinkRoute(crd)
                this._route.addWayPoint(crd, Direction.RIGHT)
            } else {
                const pos = new Point(e.offsetX, e.offsetY)
                const crd = this.core?.pos2crd(pos)
                if (!crd) return
                const dir = pos.minus(this._lastPos).normalDir
                this._route.addWayPoint(crd, dir)
            }
        } else if (e.button === 2) {
            if (this._linking) {
                this._linking = false
                return false
            }
        }

    }

    private _onMouseMove(e: MouseEvent) {
        const pos = new Point(e.offsetX, e.offsetY)
        const crd = this.core?.pos2crd(pos)
        if (!crd) return
        if (this._linking) {
            if (!this._dirLocked) {
                const dir = Point.minus(pos, this._lastPos).normalDir
                this._currDir = dir
            }
            this._route.setLastWayPoint(crd, this._currDir)
        }
        // smooth the last position
        this._lastPos.times(0.99).plus(pos.times(0.01))
    }

    public onCache(ctx: CanvasRenderingContext2D): boolean {
        return true
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        this._route.renderOn(ctx, this.core!)
        return true
    }
}