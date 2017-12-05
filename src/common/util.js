import { cloneDeep, isNull, each, isPlainObject } from 'lodash'

export function urlMatcher(url, params = {}) {
  return url.replace(/\/:([^/]+)/g, (match, g1) => {
    return params[g1] ? '/' + params[g1] : ''
  })
}

// 清理无用参数
export function pruneParams(params, visible) {
  var newParams = cloneDeep(params)
  each(newParams, (v, i) => {
    if (newParams[i] === '' || isNull(newParams[i]) || newParams[i] === '_all_' || (isPlainObject(visible) && visible[i] === false)) {
      delete newParams[i]
    }
  })
  return newParams
}
