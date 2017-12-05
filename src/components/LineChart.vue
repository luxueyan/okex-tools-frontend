<template lang="pug">
  .line-echart(ref="lineEchart")
</template>

<script>
import echarts from 'echarts/lib/echarts'
import {
  merge,
  concat,
  map,
  isNumber
} from 'lodash'
import Vue from 'vue'

require('echarts/lib/chart/bar')
require('echarts/lib/chart/line')
require('echarts/lib/model/Series.js')
require('echarts/lib/component/tooltip')
require('echarts/lib/component/legend')
require('echarts/lib/component/title')
require('echarts/lib/component/grid')
require('echarts/lib/component/axis')
require('echarts/lib/component/dataZoom')

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
    bottom: 10
  },
  tooltip: {
    trigger: 'axis',
    formatter: (params, ticket, callback) => {
      if (!params.length) return
      return concat([`<table class="chart-tooltip"><tr><th colspan="2">${params[0].name}</th><tr>`],
        map(params, v => {
          if (isNumber(v.value)) {
            return `<tr class="line">
                        <td class="left"><i class="circle" style="color:${v.color}"></i>${v.seriesName}：</td>
                        <td class="right">${Vue.filter('ktPercent')(v.value)}</td>
                      </tr>`
          }
        }), '</table>').join('')
    }
  },
  xAxis: {
    type: 'category',
    axisTick: {
      show: true,
      alignWithLabel: true
    },
    axisLabel: {
      interval: 0
    },
    axisLine: {
      show: true,
      lineStyle: {
        color: '#2a313b'
      }
    }
  },
  yAxis: {
    type: 'value',
    name: '',
    axisLabel: {
      show: true
    },
    axisLine: {
      show: true,
      lineStyle: {
        color: '#2a313b'
      }
    },
    axisTick: {
      show: true
    }
    // splitLine: {
    //   show: false
    // }
  },
  grid: {
    show: false,
    left: 70,
    right: 70,
    bottom: 90
  }
}

export default {
  props: ['chartOption'],
  data() {
    return {
      echart: null
    }
  },

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

<style lang="scss">
.line-echart {
  min-width: 500px;
  height: 350px;
  margin: 0 auto;
}
</style>
