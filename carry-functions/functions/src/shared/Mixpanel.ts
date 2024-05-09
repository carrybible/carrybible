import axios from 'axios'
import { add, format } from 'date-fns'
import * as functions from 'firebase-functions'

const arrayString = (arr: string[]) => `[${arr.map((val) => `\\"${val}\\"`).join(',')}]`

const genQueryEvents = (events: string[], scope?: { campusIds?: string[]; groupIds?: string[]; uids?: string[] }) => {
  const addingQuery: string[] = []
  if (scope?.groupIds) {
    addingQuery.push(`\`properties[\\"groupId\\"] in ${arrayString(scope.groupIds)}\``)
  }
  if (scope?.campusIds) {
    addingQuery.push(`\`properties[\\"campusId\\"] in ${arrayString(scope.campusIds)}\``)
  }
  if (scope?.uids) {
    addingQuery.push(`\`properties[\\"userId\\"] in ${arrayString(scope.uids)}\``)
  }
  const query = addingQuery.length > 0 ? `, selector: ${addingQuery.join(' and ')}` : ''
  return `[${events.map((event) => `{ event: '${event}'${query} }`).join(',')}]`
}

const MessageEvents = [
  'Replied to General Chat',
  'Replied to Private Chat',
  'Replied to Thread',
  'Answered a question',
  'Add a passage to chat',
  'Prayer request',
  'Prayer response',
  'Gratitude request',
  'Gratitude response',
]

const PrayerEvent = ['Prayer request']

const PraiseEvent = ['Gratitude request']

const OrgSelector = (orgId: string) => `{ selector: \`user[\\"orgId\\"] == \\"${orgId}\\"\` }`

async function getReportCount(events: string, selectors: string[], onlyCount?: boolean) {
  const toDate = new Date()
  const fromDate = add(toDate, { days: -90 })
  const toDateString = format(toDate, 'yyyy-MM-dd')
  const fromDateString = format(fromDate, 'yyyy-MM-dd')

  const data = JSON.stringify({
    script: `function main() {return (join( Events({ from_date: params.from_date, to_date: params.to_date, event_selectors: ${events}}), People({ user_selectors: [${selectors.join(
      ',',
    )}] }), { type: 'inner' } )${onlyCount ? `.reduce(mixpanel.reducer.count())` : ''} ); }`,
    params: `{"from_date":"${fromDateString}","to_date":"${toDateString}"}`,
  })
  try {
    const config = {
      method: 'post',
      url: `https://mixpanel.com/api/2.0/jql?project_id=${functions.config().mixpanel.projectid}`,
      headers: {
        Authorization: `Basic ${functions.config().mixpanel.secret}`,
        'Content-Type': 'application/json',
      },
      data,
    }

    const res = await axios(config)
    if (onlyCount) return res?.data?.[0] || 0
    return res?.data || []
  } catch (error: any) {
    //Try one time
    if (error?.response && error.response.status === 429) {
      try {
        const retrieConfig = {
          method: 'post',
          url: `https://mixpanel.com/api/2.0/jql?project_id=${functions.config().mixpanel.projectid}`,
          headers: {
            Authorization: `Basic ${functions.config().mixpanel.secret}`,
            'Content-Type': 'application/json',
            Referer: 'https://mixpanel.com',
          },
          data,
        }
        const res = await axios(retrieConfig)
        if (onlyCount) return res?.data?.[0] || 0
        return res?.data || []
      } catch (error: any) {
        functions.logger.error('[GET Message(Retry) Count]', selectors, data, error)
        if (onlyCount) return 0
        return []
      }
    }
    functions.logger.error('[GET Message Count]', selectors, data, error)
    if (onlyCount) return 0
    return []
  }
}

export default {
  events: {
    MessageEvents,
    PraiseEvent,
    PrayerEvent,
  },
  selectors: {
    Org: OrgSelector,
  },
  genQueryEvents,
  getReportCount,
}
