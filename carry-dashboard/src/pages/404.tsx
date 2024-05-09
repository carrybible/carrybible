import MemberEmpty from '@assets/images/MemberEmpty.png'
import Banner from '@components/Banner'
import PageLayout from '@components/Layout/PageLayout'
import { NextPageWithLayout } from '@pages/_app'
import { withTrans } from '@shared/I18n'
import { Layout } from 'antd'

import React from 'react'

const NotFoundPage: NextPageWithLayout = () => {
  return (
    <PageLayout title={'404 error'}>
      <Banner
        title={'Oops! This page is not found'}
        content={`Either your url is incorrect or you don't have permission...`}
        image={{
          img: MemberEmpty,
          imgAlt: '404 page',
          width: 212,
          height: 54,
        }}
      />
    </PageLayout>
  )
}

NotFoundPage.getLayout = (page) => {
  return (
    <Layout>
      <Layout.Content className="flex h-screen w-screen items-center justify-center">
        {page}
      </Layout.Content>
    </Layout>
  )
}

export const getStaticProps = withTrans()
export default NotFoundPage
