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
import { Point, Rect, Size } from "@/logic/common/types2D"
import Component from "@/objects/comp"
import TextArea from "@/objects/text"
import Designer from "./designer"
import RenderNode from "./models/node"
import RenderPort, { PortType, PortAspect } from "./models/port"
import { uid_rt } from "./logic/common/uid"

const testStr = 'Once upon a time, 在远古村庄中, lived a clever little fox named Lily. Their friendship taught them that with kindness and determination, anything is possible. 故事完美落幕，他们的友谊将永远闪耀在心中。'

onMounted(() => {
    const scene = document.getElementById("scene") as HTMLCanvasElement

    scene.style.width = window.innerWidth - 20 + 'px'
    scene.style.height = window.innerHeight - 20 + 'px'

    const designer = new Designer(scene)
    const core = designer.core

    const c1 = new Component(
        new RenderNode(
            uid_rt(),
            new Rect(new Point(10, 5), new Size(4, 4)),
            [
                new RenderPort(2, PortType.IN, PortAspect.LEFT),
                new RenderPort(2, PortType.OUT, PortAspect.RIGHT),
            ],
            '',
            'ring'
        )
    )
    const c2 = new Component(
        new RenderNode(
            uid_rt(),
            new Rect(new Point(25, 10), new Size(4, 4)),
            [
                new RenderPort(2, PortType.IN, PortAspect.LEFT),
                new RenderPort(1, PortType.OUT, PortAspect.RIGHT),
                new RenderPort(3, PortType.OUT, PortAspect.RIGHT),
            ],
            '',
            'ring'
        )
    )
    const c3 = new Component(
        new RenderNode(
            uid_rt(),
            new Rect(new Point(5, 20), new Size(4, 4)),
            [
                new RenderPort(1, PortType.IN, PortAspect.LEFT),
                new RenderPort(3, PortType.IN, PortAspect.LEFT),
                new RenderPort(2, PortType.OUT, PortAspect.RIGHT),
            ],
            '',
            'ring'
        )
    )
    const c4 = new Component(
        new RenderNode(
            uid_rt(),
            new Rect(new Point(20, 25), new Size(4, 4)),
            [
                new RenderPort(2, PortType.IN, PortAspect.LEFT),
                new RenderPort(2, PortType.OUT, PortAspect.RIGHT),
            ],
            '',
            'ring'
        )
    )
    const c5 = new Component(
        new RenderNode(
            uid_rt(),
            new Rect(new Point(15, 15), new Size(4, 4)),
            [
                new RenderPort(2, PortType.IN, PortAspect.LEFT),
                new RenderPort(2, PortType.OUT, PortAspect.RIGHT),
            ],
            '',
            'ring'
        )
    )
    const t1 = new TextArea(Rect.fromLTWH(30, 20, 16, 8), testStr, {
        size: 16,
        color: 'red',
    })

    designer.addComponent(c1)
    designer.addComponent(c2)
    designer.addComponent(c3)

    core.switchMemory(core.createMemory())

    designer.addComponent(c4)
    designer.addComponent(c5)

    core.switchMemory(core.createMemory())

    designer.addComponent(t1)

    console.log(core)

    window.addEventListener('resize', () => {
        scene.style.width = window.innerWidth - 20 + 'px'
        scene.style.height = window.innerHeight - 20 + 'px'
    })

    core.on('keydown.tab', () => {
        core.switchMemoryToNext()
    })

    core.focus()

    console.log(core.listAllScopedEvents())
    console.log(core.listAllStackedEvents())
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
