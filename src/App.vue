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
* Original Author: Zhenjie Wei
* Created: Jul. 20, 2023
* Supported by: National Key Research and Development Program of China
* 
* Remake: Jiaxuan Han
* Date: Apr. 12, 2025
* Tip: Add test graph by dividing nodes.
-->

<template>
    <canvas id="scene"></canvas>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { Point, Rect, Size } from '@/logic/common/types2D'
import Component from '@/objects/comp'
import TextArea from '@/objects/text'
import Designer from './designer'
import RenderNode from './models/node'
import RenderPort, { PortType, PortAspect } from './models/port'
import { uid_rt } from './logic/common/uid'

const testStr =
    'Once upon a time, 在远古村庄中, lived a clever little fox named Lily. Their friendship taught them that with kindness and determination, anything is possible. 故事完美落幕，他们的友谊将永远闪耀在心中。'

const dataNodeStyle = {
    size: 20,
    color: 'blue'
}
const actionNodeStyle = {
    size: 20,
    color: 'purple'
}
const subGraphNodeStyle = {
    size: 30,
    color: 'orange'
}

onMounted(() => {
    const scene = document.getElementById('scene') as HTMLCanvasElement

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
            'arc',
        ),
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
            'ring',
        ),
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
            'fiber',
        ),
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
            'Mzi',
        ),
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
            'sbend',
        ),
    )

    var dn1 = new TextArea(Rect.fromLTWH(4, 4, 2, 2), "w", dataNodeStyle)
    var dn2 = new TextArea(Rect.fromLTWH(8, 4, 2, 2), "x", dataNodeStyle)
    var dn3 = new TextArea(Rect.fromLTWH(12, 4, 2, 2), "b", dataNodeStyle)
    var dn4 = new TextArea(Rect.fromLTWH(16, 4, 2, 2), "y", dataNodeStyle)
    var dn5 = new TextArea(Rect.fromLTWH(20, 4, 2, 2), "η", dataNodeStyle)

    var an_s1 = new TextArea(Rect.fromLTWH(4, 8, 3, 3), "sub", actionNodeStyle)
    var an_s2 = new TextArea(Rect.fromLTWH(8, 8, 3, 3), "sub", actionNodeStyle)
    var an_s3 = new TextArea(Rect.fromLTWH(12, 8, 3, 3), "sub", actionNodeStyle)
    var an_a = new TextArea(Rect.fromLTWH(8, 12, 3, 3), "add", actionNodeStyle)
    var an_m1 = new TextArea(Rect.fromLTWH(4, 16, 3, 3), "mul", actionNodeStyle)
    var an_m2 = new TextArea(Rect.fromLTWH(8, 16, 3, 3), "mul", actionNodeStyle)
    var an_m3 = new TextArea(Rect.fromLTWH(12, 16, 3, 3), "mul", actionNodeStyle)
    var an_m4 = new TextArea(Rect.fromLTWH(16, 16, 3, 3), "mul", actionNodeStyle)


    const t1 = new Component(
        new RenderNode(
            uid_rt(),
            Rect.fromLTWH(30, 30, 4, 4),
            [
                new RenderPort(2, PortType.IN, PortAspect.BOTTOM),
                new RenderPort(2, PortType.OUT, PortAspect.RIGHT),
            ],
            '',
            'sbend',
        ),
    )
    
    var sn1 = new TextArea(Rect.fromLTWH(10, 20, 4, 4), "L", subGraphNodeStyle)
    
    
    designer.addComponent(c1)
    designer.addComponent(c2)
    designer.addComponent(c3)

    core.switchMemory(core.createMemory())

    designer.addComponent(c4)
    designer.addComponent(c5)
    designer.addComponent(t1)

    core.switchMemory(core.createMemory())

    designer.addComponent(dn1)
    designer.addComponent(dn2)
    designer.addComponent(dn3)
    designer.addComponent(dn4)
    designer.addComponent(dn5)

    designer.addComponent(an_s1)
    designer.addComponent(an_s2)
    designer.addComponent(an_s3)
    designer.addComponent(an_a)
    designer.addComponent(an_m1)
    designer.addComponent(an_m2)
    designer.addComponent(an_m3)
    designer.addComponent(an_m4)

    designer.addComponent(sn1)

    let layout = [
        [dn2, dn1, an_s1, an_s2],
        [an_m1, dn3, an_m2, an_m3, dn5],
        [an_a, dn4, an_m4],
        [sn1, an_s3]
    ]

    designer.reCalcLocate(layout)

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
