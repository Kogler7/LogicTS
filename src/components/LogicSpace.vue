<!--
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
* Created: Jul. 20, 2023
* Supported by: National Key Research and Development Program of China
-->

<template>
    <canvas id="scene" width="1000" height="800"></canvas>
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import LogicCore from "../logic/core"
import LogicLayer from "../logic/layers/layer"
import { Point, Rect, Size } from "@/logic/common/types2D"
import { uid_rt, uid2hex, hex2uid, arr2uid, uid } from "@/logic/common/uid"
import { Selectable } from "@/logic/mixins/selectable"
import { IRenderable } from "@/logic/mixins/renderable"
import { Movable } from "@/logic/mixins/movable"

class FrameLayer extends LogicLayer {
    public onMount(): void {
        this.level = 3
    }

    public onReloc(ctx: CanvasRenderingContext2D): boolean {
        ctx.strokeStyle = "#ff0000"
        ctx.lineWidth = 2
        ctx.strokeRect(0, 0, 1000, 800)
        return true
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        // 绘制边框
        const rect = this.core?.focusRect?.float()
        if (rect) {
            ctx.fillStyle = "rgba(200, 200, 255, 0.1)"
            ctx.fillRect(rect.left, rect.top, rect.width, rect.height)
            ctx.strokeStyle = "rgba(200, 200, 255, 0.5)"
            ctx.lineWidth = 1
            ctx.strokeRect(rect.left, rect.top, rect.width, rect.height)
        }
        // 写一行字
        ctx.font = "16px Arial"
        ctx.fillStyle = "#ff0000"
        const text = `level: ${this.core!.zoomLevel}; ` + this.core!.fps
        ctx.fillText(text, 40, 50)
        return true
    }
}

class MeshLayer extends LogicLayer {
    private _showBaseLines: boolean = true

    public onMount() {
        this.core?.on("reloc.begin", true, () => {
            this._showBaseLines = false
        })
        this.core?.on("reloc.end", true, () => {
            this._showBaseLines = true
        })
    }

    public onReloc(ctx: CanvasRenderingContext2D): boolean {
        const origin = new Point(0, 0)
        // draw mesh
        const { stageWidth, stageHeight, gridWidth, levelUpFactor } = this.core!
        // console.log(gridWidth)
        let startPos = this.core!.crd2pos(origin).mod(gridWidth).float()
        // draw base lines
        if (this._showBaseLines) {
            ctx.beginPath()
            ctx.strokeStyle = "rgba(200, 200, 200, 0.2)"
            ctx.lineWidth = 1
            for (let x = startPos.x; x < stageWidth; x += gridWidth) {
                ctx.moveTo(x, 0)
                ctx.lineTo(x, stageHeight)
            }
            for (let y = startPos.y; y < stageHeight; y += gridWidth) {
                ctx.moveTo(0, y)
                ctx.lineTo(stageWidth, y)
            }
            ctx.stroke()
        }
        // draw locating lines
        ctx.beginPath()
        ctx.strokeStyle = "rgba(200, 200, 200, 0.5)"
        ctx.lineWidth = 1
        const step = gridWidth * levelUpFactor
        startPos = this.core!.crd2pos(origin).mod(step).float()
        for (let x = startPos.x; x < stageWidth; x += step) {
            ctx.moveTo(x, 0)
            ctx.lineTo(x, stageHeight)
        }
        for (let y = startPos.y; y < stageHeight; y += step) {
            ctx.moveTo(0, y)
            ctx.lineTo(stageWidth, y)
        }
        ctx.stroke()
        return true
    }
}

class ScalarLayer extends LogicLayer {
    private _plateWidth: number = 20

    public onReloc(ctx: CanvasRenderingContext2D): boolean {
        ctx.font = "14px Arial"
        ctx.fillStyle = "rgba(100, 100, 100, 1)"
        const offset = 10
        const { gridWidth, levelUpFactor, originBias: origin, logicWidth } = this.core!
        const step = gridWidth * levelUpFactor
        const startPos = this.core!.crd2pos(new Point(0, 0)).mod(step).float()
        for (let x = startPos.x; x < this.core!.stageWidth; x += step) {
            const text = Math.floor(x / logicWidth - origin.x).toString()
            ctx.fillText(text, x + offset, offset * 2)
        }
        for (let y = startPos.y; y < this.core!.stageHeight; y += step) {
            const text = Math.floor(y / logicWidth - origin.y).toString()
            ctx.fillText(text, offset, y + offset * 2)
        }
        return true
    }
}

