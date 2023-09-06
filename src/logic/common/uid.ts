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
* Created: Aug. 21, 2023
* Supported by: National Key Research and Development Program of China
*/

export type uid = number

let _uid_cnt = 0
const _uid_set = new Set<uid>()
const _buffer = new ArrayBuffer(4)
const _dataView = new DataView(_buffer)

export function uid_rt(): uid {
    // Generate an unique identifier (UID) that is guaranteed to be unique within a single runtime
    const now = new Date()
    const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
    const time = now.getTime() - startOfHour.getTime()
    const id = time * 0xF9 + _uid_cnt++ + 1e8
    if (_uid_set.has(id)) {
        // in case of collision, try again
        return uid_rt()
    } else {
        _uid_set.add(id)
        return id
    }
}

export function uid_cnt(): uid {
    return _uid_cnt++
}

export function uid2hex(id: uid): string {
    return '#' + id.toString(16).padStart(8, '0')
}

export function hex2uid(hex: string): uid {
    return parseInt(hex.substring(1), 16)
}

export function uid2arr(id: uid): Uint8ClampedArray {
    _dataView.setUint32(0, id, false)
    return new Uint8ClampedArray(_buffer)
}

export function arr2uid(arr: Uint8ClampedArray): uid {
    return new DataView(arr.buffer).getUint32(0, false)
}