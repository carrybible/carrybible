const ENV =
  (process.env.NEXT_PUBLIC_ENV as undefined | 'prod' | 'staging' | 'dev') ??
  'dev'
export const IS_LOCAL_DEV = process.env.NODE_ENV !== 'production'

const DOMAINS = {
  local: 'http://localhost:3000',
  dev: '',
  staging: '',
  prod: '',
}

const Config: {
  ENV: 'prod' | 'staging' | 'dev'
  DOMAIN: string
  SERVER: string
  BRANCH_KEY: string
  INTERCOM: string
  NEXT_PUBLIC_ENV: any
  SPECIAL_ORGANISATION: Record<'', string>
} = {
  NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
  ENV,
  DOMAIN: IS_LOCAL_DEV ? DOMAINS['local'] : DOMAINS[ENV],
  SERVER: ENV === 'dev' ? '' : '',
  BRANCH_KEY: ENV === 'dev' ? '' : '',
  INTERCOM: ENV === 'dev' ? '' : '',
}

export default Config