class SelectLayer extends LogicLayer {
    private _cache: CanvasRenderingContext2D | null = null
    public onMount(): void {
        const core = this.core!
        this.level = 2
        const cornerSize = 6
        const halfCorner = cornerSize / 2
        this._cache = core.createCache()
        this._cache.strokeStyle = "#364fc7"
        this._cache.lineWidth = 1
        const onChanged = (() => {
            this._cache!.clearRect(0, 0, core.stageWidth, core.stageHeight)
            const rects = [...core.selectedLogicObjects]
                .map(obj => core.crd2posRect(obj.rect).padding(cornerSize).float())
            if (rects.length > 0) {
                this._cache?.setLineDash([])
                for (const r of rects) {
                    if (core.zoomLevel < 2) {
                        this._cache?.strokeRect(...r.ltwh)
                    }
                }
                // draw four corners
                const boundRect = core.crd2posRect(core.selectedLogicBoundRect).padding(cornerSize).float()
                const corners = boundRect.padding(halfCorner).vertices
                for (const corner of corners) {
                    const cornerRect = new Rect(
                        corner.minus(new Point(halfCorner, halfCorner)),
                        new Size(cornerSize, cornerSize)
                    )
                    this._cache?.strokeRect(...cornerRect.ltwh)
                }
                this._cache?.setLineDash([5, 5])
                this._cache?.strokeRect(...boundRect.ltwh)
            }
            core.render()
        }).bind(this)
        core.on("select.logic-changed", true, onChanged)
        core.on("reloc", true, onChanged)
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        const { stageWidth, stageHeight } = this.core!
        ctx.drawImage(this._cache!.canvas, 0, 0, stageWidth, stageHeight)
        return true
    }
}

class Component extends Movable implements IRenderable {
    constructor(pos: Point = Point.zero()) {
        super(uid_rt(), 0, new Rect(pos, new Size(4, 4)))
    }

    public render(ctx: CanvasRenderingContext2D): boolean {
        const renderRect = this.core!.crd2posRect(this.rect).float()
        const color = uid2hex(this.id)
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 3
        ctx.strokeRect(...renderRect.ltwh)
        ctx.fillStyle = color
        ctx.fillRect(...renderRect.ltwh)
        return true
    }

    public onSelected(): void {
        console.log("selected", this.id)
    }

    public onDeselected(): void {
        console.log("deselected", this.id)
    }

    public onRegistered(core: LogicCore): void {
        super.onRegistered(core)
        console.log("registered", this.id)
    }
}

class TestLayer extends LogicLayer {
    private _comps = new Map<uid, Component>()

    public addComponent(comp: Component): TestLayer {
        this._comps.set(comp.id, comp)
        return this
    }

    public onReloc(ctx: CanvasRenderingContext2D): boolean {
        for (const comp of this._comps.values()) {
            comp.render(ctx)
        }
        return true
    }
}

onMounted(() => {
    const scene = document.getElementById("scene") as HTMLCanvasElement
    const core = new LogicCore()

    const frameLayer = new FrameLayer('frame', 2)
    const scalarLayer = new ScalarLayer('scalar', 3)
    const meshLayer = new MeshLayer('mesh', -1)
    const selectLayer = new SelectLayer('select', 0)
    const testLayer = new TestLayer('test', 1)

    core.connect(scene)

    core.mount(frameLayer)
    core.mount(scalarLayer)
    core.mount(meshLayer)
    core.mount(selectLayer)
    core.mount(testLayer)

    const c1 = new Component(new Point(10, 5))
    const c2 = new Component(new Point(25, 10))
    const c3 = new Component(new Point(5, 20))
    const c4 = new Component(new Point(20, 25))
    testLayer.addComponent(c1)
    testLayer.addComponent(c2)
    testLayer.addComponent(c3)
    testLayer.addComponent(c4)

    core.register(c1)
    core.register(c2)
    core.register(c3)
    core.register(c4)

    console.log(core)
    // core.render()
})

</script>