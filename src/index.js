import Selektor from './Selektor.vue'

export default {
    install(Vue, options = {}) {
        Vue.component(options.componentName || 'Selektor', Selektor);
    }
};
