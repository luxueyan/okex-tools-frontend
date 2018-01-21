<template lang="pug">
  section.minute-chart
    line-chart.kchart(:chart-option="chartOption", ref="lineChart")
</template>

<script>
import LineChart from '@/components/LineChart.vue'
import { indexOf } from 'lodash'

const wsUri = 'ws://59.110.154.130:8223'
let categoryData = []
let spotData = []
let exData = []
let messagePointer

export default {
  components: {
    LineChart
  },
  methods: {
    resize() {
      this.$refs.lineChart.echart.resize()
    },
    updateMinHeight(height) {
      this.$refs.lineChart.$el.style.minHeight = height + 'px'
    },
    dataBuffer(data) {
      const oldLength = categoryData.length
      if (oldLength === 0) {
        categoryData = data.categoryData
        spotData = data.spot_data
        exData = data.ex_data
      } else {
        const lastOld = categoryData[oldLength - 1]
        const diffDot = indexOf(data.categoryData, lastOld)
        categoryData = categoryData.concat(data.categoryData.slice(diffDot + 1)).slice(-800)
        spotData = spotData.concat(data.spot_data.slice(diffDot + 1)).slice(-800)
        exData = exData.concat(data.ex_data.slice(diffDot + 1)).slice(-800)
      }
    },

    connectWebSocket() {
      this.websocket = new WebSocket(wsUri)
      let loading = null
      loading = this.$loading({
        lock: true,
        text: '玩命加载中',
        // target: '.kchart',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })

      this.websocket.onopen = evt => {
        console.info('MinuteChart: Socket 连接成功')
        this.websocket.send(JSON.stringify(this.filter))
      }

      this.websocket.onclose = evt => {
        console.log('MinuteChart: Socket 连接关闭', evt)
        // this.connectWebSocket()
      }

      this.websocket.onerror = evt => {
        console.error('MinuteChart: Socket 连接错误', evt)
        this.connectWebSocket()
      }

      this.websocket.onmessage = evt => {
        clearTimeout(messagePointer)
        if (loading && loading.close) loading.close()
        let data = {}
        try {
          data = JSON.parse(evt.data)
          console.log('MinuteChart: data format success', evt)
        } catch (e) {
          console.error('MinuteChart: data format error', evt)
          return
        }

        this.dataBuffer(data)
        this.$refs.lineChart.echart.setOption({
          tooltip: {
            show: true,
            confine: true,
            alwaysShowContent: true
          },
          xAxis: {
            data: categoryData
          },
          yAxis: {
            min(value) {
              return value.min - 20
            },
            max(value) {
              return value.max + 80
            }
          },
          series: [{
            name: '现货',
            markPoint: {
              label: {
                normal: {
                  formatter(param) {
                    return param != null ? param.value : ''
                  }
                }
              },
              data: data.gap_infos,
              tooltip: {
                formatter(param) {
                  return param.name + '<br>' + (param.data.coord || '')
                }
              }
            },
            data: spotData
          }, {
            name: '期货',
            data: exData
          }]
        })

        messagePointer = setTimeout(() => {
          this.websocket.send(JSON.stringify(this.filter))
        }, 600)
      }
    },

    initChart() {
      this.chartOption = {
        // backgroundColor: '#21202D',
        legend: {
          data: ['现货', '期货'],
          inactiveColor: '#777',
          textStyle: {
            color: '#000'
          },
          top: 10
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            animation: false,
            type: 'cross',
            lineStyle: {
              color: '#376df4',
              width: 2,
              opacity: 1
            }
          }
        },
        xAxis: {
          type: 'category',
          data: [],
          axisLine: { lineStyle: { color: '#8392A5' } }
        },
        yAxis: {
          scale: true,
          axisLabel: {
            formatter: (value) => {
              return Math.round(value)
            }
          },
          axisLine: { lineStyle: { color: '#8392A5' } },
          splitLine: { show: false }
        },
        grid: {
          top: 30,
          bottom: 80
        },
        dataZoom: [{
          textStyle: {
            color: '#8392A5'
          },
          handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
          handleSize: '80%',
          dataBackground: {
            areaStyle: {
              color: '#8392A5'
            },
            lineStyle: {
              opacity: 0.8,
              color: '#8392A5'
            }
          },
          handleStyle: {
            color: '#fff',
            shadowBlur: 3,
            shadowColor: 'rgba(0, 0, 0, 0.6)',
            shadowOffsetX: 2,
            shadowOffsetY: 2
          }
        }, {
          type: 'inside'
        }],
        animation: false,
        series: [{
          name: '现货',
          type: 'line',
          data: [],
          smooth: true,
          showSymbol: false,
          lineStyle: {
            normal: {
              width: 1
            }
          }
        }, {
          name: '期货',
          type: 'line',
          data: [],
          smooth: true,
          showSymbol: false,
          lineStyle: {
            normal: {
              width: 1
            }
          }
        }]
      }
    }
  },

  async mounted() {
    this.initChart()
    this.connectWebSocket()
  },

  beforeDestroy() {
    this.websocket.close()
  },

  data() {
    return {
      chartOption: {}
    }
  }
}
</script>

<style lang="stylus" scoped>
.summary-data {
  padding: 15px;
  text-align: center;
  color: black;
  line-height: 30px;
  font-size: 14px;
}

table {
  width: 100%;
  border: 1px solid #d5d5d5;
  border-collapse: collapse;
  tr:hover {
    background: #ffffaa;
  }
  th,
  td {
    padding: 3px 8px;
    border-top: 1px solid #d5d5d5;
  }
  th {
    background: #f1f1f1;
  }
}
</style>

<style lang="stylus">
.minute-chart {
  .kchart {
    min-height: 45vh;
  }
}
</style>
