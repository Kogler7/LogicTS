import { createApp } from 'vue' //引入工厂函数
import { draggable, sizeable } from './utils/directives'
import './style.css'
import App from './App.vue'

let app = createApp(App);

app.directive('sizeable', sizeable);
app.directive('draggable', draggable);

app.config.warnHandler = (msg, vm, trace) => {
    // `trace` 是组件的继承关系追踪
    if (msg.includes('Missing required prop')) {
        return null; //忽略未传参数警告
    }
    // return null; // 阻止 vue 在控制台输出警告
}

app.mount('#app');