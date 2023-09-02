<template>
    <canvas id="scene" width="1000" height="800"></canvas>
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import LogicCore from "../logic/core"
import LogicLayer from "../logic/layers/layer"
import { Point, Rect } from "@/common/types2D"
import { uid_rt, uid2hex, hex2uid, arr2uid } from "@/common/uid"

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

class TestLayer extends LogicLayer {
    public onReloc(ctx: CanvasRenderingContext2D): boolean {
        const rect = Rect.fromLTWH(10, 10, 4, 4)
        const rectPos = new Rect(this.core!.crd2pos(rect.pos), rect.size.times(this.core!.logicWidth)).float()
        ctx.strokeStyle = "#ff0000"
        ctx.lineWidth = 3
        ctx.strokeRect(rectPos.left, rectPos.top, rectPos.width, rectPos.height)
        const id = uid_rt()
        const c = uid2hex(id)
        ctx.fillStyle = c
        console.log(id, c, hex2uid(c))
        ctx.fillRect(rectPos.left, rectPos.top, rectPos.width, rectPos.height)
        const data = ctx.getImageData(rectPos.left + 1, rectPos.top + 1, 1, 1).data
        console.log(data, arr2uid(data))
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

</script>../common/types2D../common/uid