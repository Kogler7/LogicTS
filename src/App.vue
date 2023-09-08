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
import LogicCore from "./logic/core"
import LogicLayer from "./logic/layer"
import { Point } from "@/logic/common/types2D"
import { uid } from "@/logic/common/uid"
import FrameLayer from "@/layers/frame"
import ScalarLayer from "@/layers/scalar"
import MeshLayer from "@/layers/mesh"
import SelectLayer from "@/layers/select"
import MoveObjectLayer from "@/layers/move"
import Component from "@/objects/comp"


class TestLayer extends LogicLayer {
    private _comps = new Map<uid, Component>()

    public addComponent(comp: Component): TestLayer {
        this._comps.set(comp.id, comp)
        return this
    }

    public onCache(ctx: CanvasRenderingContext2D): boolean {
        for (const comp of this._comps.values()) {
            comp.renderOn(ctx)
        }
        return true
    }
}

onMounted(() => {
    const scene = document.getElementById("scene") as HTMLCanvasElement
    const core = new LogicCore()

    const frameLayer = new FrameLayer('frame', 2)
    const scalarLayer = new ScalarLayer('scalar', 4)
    const meshLayer = new MeshLayer('mesh', -1)
    const selectLayer = new SelectLayer('select', 1)
    const moveLayer = new MoveObjectLayer('move', 3)
    const testLayer = new TestLayer('test', 0)

    core.connect(scene)

    core.mount(frameLayer)
    core.mount(scalarLayer)
    core.mount(meshLayer)
    core.mount(selectLayer)
    core.mount(moveLayer)
    core.mount(testLayer)

    const c1 = new Component(new Point(10, 5))
    const c2 = new Component(new Point(25, 10))
    const c3 = new Component(new Point(5, 20))
    const c4 = new Component(new Point(20, 25))
    const c5 = new Component(new Point(15, 15))
    testLayer.addComponent(c1)
    testLayer.addComponent(c2)
    testLayer.addComponent(c3)
    testLayer.addComponent(c4)
    testLayer.addComponent(c5)

    core.register(c1)
    core.register(c2)
    core.register(c3)
    core.register(c4)
    core.register(c5)

    console.log(core)
    // core.render()
})

</script>
