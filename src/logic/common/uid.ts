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
    const startOfHour = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours()
    )
    const time = now.getTime() - startOfHour.getTime()
    const id = time * 0xf9 + _uid_cnt++ + 1e8
    if (_uid_set.has(id)) {
        // in case of collision, try again
        return uid_rt()
    } else {
        _uid_set.add(id)
        console.log('uid_rt', id)
        return id
    }
}

export function uid_color(): uid {
    const id = Math.round(uid_rt() / 100)
    if (_uid_set.has(id)) {
        // in case of collision, try again
        return uid_color()
    } else {
        _uid_set.add(id)
        console.log('uid_color', id)
        return id
    }
}

export function uid_add(id: uid) {
    _uid_set.add(id)
}

export function uid_del(id: uid) {
    _uid_set.delete(id)
}

export function uid_cnt(): uid {
    return _uid_cnt++
}

export function uid_chk(id: uid): boolean {
    return _uid_set.has(id)
}

export function uid2hex(id: uid): string {
    return '#' + id.toString(16).padStart(6, '0')
}

export function hex2uid(hex: string): uid {
    return parseInt(hex.substring(1), 16)
}

export function uid2arr(id: uid): Uint8ClampedArray {
    _dataView.setUint32(0, id, false)
    return new Uint8ClampedArray(_buffer)
}

export function arr2uid(arr: Uint8ClampedArray): uid {
    const R = arr[0]
    const G = arr[1]
    const B = arr[2]
    const newArr = new Uint8ClampedArray([0, R, G, B])
    return new DataView(newArr.buffer).getUint32(0, false)
}
