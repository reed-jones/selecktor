import Selektor from './Selektor'

export default {
    install(Vue, options = {}) {
        Vue.component(options.componentName || 'Selektor', Selektor);
    }
};
