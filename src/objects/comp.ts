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
* Created: Sep. 7, 2023
* Supported by: National Key Research and Development Program of China
*/

import { Point, Rect } from "@/logic/common/types2D"
import path from "path"
import IRenderable from "@/logic/mixins/renderable"
import LogicCore from "@/logic/core"
import IObjectArena from "@/logic/arena/arena"
import { Movable } from "@/logic/mixins/movable"
import RenderNode from "@/models/node"
import { PortType } from "@/models/port"

const prjRoot = 'D:\\CodeBase\\ElectronPrjs\\LogicTS\\assets\\icons'

export default class Component extends Movable implements IRenderable {
    private _moving: boolean = false
    private _resizing: boolean = false
    private _arena: IObjectArena<Rect> | null = null
    private _node: RenderNode
    private _icon: HTMLImageElement = new Image()
    private _iconReady: boolean = false

    constructor(node: RenderNode) {
        super(node.id, 0, node.rect)
        this._node = node
        this._icon.src = path.join(prjRoot, node.icon + '.svg')
        this._icon.onload = () => {
            this._iconReady = true
            this.core?.renderAll()
        }
    }

    public get node() {
        return this._node
    }

    public onRegistered(core: LogicCore): void {
        super.onRegistered(core)
        this._arena = core.logicArena
        core.on("movobj.logic.finish", this.onMoveFinished.bind(this))
    }

    public renderAt(ctx: CanvasRenderingContext2D, rect: Rect): Rect {
        // if (!this._moving) {
        //     ctx.strokeStyle = "#000000"
        //     ctx.lineWidth = 1
        //     ctx.strokeRect(...rect.ltwh)
        // }
        // draw icon
        if (this._iconReady) {
            ctx.drawImage(this._icon, ...rect.ltwh)
        } else {
            // render a placeholder (a white rect with a cross inside)
            ctx.fillStyle = "#ffffff"
            ctx.fillRect(...rect.ltwh)
            ctx.strokeStyle = "#000000"
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(rect.left, rect.top)
            ctx.lineTo(rect.left + rect.width, rect.top + rect.height)
            ctx.moveTo(rect.left + rect.width, rect.top)
            ctx.lineTo(rect.left, rect.top + rect.height)
            ctx.stroke()
        }
        // draw ports
        const ports = this._node.ports
        for (const [id, port] of ports) {
            const crd = this._node.calcPortPos(port)
            const pos = this.core!.crd2pos(crd)
            if (port.typ === PortType.OUT) {
                ctx.fillStyle = "#ff0000"
            } else {
                ctx.fillStyle = "#0000ff"
            }
            ctx.beginPath()
            ctx.arc(pos.x, pos.y, 4, 0, 2 * Math.PI)
            ctx.fill()
        }
        return rect
    }

    public renderOn(ctx: CanvasRenderingContext2D) {
        const renderRect = this.core!.crd2posRect(this.rect).float()
        const rect = this.renderAt(ctx, renderRect)
        // if this component is moving or resizing, render a mask
        if (this._moving || this._resizing) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
            ctx.fillRect(...rect.ltwh)
        }
    }

    public onMoveBegin(): void {
        this._moving = true
    }

    public onMoveEnd(): void {
        const success = this._arena!.setObject(this.id, this.target)
        if (success) {
            this.rect = this.target
            this.node.rect = this.target
        }
    }

    public onMoveFinished(): void {
        this._moving = false
        this.target = this.rect
        this.core!.renderAll()
    }

    public onMoving(oldPos: Point, newPos: Point): boolean {
        const occupied = this._arena!.rectOccupied(this.target, this.id, true)
        return occupied === null
    }
}