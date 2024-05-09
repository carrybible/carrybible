import EnvelopeSimple from '@assets/icons/EnvelopeSimple.svg'
import MemberAvatar from '@components/MemberAvatar'
import { SmallText, Text } from '@components/Typography'
import { validateEmail } from '@shared/Utils'
import classNames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import React, { FC, ReactElement } from 'react'

type Props<T = any> = {
  searchText?: string
  searchResult: T[] | any
  onClickItem: (item: T) => void
  searchingTitle: string
  selectTitle: string
  iconDefault?: ReactElement | null
  isCheckEmail?: boolean
}

const SelectResult: FC<Props> = (props) => {
  const { searchText, searchResult, isCheckEmail } = props

  if (
    searchText &&
    !searchResult.length &&
    (!isCheckEmail || validateEmail(searchText))
  ) {
    return (
      <div
        className="mt-3 w-full cursor-pointer"
        onClick={() => {
          if (searchText.indexOf('@') > 2) {
            props.onClickItem({
              avatar: '',
              email: searchText,
              label: searchText,
              value: searchText,
            })
          }
        }}
      >
        <Text className="text-neutral-80">{props.searchingTitle}</Text>
        <div
          className={classNames(
            'flex flex-row items-center',
            'mt-3 mr-3 px-6 py-3',
            'rounded-xl bg-neutral-50'
          )}
        >
          {props.iconDefault ? (
            props.iconDefault
          ) : (
            <Image
              width={40}
              height={40}
              src={EnvelopeSimple}
              alt="envelop-icon"
              className="pr-2"
            />
          )}

          <Text ellipsis className="flex flex-wrap">
            {searchText}
          </Text>
        </div>
      </div>
    )
  }
  return (
    <AnimatePresence>
      {searchResult?.length && (
        <motion.div
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1, originY: 0 }}
          exit={{ opacity: 0, scaleY: 0, originY: 0 }}
          className="mt-3"
        >
          <Text className="text-neutral-80">{props.selectTitle}</Text>
          <div
            className={classNames(
              'mt-3',
              'rounded-2xl border-2 border-solid border-neutral-50',
              'max-h-[300px] overflow-auto'
            )}
          >
            {searchResult.map((i: any, index: number) => (
              <div
                className={classNames(
                  'flex flex-row items-center',
                  'py-2 px-6 hover:cursor-pointer hover:bg-primary-light',
                  index === 0 && 'pt-3',
                  index === searchResult.length - 1 && 'pb-3'
                )}
                onClick={() => props.onClickItem(i)}
                key={i.value}
              >
                <MemberAvatar src={i.avatar} size={40} />
                <div className={classNames('flex flex-col', 'mx-3')}>
                  <Text>{i.label}</Text>
                  <SmallText className="mt-1 text-neutral-80">
                    {i.email}
                  </SmallText>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
export default SelectResult
