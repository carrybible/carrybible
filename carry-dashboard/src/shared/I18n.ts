import { GetServerSideProps, GetStaticProps } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export const withTrans = (
  getStaticOrServerSideProps?: GetStaticProps | GetServerSideProps,
  localeNamespace?: string[]
): GetStaticProps | GetServerSideProps => {
  // @ts-ignore
  return async (...args) => {
    // @ts-ignore
    const propsResult = (await getStaticOrServerSideProps?.(...args)) ?? {}
    return {
      ...propsResult,
      props: {
        ...(propsResult as any)?.props,
        ...(await serverSideTranslations(args[0].locale as string, [
          'common',
          ...(localeNamespace ?? []),
        ])),
      },
    }
  }
}
