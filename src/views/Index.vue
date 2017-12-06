<template lang="pug">
  section.index-section
    header
      //- el-select(type="info", size="small", v-model='filter.symbol' placeholder='币种选择')
        el-option(v-for='item in menus' :key='item.id' :label='item.name' :value='item.id')
      .buttons
        el-button(type="primary", size="small", @click="toggleViewMode") 视图切换
    line-chart.kchart(:class="{'left-screen': viewMode === 'h'}", :chart-option="chartOption", ref="lineChart")
    div.orders(:class="{'right-screen': viewMode === 'h'}")
      el-row(:gutter='10')
        el-col(:span='12')
          table
            thead
              tr
                th 买入
                th 买入价(USDT)
                th(colspan="2", width="200") 委单量
            tbody
              tr(v-for="(item, index) in asks")
                td.color-green 买入{{index}}
                td {{item[0] | btcCurrency('$')}}
                td.text-right(width="10") {{item[1]}}
                td
                  div.bar-line.ask(:style="getStyle(item[1], askMax)")
        el-col(:span='12')
          table
            thead
              tr
                th 卖出
                th 卖出价(USDT)
                th(colspan="2", width="200") 委单量
            tbody
              tr(v-for="(item, index) in bids")
                td.color-red 卖出{{index}}
                td {{item[0] | btcCurrency('$')}}
                td.text-right(width="10") {{item[1]}}
                td
                  div.bar-line.bid(:style="getStyle(item[1], bidMax)")

</template>

<script>
import LineChart from '@/components/LineChart.vue'
// import Api from '@/api/index.js'
import { map, max } from 'lodash'

// const { coinMenus } = Api
const wsUri = 'ws://59.110.154.130:8080/'
const escapable = /[\x00-\x1f\ud800-\udfff\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufff0-\uffff]/g

export default {
  components: {
    LineChart
  },
  methods: {
    filterUnicode(quoted) {
      escapable.lastIndex = 0
      if (!escapable.test(quoted)) return quoted

      return quoted.replace(escapable, function(a) {
        return ''
      })
    },

    connectWebSocket() {
      this.websocket = new WebSocket(wsUri)
      let loading = null

      this.websocket.onopen = (evt) => {
        this.$message({ message: 'Socket 连接成功', type: 'success' })
        loading = this.$loading({
          lock: true,
          text: 'Loading',
          // target: '.kchart',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        })
      }

      this.websocket.onclose = (evt) => {
        this.$message({ message: 'Socket 连接关闭', type: 'info' })
        this.connectWebSocket()
      }

      this.websocket.onerror = (evt) => {
        this.$message({ message: 'Socket 连接错误', type: 'error' })
        console.log(evt)
      }

      this.websocket.onmessage = (evt) => {
        if (loading && loading.close) loading.close()
        let data = {}

        try {
          data = JSON.parse(evt.data)
        } catch (e) {
          console.log(evt)
          return
        }
        const asks = map(data.depths, 'asks')[0]
        const bids = map(data.depths, 'bids')[0]
        this.askMax = max(map(asks, ask => ask[1]))
        this.bidMax = max(map(asks, bid => bid[1]))

        this.asks = asks
        this.bids = bids
        this.$refs.lineChart.echart.setOption({
          xAxis: {
            data: data.categoryData
          },
          series: [{
            name: '现货',
            markPoint: {
              label: {
                normal: {
                  formatter: function(param) {
                    return param != null ? param.value : ''
                  }
                }
              },
              data: data.gap_infos,
              tooltip: {
                formatter: function(param) {
                  return param.name + '<br>' + (param.data.coord || '')
                }
              }
            },
            data: data.spot_data
          }, {
            name: '期货',
            data: data.ex_data
          }]
        })
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
          top: 80
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
          axisLine: { lineStyle: { color: '#8392A5' } },
          splitLine: { show: false }
        },
        grid: {
          top: 122,
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
    },

    toggleViewMode() {
      if (this.viewMode === 'v') {
        this.viewMode = 'h'
      } else {
        this.viewMode = 'v'
      }
      this.$nextTick(() => {
        this.$refs.lineChart.echart.resize()
      })
    },

    getStyle(value, maxValue) {
      const percent = Math.min(1, value / maxValue)
      return {
        width: percent * 100 + '%'
      }
    }
  },

  async mounted() {
    // const data = await coinMenus.get().then(res => res.data)
    // this.menus = data.menus
    this.initChart()
    this.connectWebSocket()
  },

  beforeDestroy() {
    this.websocket.close()
  },

  data() {
    return {
      viewMode: 'v',
      filter: {
        symbol: ''
      },
      askMax: 0,
      bidMax: 0,
      asks: [],
      bids: [],
      chartOption: {},
      menus: []
    }
  }
}
</script>

<style lang="stylus" scoped>
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
.index-section {
  .text-right {
    text-align: right;
  }
  .color-green {
    color: #689700;
  }
  .color-red {
    color: red;
  }
  .kchart {
    height: 100vh;
  }
  .el-row {
    padding: 10px;
  }
  .right-screen,
  .left-screen {
    float: left;
    width: 50%;
    height: 100vh;
  }
  .right-screen {
    overflow-y: scroll;
    // color: white;
    // background: #21212e;
    // table th {
    //   background: black;
    // }
    // table tr:hover {
    //   background: #313129;
    // }
    .el-row {
      padding-top: 60px;
    }
  }
  .bar-line {
    height: 20px;
    &.ask {
      background-color: #689700;
    }
    &.bid {
      background-color: red;
    }
  }
  .buttons {
    float: right;
  }
  header {
    z-index: 999;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    overflow: hidden;
    background: black;
    padding: 10px 15px;
  }
}
</style>
