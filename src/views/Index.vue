<template lang="pug">
  section.index-section
    //- header
      //- el-select(type="info", size="small", v-model='filter.symbol_type' placeholder='币种选择')
        el-option(v-for='item in menus' :key='item.id' :label='item.name' :value='item.id')
    .buttons.mt10
      el-select.mr5(type="info", size="small", v-model='viewMode', placeholder='币种选择', @change="toggleViewMode")
        el-option(v-for='item in viewTypeList', :key='item.value', :label='item.name', :value='item.value')
      el-button(type="primary", size="small", @click="restartServer") 服务重启
    .summary-data(v-html='stateOfMarketHtml')
    line-chart.kchart(v-show="viewMode === 'ms' || viewMode === 'whole'", :class="{'left-screen': viewMode === 'whole'}", :chart-option="chartOption", ref="msChart")
    div.orders(:class="{'right-screen': viewMode === 'whole'}")
      el-row.ask-bid(:gutter='10', v-show="viewMode === 'whole'")
        el-col(:span='12')
          table
            thead
              tr
                th 卖出
                th 卖出价(USDT)
                th(colspan="2", width="200") 委单量
            tbody
              tr(v-for="(item, index) in asks")
                td.color-red 卖出{{index}}
                td {{item[0] | btcCurrency('$')}}
                td.text-right(width="10") {{item[1]}}
                td
                  div.bar-line.bid(:style="getStyle(item[1], bidMax)")
        el-col(:span='12')
          table
            thead
              tr
                th 买入
                th 买入价(USDT)
                th(colspan="2", width="200") 委单量
            tbody
              tr(v-for="(item, index) in bids")
                td.color-green 买入{{index}}
                td {{item[0] | btcCurrency('$')}}
                td.text-right(width="10") {{item[1]}}
                td
                  div.bar-line.ask(:style="getStyle(item[1], askMax)")
      el-row(v-show="viewMode === 'min' || viewMode === 'whole'")
        minute-chart(ref="minuteChart")
</template>

<script>
import LineChart from '@/components/LineChart.vue'
import Api from '@/api/index.js'
import { map, max, indexOf } from 'lodash'
import MinuteChart from '@/views/MinuteChart.vue'

const { restartSystem } = Api
const wsUri = 'ws://59.110.154.130:8222'
const escapable = /[\x00-\x1f\ud800-\udfff\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufff0-\uffff]/g
let categoryData = []
let spotData = []
let marginData = []
let exData = []
let messagePointer

