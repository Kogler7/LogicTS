export function addEvent(el: HTMLElement | any, event: any, handler: Function) {
    if (!el) {
        return
    }
    el.addEventListener(event, handler, true)
}

export function removeEvent(el: HTMLElement | any, event: any, handler: Function) {
    if (!el) {
        return
    }
    if (el.detachEvent) {
        el.detachEvent('on' + event, handler)
    } else if (el.removeEventListener) {
        el.removeEventListener(event, handler, true)
    } else {
        el['on' + event] = null
    }
}