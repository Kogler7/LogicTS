export type uid = number

let _uid_cnt = 0
const _buffer = new ArrayBuffer(4)
const _dataView = new DataView(_buffer)

export function uid_rt(): uid {
    const now = new Date()
    const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
    const time = now.getTime() - startOfHour.getTime()
    return time * 0xF9 + _uid_cnt++ % 0xF9 + 1e8
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