export default {
  components: {
    LineChart,
    MinuteChart
  },
  methods: {
    filterUnicode(quoted) {
      escapable.lastIndex = 0
      if (!escapable.test(quoted)) return quoted

      return quoted.replace(escapable, a => {
        return ''
      })
    },

    dataBuffer(data) {
      const oldLength = categoryData.length
      if (oldLength === 0) {
        categoryData = data.categoryData
        spotData = data.spot_data
        marginData = data.margin_data
        exData = data.ex_data
      } else {
        const lastOld = categoryData[oldLength - 1]
        const diffDot = indexOf(data.categoryData, lastOld)
        categoryData = categoryData.concat(data.categoryData.slice(diffDot + 1)).slice(-800)
        spotData = spotData.concat(data.spot_data.slice(diffDot + 1)).slice(-800)
        marginData = marginData.concat(data.margin_data.slice(diffDot + 1)).slice(-800)
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
        console.info('Socket 连接成功')
        this.websocket.send(JSON.stringify(this.filter))
      }

      this.websocket.onclose = evt => {
        console.log('Socket 连接关闭', evt)
        // this.connectWebSocket()
      }

      this.websocket.onerror = evt => {
        console.error('Socket 连接错误', evt)
        this.connectWebSocket()
      }

      this.websocket.onmessage = evt => {
        clearTimeout(messagePointer)
        if (loading && loading.close) loading.close()
        let data = {}
        try {
          data = JSON.parse(evt.data)
          this.stateOfMarket = JSON.parse(data.state_of_market)
          this.stateOfMarket['价差'] = data.gap_infos[0].value
          this.stateOfMarket['价差比'] = data.gap_infos[1].value
          console.log('data format success', evt)
        } catch (e) {
          console.error('data format error', evt)
          return
        }
        const asks = map(data.depths, 'asks')[0]
        const bids = map(data.depths, 'bids')[0]
        this.askMax = max(map(asks, ask => ask[1]))
        this.bidMax = max(map(asks, bid => bid[1]))

        this.asks = asks.sort((a, b) => a[0] - b[0])
        this.bids = bids.sort((a, b) => b[0] - a[0])

        this.dataBuffer(data)

        this.$refs.msChart.echart.setOption({
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
          }, {
            name: '价差',
            data: marginData
          }]
        })

        messagePointer = setTimeout(() => {
          this.websocket.send(JSON.stringify(this.filter))
        }, 1000)
      }
    },

    initChart() {
      this.chartOption = {
        // backgroundColor: '#21202D',
        legend: {
          data: ['现货', '期货', '价差'],
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
        }, {
          name: '价差',
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

    // updateMinuteMinHeight() {
    //   const summaryDom = document.querySelector('.summary-data').getBoundingClientRect()
    //   const askBidDom = document.querySelector('.ask-bid').getBoundingClientRect()
    //   this.$refs.msChart.$el.style.minHeight = (window.innerHeight - summaryDom.height - 15) + 'px'
    //   this.$refs.minuteChart.updateMinHeight(window.innerHeight - summaryDom.height - askBidDom.height - 15)
    // },

    // 切换视图
    toggleViewMode() {
      this.$nextTick(() => {
        const summaryDom = document.querySelector('.summary-data').getBoundingClientRect()
        const askBidDom = document.querySelector('.ask-bid').getBoundingClientRect()
        if (this.viewMode === 'whole') {
          this.$refs.msChart.$el.style.minHeight = (window.innerHeight - summaryDom.height - 15) + 'px'
          this.$refs.minuteChart.updateMinHeight(window.innerHeight - summaryDom.height - askBidDom.height - 15)
          this.$refs.msChart.echart.resize()
          this.$refs.minuteChart.resize()
        } else if (this.viewMode === 'min') {
          this.$refs.minuteChart.updateMinHeight(window.innerHeight - summaryDom.height - 15)
          this.$refs.minuteChart.resize()
        } else if (this.viewMode === 'ms') {
          this.$refs.msChart.$el.style.minHeight = (window.innerHeight - summaryDom.height - 15) + 'px'
          this.$refs.msChart.echart.resize()
        }
      })
    },

    // 重启服务
    async restartServer() {
      this.$notify({
        title: '提示',
        message: '数据停止更新，20秒后重启成功！'
        // duration: 0
      })

      const res = await restartSystem.get()
      this.websocket.close()
      this.$refs.minuteChart.stop()

      setTimeout(() => {
        this.$message({ message: '重启系统成功', type: 'success' })
        console.log(res, '重启系统成功')
        this.connectWebSocket()
        this.$refs.minuteChart.connectWebSocket()
      }, 20000)
    },

    // 计算买卖量的柱形图展示
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

  computed: {
    stateOfMarketHtml() {
      return map(this.stateOfMarket, (val, key) => {
        return `<span>${key}</span>:<span class="em-number">${val}</span>`
      }).join('')
    }
  },

  data() {
    return {
      systemRestarting: false,
      stateOfMarket: {},
      viewMode: 'whole',
      viewTypeList: [{
        name: '整体视图',
        value: 'whole'
      }, {
        name: '分钟视图',
        value: 'min'
      }, {
        name: '毫秒视图',
        value: 'ms'
      }],
      filter: {
        symbol_type: ''
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
.summary-data {
  padding: 15px;
  text-align: center;
  color: black;
  line-height: 30px;
  font-size: 14px;
  overflow: hidden;
  padding-right: 20px;
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
    padding: 1px 8px;
    border-top: 1px solid #d5d5d5;
  }
  th {
    background: #f1f1f1;
  }
}
</style>

<style lang="stylus">
.index-section {
  .em-number {
    padding: 0 8px;
    color: red;
  }
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
    min-height: 80vh;
  }
  .el-row {
    padding: 10;
  }
  .right-screen,
  .left-screen {
    float: left;
    width: 50%;
    min-height: 80vh;
  }
  .right-screen {
    overflow-y: scroll; // color: white;
    .el-row {
      padding: 0;
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
    z-index: 999; // position: fixed;
    // top: 0;
    // left: 0;
    // right: 0;
    overflow: hidden;
    background: black;
    padding: 10px 15px;
  }
}
</style>
