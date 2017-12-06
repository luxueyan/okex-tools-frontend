import { isNumber, round, isNil } from 'lodash'
import moment from 'moment'
import numeral from 'numeral'

export default {
  install(Vue, options) {
    Vue.filter('btcCurrency', (value, prefix = '￥', suffix = '') => {
      if (isNumber(value)) {
        return prefix + numeral(round(value, 2)).format('0,0.00') + suffix
      }
      return value || '-'
    })

    Vue.filter('btcThousand', (value, suffix = '万元') => {
      if (isNumber(value)) {
        return numeral(value / 10000).format('0,0.00') + suffix
      }
      return value || '-'
    })

    Vue.filter('btcKm', value => {
      if (isNumber(value)) {
        return numeral(round(value / 1000)).format('0,0') + 'km'
      }
      return value
    })

    Vue.filter('btcPercent', (value, decimal = 2, multi = 100, unit = '%') => {
      return isNumber(value) ? round(value * multi, decimal).toFixed(decimal) + (unit || '') : '-'
    })

    Vue.filter('btcRangePercent', (value, value2, decimal = 2) => {
      value = isNumber(value) ? round(value, decimal).toFixed(decimal) : ''
      value2 = isNumber(value2) ? round(value2, decimal).toFixed(decimal) : ''
      if (value === value2) {
        return value + '%'
      }

      return `${value}-${value2}%`
    })

    Vue.filter('btcRound', (value, decimal = 0) => {
      return round(value, decimal).toFixed(2)
    })

    Vue.filter('btcAppend', (value, str) => {
      return (isNil(value) ? '' : value) + str
    })

    Vue.filter('btcPrepend', (value, str) => {
      return str + (isNil(value) ? '' : value)
    })

    Vue.filter('btcPositveNumber', (value) => {
      if (value > 0 && isNumber(value)) {
        return '+' + value
      }
      return value
    })

    Vue.filter('btcNegativeNumber', (value) => {
      if (value > 0) {
        return value
      } else {
        return -(value)
      }
    })

    Vue.filter('btcNull', (value, str) => {
      return isNil(value) ? '-' : (str || value)
    })

    Vue.filter('moment', (date, format, inputFormat) => {
      if (inputFormat) {
        return date ? moment(date, inputFormat).format(format) : '-'
      }
      return date ? moment(date).format(format) : '-'
    })

    Vue.filter('roleFilter', (data, name) => {
      return data ? data + '(' + name + ')' : '-'
    })
  }
}
