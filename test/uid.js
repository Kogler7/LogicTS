let _uid_cnt = 0
let _time_bias = 0
const _uid_set = new Set()

let _counter = 0

function uid_rt() {
    const now = new Date()
    const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
    const time = now.getTime() - startOfHour.getTime() + _time_bias
    const id = time * 0xF9 + _uid_cnt++ + 1e8
    if (_uid_set.has(id)) {
        // in case of collision, try again
        // _time_bias++
        _counter++
        return uid_rt()
    } else {
        _uid_set.add(id)
        return id
    }
}

function testFunction() {
    return uid_rt()
}

function measureExecutionTime(callback, iterations) {
    const startTime = performance.now()

    for (let i = 0; i < iterations; i++) {
        callback()
    }

    const endTime = performance.now()
    const totalTime = endTime - startTime
    const averageTime = totalTime / iterations

    console.log(`总共执行时间：${totalTime.toFixed(8)} 毫秒`)
    console.log(`平均执行时间：${averageTime.toFixed(8)} 毫秒`)
}

const iterations = 1000000 // 调用次数，可以根据需要进行调整
// const iterations = 30000 // 调用次数，可以根据需要进行调整

measureExecutionTime(testFunction, iterations)
console.log(_counter, _time_bias, _uid_cnt)