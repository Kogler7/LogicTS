<template>
    <canvas id="scene" width="1000" height="800"></canvas>
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import LogicCore from "../logic/core"
import LogicLayer from "../logic/layers/layer"
import { Rect } from "../logic/common/types2D"

class FrameLayer extends LogicLayer {
    constructor(name: string) {
        super(name)
    }

    public onMount() {
        console.log("layer mounted")
    }

    public onReloc(ctx: CanvasRenderingContext2D): boolean {
        ctx.strokeStyle = "#ff0000"
        ctx.lineWidth = 2
        ctx.strokeRect(0, 0, 1000, 800)
        return true
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        // 绘制边框
        const rect = this.core?.focusRect
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
        ctx.fillText(text, 20, 30)
        return true
    }
}

class MeshLayer extends LogicLayer {
    private _showBaseLines: boolean = true

    constructor(name: string) {
        super(name)
    }

    public onMount() {
        this.core?.on("drag.begin", true, () => {
            this._showBaseLines = true
        })
        this.core?.on("drag.end", true, () => {
            this._showBaseLines = true
        })
    }

    public onReloc(ctx: CanvasRenderingContext2D): boolean {
        let rect = Rect.fromLTWH(10, 10, 4, 4)
        rect = new Rect(this.core!.crd2pos(rect.pos), rect.size.times(this.core!.loginLength))
        ctx.strokeStyle = "#ff0000"
        ctx.lineWidth = 2
        ctx.strokeRect(rect.left, rect.top, rect.width, rect.height)
        // draw mesh
        const { loginOrigin: origin, stageWidth, stageHeight, gridWidth, levelUpFactor } = this.core!
        console.log(gridWidth)
        const startPos = this.core!.crd2pos(origin).mod(gridWidth)
        // const originPos = this.core!.crd2pos(origin)
        // const startPos = originPos.minus(originPos.divide(gridWidth).floor().times(gridWidth))
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
        // ctx.beginPath()
        // ctx.strokeStyle = "rgba(200, 200, 200, 0.5)"
        // ctx.lineWidth = 1
        // const step = gridWidth * levelUpFactor
        // for (let x = startPos.x; x < stageWidth; x += step) {
        //     ctx.moveTo(x, 0)
        //     ctx.lineTo(x, stageHeight)
        // }
        // for (let y = startPos.y; y < stageHeight; y += step) {
        //     ctx.moveTo(0, y)
        //     ctx.lineTo(stageWidth, y)
        // }
        // ctx.stroke()
        return true
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        return true
    }
}

onMounted(() => {
    const scene = document.getElementById("scene") as HTMLCanvasElement
    const core = new LogicCore()
    const frameLayer = new FrameLayer('layer')
    const meshLayer = new MeshLayer('mesh')
    core.mount(frameLayer)
    core.mount(meshLayer)
    core.connect(scene)
    // core.render()
})

</script>../logic/layers/layer