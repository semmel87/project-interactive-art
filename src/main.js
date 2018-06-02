import Vue from 'vue'
import App from './App.vue'
import 'vuetify/dist/vuetify.min.css' // Ensure you are using css-loader
import 'animate.css/animate.min.css';

new Vue({
  el: '#app',
  render: h => h(App)
});
