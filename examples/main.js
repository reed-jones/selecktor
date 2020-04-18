import Vue from "vue";
import App from "./App.vue";

// prod
// import Selektor from '..'
// import Selektor from '../dist/selektor.esm.js'
import '../dist/selektor.css'

// dev
import Selektor from '../src'

Vue.use(Selektor)

Vue.config.productionTip = false;

new Vue({
  render: h => h(App)
}).$mount("#app");
