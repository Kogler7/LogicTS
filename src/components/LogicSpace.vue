<template>
    <canvas id="scene" width="1000" height="800"></canvas>
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import LogicCore from "../logic/core"
import LogicLayer from "../logic/layers/layer"

class Layer extends LogicLayer {
    constructor(name: string) {
        super(name)
    }

    public onMount() {
        console.log("layer mounted")
        this.core?.on("reloc", true, () => {
            console.log("layer update")
        })
    }

    public onReloc(ctx: CanvasRenderingContext2D): boolean {
        ctx.strokeStyle = "#ff0000"
        ctx.lineWidth = 10
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
        ctx.font = "24px Arial"
        ctx.fillStyle = "#ff0000"
        ctx.fillText(this.core!.fps, 30, 50)
        return true
    }
}

onMounted(() => {
    const scene = document.getElementById("scene") as HTMLCanvasElement
    const core = new LogicCore()
    const layer = new Layer('layer')
    core.mount(layer)
    core.connect(scene)
    // core.render()
})

</script>../logic/layers/layer