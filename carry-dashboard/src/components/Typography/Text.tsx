import { Typography } from 'antd'
import { TextProps } from 'antd/es/typography/Text'
import classNames from 'classnames'
import React, { useMemo } from 'react'

const { Text: AntText } = Typography

type Props = Omit<TextProps, 'type'> & {
  align?: 'center' | 'left' | 'right'
}

const useExtraPropsClassNames = ({
  strong,
  align,
  type,
}: {
  strong: boolean
  align: 'center' | 'left' | 'right'
  type: 'larger' | 'normal' | 'small' | 'tiny'
}) => {
  return useMemo(() => {
    return classNames(
      {
        '!font-normal': !strong,
        "!font-semibold	!font-['Poppins-SemiBold']": strong,
      },
      {
        'text-center': align === 'center',
        'text-left': align === 'left',
        'text-right': align === 'right',
      },
      {
        'lg:!text-lg !text-base': type === 'larger',
        'lg:!text-base !text-sm': type === 'normal',
        '!text-sm': type === 'small',
        '!text-xs': type === 'tiny',
      }
    )
  }, [align, strong, type])
}

const TextCommon = (type: 'larger' | 'normal' | 'small' | 'tiny') =>
  // eslint-disable-next-line react/display-name
  React.forwardRef(
    (
      { children, strong = false, align = 'left', ...props }: Props,
      ref: any
    ) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const extraClasses = useExtraPropsClassNames({ strong, align, type })
      return (
        <AntText
          ref={ref}
          {...props}
          className={classNames(extraClasses, props.className)}
        >
          {children}
        </AntText>
      )
    }
  )

export const LargerText = TextCommon('larger')
export const Text = TextCommon('normal')
export const SmallText = TextCommon('small')
export const TinyText = TextCommon('tiny')
