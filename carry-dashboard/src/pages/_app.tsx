import CoreContainer from '@components/CoreContainer'
import Layout from '@components/Layout'
import '@styles/globals.css'
import { NextPage } from 'next'
import { appWithTranslation } from 'next-i18next'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { NextQueryParamProvider } from 'next-query-params'
import { ReactElement, ReactNode } from 'react'

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode
  getContainer?: (page: ReactNode) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>)
  const getContainer =
    Component.getContainer ?? ((page) => <CoreContainer>{page}</CoreContainer>)
  return (
    <>
      <Head>
        <title>Carry Dashboard</title>
      </Head>
      <NextQueryParamProvider>
        {getContainer(getLayout(<Component {...pageProps} />))}
      </NextQueryParamProvider>
    </>
  )
}

export default appWithTranslation(MyApp)
