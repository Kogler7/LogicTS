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

import LogicCore from "@/logic/core"
import LogicLayer from "../logic/layer"
import { Point, Direction } from "@/logic/common/types2D"
import RenderPath from "@/models/path"
import RenderPair from "@/models/pair"
import { graphManager } from "@/plugins/graph"

export default class LinkLayer extends LogicLayer {
    private _linking: boolean = false
    private _lastPos: Point = Point.zero()
    private _dirLocked: boolean = false
    private _dirHovered: boolean = false
    private _currDir: Direction = Direction.RIGHT
    private _currPath: RenderPath | null = null

    private _startPair: RenderPair | null = null

    public onMounted(core: LogicCore): void {
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
        core.on('pair.click', this._onPairClicked.bind(this))
        core.on('pair.hover', (pair: RenderPair) => {
            if (this._linking && !this._dirLocked) {
                const crd = pair.position()
                this._dirHovered = true
                this._currDir = pair.dir
                this._currPath!.setLastWayPoint(crd, this._currDir)
            }
        })
        core.on('pair.leave', () => {
            if (this._linking) {
                this._dirHovered = false
            }
        })
    }

    private _onPairClicked(pair: RenderPair) {
        if (!this._linking) {
            this._startPair = pair
            this._linking = true
            this._currPath = new RenderPath(pair.position())
            this._currPath.addWayPoint(pair.position(), pair.dir)
            this.core?.fire('toast.show', 'Hold down SHIFT to lock the direction of the link.')
        } else if (this._startPair?.compatibleWith(pair)) {
            this._currPath?.setLastWayPoint(pair.position(), pair.dir)
            this.core?.fire('link.add', this._startPair, pair, this._currPath)
            this.core?.renderAll()
            this._linking = false
            this._startPair = null
        }
    }

    private _onMouseDown(e: MouseEvent) {
        if (e.button === 0) {
            if (this._linking) {
                const pos = new Point(e.offsetX, e.offsetY)
                const crd = this.core?.pos2crd(pos)
                if (!crd) return
                const dir = pos.minus(this._lastPos).normalDir
                this._currPath!.addWayPoint(crd, dir)
                return false // stop propagation
            }
        } else if (e.button === 2) {
            if (this._linking) {
                this._linking = false
                this._startPair = null
                this._currPath = null
                return false // stop propagation
            }
        }

    }

    private _onMouseMove(e: MouseEvent) {
        if (this._linking) {
            const pos = new Point(e.offsetX, e.offsetY)
            const crd = this.core?.pos2crd(pos)!
            if (!this._dirLocked && !this._dirHovered) {
                const dir = Point.minus(pos, this._lastPos).normalDir
                this._currDir = dir
            }
            this._currPath!.setLastWayPoint(crd, this._currDir)
            // smooth the last position
            this._lastPos.times(0.9).plus(pos.times(0.1))
        }
    }

    public onCache(ctx: CanvasRenderingContext2D): boolean {
        const paths = graphManager.graph.paths
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        for (const [id, path] of paths) {
            path.strokeOn(ctx, this.core!)
        }
        return true
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        if (!this._linking) return false
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 2
        this._currPath?.strokeOn(ctx, this.core!)
        return true
    }
}