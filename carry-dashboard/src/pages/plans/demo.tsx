import Button from '@components/Button'
import DatePicker from '@components/Calendar'
import PageLayout from '@components/Layout/PageLayout'
import ChooseGroupModal, {
  ChooseGroupModalRef,
} from '@components/Modals/Plan/ChooseGroupModal'
import UploadVideoModal, {
  UploadVideoModalRef,
} from '@components/Modals/Plan/UploadVideoModal'

import { NextPageWithLayout } from '@pages/_app'
import { withTrans } from '@shared/I18n'
import { getServerTimestamp } from '@shared/Utils'
import { useRef } from 'react'

const DemoPage: NextPageWithLayout = () => {
  const chooseGroupModalRef = useRef<ChooseGroupModalRef>(null)
  const uploadVideoModalRef = useRef<UploadVideoModalRef>(null)

  return (
    <PageLayout>
      <div className="flex flex-row space-x-4 pt-10">
        <Button
          className="btn mt-6 flex h-fit flex-1 items-center justify-center gap-x-0 py-1 px-6 sm:mt-0"
          onClick={() => {
            chooseGroupModalRef.current?.show()
          }}
        >
          Choose Group(s)
        </Button>

        <Button
          className="btn mt-6 flex h-fit flex-1 items-center justify-center gap-x-0 py-1 px-6 sm:mt-0"
          onClick={() => {
            uploadVideoModalRef.current?.show()
          }}
        >
          Upload a video
        </Button>
      </div>

      <ChooseGroupModal
        ref={chooseGroupModalRef}
        plan={{
          id: '',
          name: '',
          description: '',
          duration: 0,
          author: '',
          authorInfo: undefined,
          lastUpdatedAuthor: undefined,
          featuredImage: '',
          state: 'draft',
          mode: 'template',
          type: 'quick',
          created: getServerTimestamp(),
          updated: getServerTimestamp(),
          deleted: undefined,
          blocks: [],
          pace: undefined,
        }}
      />

      <UploadVideoModal ref={uploadVideoModalRef} />
      <div className="pt-5">
        <DatePicker />
      </div>
    </PageLayout>
  )
}

export const getStaticProps = withTrans()
export default DemoPage
