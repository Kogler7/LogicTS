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
    const layer = new Layer('layer')
    core.mount(layer)
    core.connect(scene)
    // core.render()
})

</script>../logic/layers/layer