<template>
    <canvas id="scene" width="1000" height="800"></canvas>
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import LogicCore from "../logic/core"
import LogicLayer from "../logic/layers/layer"
import { Point, Rect } from "../logic/common/types2D"

class FrameLayer extends LogicLayer {
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
        const topPlateRect = Rect.fromLTRB(
            this._plateWidth,
            0,
            this.core!.stageWidth,
            this._plateWidth
        )
        const leftPlateRect = Rect.fromLTRB(
            0,
            this._plateWidth,
            this._plateWidth,
            this.core!.stageHeight
        )
        ctx.lineWidth = 1
        ctx.strokeStyle = "rgba(232, 232, 232, 1)"
        ctx.beginPath()
        ctx.moveTo(topPlateRect.left, topPlateRect.top)
        ctx.lineTo(topPlateRect.left, topPlateRect.bottom)
        ctx.lineTo(topPlateRect.right, topPlateRect.bottom)
        ctx.lineTo(topPlateRect.right, topPlateRect.top)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(leftPlateRect.left, leftPlateRect.top)
        ctx.lineTo(leftPlateRect.right, leftPlateRect.top)
        ctx.lineTo(leftPlateRect.right, leftPlateRect.bottom)
        ctx.lineTo(leftPlateRect.left, leftPlateRect.bottom)
        ctx.stroke()
        return true
    }
}

class TestLayer extends LogicLayer {
    public onReloc(ctx: CanvasRenderingContext2D): boolean {
        const rect = Rect.fromLTWH(10, 10, 4, 4)
        const rectPos = new Rect(this.core!.crd2pos(rect.pos), rect.size.times(this.core!.logicWidth)).float()
        ctx.strokeStyle = "#ff0000"
        ctx.lineWidth = 3
        ctx.strokeRect(rectPos.left, rectPos.top, rectPos.width, rectPos.height)
        return true
    }
}

onMounted(() => {
    const scene = document.getElementById("scene") as HTMLCanvasElement
    const core = new LogicCore()
    const frameLayer = new FrameLayer('frame', 2)
    const scalarLayer = new ScalarLayer('scalar', 3)
    const meshLayer = new MeshLayer('mesh', -1)
    const testLayer = new TestLayer('test', 1)
    core.mount(frameLayer)
    core.mount(scalarLayer)
    core.mount(meshLayer)
    core.mount(testLayer)
    core.connect(scene)
    console.log(core)
    // core.render()
})

</script>