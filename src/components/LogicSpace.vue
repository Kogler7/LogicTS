<template>
    <canvas id="scene" width="1000" height="800"></canvas>
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import LogicCore from "../logic/core"
import LogicLayer from "../logic/layer"

class Layer extends LogicLayer {
    constructor() {
        super()
    }

    public onReloc(ctx: CanvasRenderingContext2D): boolean {
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, 1000, 800)
        return true
    }

    public onPaint(ctx: CanvasRenderingContext2D): boolean {
        // 绘制边框
        ctx.strokeStyle = "#ff0000"
        ctx.lineWidth = 10
        ctx.strokeRect(0, 0, 1000, 800)
        return true
    }
}

onMounted(() => {
    const scene = document.getElementById("scene") as HTMLCanvasElement
    const core = new LogicCore()
    core.connect(scene)
    const layer = new Layer()
    core.mount(layer)
    core.render()
})

</script>