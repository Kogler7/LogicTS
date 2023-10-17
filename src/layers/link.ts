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
import { RenderPath } from "@/models/path"

export default class LinkLayer extends LogicLayer {
    private _objectIds: Set<uid> = new Set()
    private _path: RenderPath = new RenderPath(Point.zero())
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
        core.on('keydown.shift', () => {
            if (this._dirLocked) return
            this._dirLocked = true
            let dir: string
            switch (this._currDir) {
                case Direction.LEFT:
                    dir = 'LEFT'
                    break
                case Direction.RIGHT:
                    dir = 'RIGHT'
                    break
                case Direction.UP:
                    dir = 'UP'
                    break
                case Direction.DOWN:
                    dir = 'DOWN'
                    break
            }
            this.core?.fire('toast.show', `Direction of the link is LOCKED to ${dir}.`)
        })
        core.on('keyup.shift', () => {
            this._dirLocked = false
            this.core?.fire('toast.show', 'Direction of the link is UNLOCKED.')
        })
    }

    private _onMouseDown(e: MouseEvent) {
        if (e.button === 0) {
            if (!this._linking) {
                this._linking = true
                const pos = new Point(e.offsetX, e.offsetY)
                const crd = this.core?.pos2crd(pos)
                if (!crd) return
                this._path = new RenderPath(crd)
                this._path.addWayPoint(crd, Direction.RIGHT)
                this.core?.fire('toast.show', 'Hold down SHIFT to lock the direction of the link.')
            } else {
                const pos = new Point(e.offsetX, e.offsetY)
                const crd = this.core?.pos2crd(pos)
                if (!crd) return
                const dir = pos.minus(this._lastPos).normalDir
                this._path.addWayPoint(crd, dir)
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
            this._path.setLastWayPoint(crd, this._currDir)
        }
        // smooth the last position
        this._lastPos.times(0.9).plus(pos.times(0.1))
    }

    public onCache(ctx: CanvasRenderingContext2D): boolean {
        return true
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        this._path.strokeOn(ctx, this.core!)
        return true
    }
}