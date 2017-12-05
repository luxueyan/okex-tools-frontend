<template lang="pug">
  section.index-section
    line-chart(chart-option="")
</template>

<script>
import LineChart from '@/components/LineChart.vue'
import { coinMenus } from '@/common/api/index.js'

export default {
  components: {
    LineChart
  },

  methods: {
    async _fetchData() {
      const menus = await coinMenus.get()
      console.log(menus)
    }
  },

  mounted() {

  }
}
</script>
