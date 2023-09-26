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
    <canvas id="scene"></canvas>
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import LogicCore from "./logic/core"
import LogicLayer from "./logic/layer"
import { Point, Rect } from "@/logic/common/types2D"
import FrameLayer from "@/layers/frame"
import ScalarLayer from "@/layers/scalar"
import MeshLayer from "@/layers/mesh"
import SelectLayer from "@/layers/select"
import MoveObjectLayer from "@/layers/move"
import ResizeObjectLayer from "@/layers/resize"
import Component from "@/objects/comp"
import TextArea from "@/objects/text"
import IRenderable from "./logic/mixins/renderable"


class CompLayer extends LogicLayer {
    private _comps: Set<IRenderable> = new Set()

    public onMounted(core: LogicCore): void {
        core.malloc('comps', this, { _comps: 1 })
    }

    public addComponent(comp: IRenderable): CompLayer {
        this._comps.add(comp)
        return this
    }

    public onCache(ctx: CanvasRenderingContext2D): boolean {
        for (const comp of this._comps.values()) {
            comp.renderOn(ctx)
        }
        return true
    }
}

const testStr = 'Once upon a time, 在远古村庄中, lived a clever little fox named Lily. Their friendship taught them that with kindness and determination, anything is possible. 故事完美落幕，他们的友谊将永远闪耀在心中。'

onMounted(() => {
    const scene = document.getElementById("scene") as HTMLCanvasElement

    scene.style.width = window.innerWidth - 20 + 'px'
    scene.style.height = window.innerHeight - 20 + 'px'

    const core = new LogicCore()

    const frameLayer = new FrameLayer('frame', 2)
    const scalarLayer = new ScalarLayer('scalar', 4)
    const meshLayer = new MeshLayer('mesh', -1)
    const selectLayer = new SelectLayer('select', 1)
    const moveLayer = new MoveObjectLayer('move', 3)
    const resizeLayer = new ResizeObjectLayer('resize', 3)
    const compLayer = new CompLayer('test', 0)

    core.connect(scene)

    core.mount(frameLayer)
    core.mount(scalarLayer)
    core.mount(meshLayer)
    core.mount(selectLayer)
    core.mount(moveLayer)
    core.mount(resizeLayer)
    core.mount(compLayer)

    const c1 = new Component(new Point(10, 5))
    const c2 = new Component(new Point(25, 10))
    const c3 = new Component(new Point(5, 20))
    const c4 = new Component(new Point(20, 25))
    const c5 = new Component(new Point(15, 15))
    const t1 = new TextArea(Rect.fromLTWH(30, 20, 16, 8), testStr, {
        size: 16,
        color: 'red',
    })
    compLayer.addComponent(c1)
    compLayer.addComponent(c2)
    compLayer.addComponent(c3)
    core.register(c1)
    core.register(c2)
    core.register(c3)

    core.switchMemory(core.createMemory())

    compLayer.addComponent(c4)
    compLayer.addComponent(c5)

    core.register(c4)
    core.register(c5)

    core.switchMemory(core.createMemory())

    compLayer.addComponent(t1)
    core.register(t1)

    console.log(core)
    // core.render()

    window.addEventListener('resize', () => {
        scene.style.width = window.innerWidth - 20 + 'px'
        scene.style.height = window.innerHeight - 20 + 'px'
    })

    core.on('keydown.ctrl.s', () => {
        core.switchMemoryToNext()
    })
})

</script>

<style scoped>
#scene {
    position: absolute;
    top: 10px;
    left: 10px;
    width: 100%;
    height: 100%;
}
</style>
