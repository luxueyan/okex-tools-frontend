<template lang="pug">
  .line-echart(ref="lineEchart")
</template>

<script>
import echarts from 'echarts/lib/echarts'
import {
  merge
} from 'lodash'

require('echarts/lib/chart/bar')
require('echarts/lib/chart/line')
require('echarts/lib/model/Series.js')
require('echarts/lib/component/tooltip')
require('echarts/lib/component/legend')
require('echarts/lib/component/title')
require('echarts/lib/component/grid')
require('echarts/lib/component/axis')
require('echarts/lib/chart/candlestick')
require('echarts/lib/component/dataZoom')
require('echarts/lib/component/markPoint')

const option = {
  title: {
    left: 'center',
    top: 10,
    typeStyle: {
      fontSize: 15
    }
  },
  legend: {
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 20,
    textStyle: {
      color: '#262c38',
      fontSize: 12
    },
    top: 10
  },
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category'
  },
  yAxis: {
    type: 'value'
  }
}

export default {
  props: ['chartOption'],
  // data() {
  //   return {
  //     echart: null
  //   }
  // },

  mounted() {
    this.echart = echarts.init(this.$refs.lineEchart)
    this.echart.setOption(merge({}, option, this.chartOption))
    window.addEventListener('resize', () => {
      this.echart.resize()
    })
  },

  watch: {
    chartOption() {
      this.echart.setOption(merge({}, option, this.chartOption), false)
    }
  }
}
</script>

<style lang="stylus">
.line-echart {
  min-width: 500px;
  margin: 0 auto;
}
</style>
