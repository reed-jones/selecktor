import Vue from "vue";
import App from "./App.vue";

import Selektor from '../src'
Vue.use(Selektor)

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount("#app");
