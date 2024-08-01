/**
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
 * Created: Oct. 13, 2023
 * Supported by: National Key Research and Development Program of China
 */

import RenderPair from './pair'
import { IHashable, hash } from '@/logic/common/types'

export default class RenderLink implements IHashable {
    public id: number
    public srcPair: RenderPair
    public dstPair: RenderPair

    constructor(id: number, srcPair: RenderPair, dstPair: RenderPair) {
        this.id = id
        this.srcPair = srcPair
        this.dstPair = dstPair
    }
    get hash(): hash {
        return this.srcPair.hash + this.dstPair.hash
    }

    public get srcNodeId(): number {
        return this.srcPair.node.id
    }

    public get dstNodeId(): number {
        return this.dstPair.node.id
    }

    public get srcPortId(): number {
        return this.srcPair.port.id
    }

    public get dstPortId(): number {
        return this.dstPair.port.id
    }

    public get object() {
        return {
            linkId: this.id,
            srcNodeId: this.srcNodeId,
            srcPortId: this.srcPortId,
            dstNodeId: this.dstNodeId,
            dstPortId: this.dstPortId,
        }
    }
}
