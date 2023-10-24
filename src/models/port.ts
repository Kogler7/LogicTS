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
* Created: Oct. 24, 2023
* Supported by: National Key Research and Development Program of China
*/

import { Direction } from "@/logic/common/types2D"
import { IComparable } from "@/logic/common/types"
import { uid_rt } from "@/logic/common/uid"

export enum PortType {
    IN = 0,
    OUT = 1
}

export enum PortAspect {
    LEFT = 0,
    RIGHT = 1,
    TOP = 2,
    BOTTOM = 3
}

export default class RenderPort implements IComparable {
    public id: number
    // port location, indicate the logical bias of the port
    // from the top-left point of the element node
    public loc: number
    // port type, in or out
    public typ: PortType
    // which aspect is the port located at
    public asp: PortAspect
    public connected = false

    public get dir() {
        switch (this.asp) {
            case PortAspect.LEFT:
                return Direction.LEFT
            case PortAspect.RIGHT:
                return Direction.RIGHT
            case PortAspect.TOP:
                return Direction.UP
            case PortAspect.BOTTOM:
                return Direction.DOWN
        }
    }

    constructor(
        loc: number,
        typ: PortType,
        asp: PortAspect,
        id: number | null = null,
        connected = false
    ) {
        this.loc = loc
        this.typ = typ
        this.asp = asp
        this.connected = connected
        this.id = id || uid_rt()
    }

    equals(other: RenderPort) {
        return this.typ === other.typ &&
            this.loc === other.loc &&
            this.asp === other.asp
    }
}