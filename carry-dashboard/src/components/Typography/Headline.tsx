import { Typography } from 'antd'
import { TitleProps } from 'antd/es/typography/Title'
import classNames from 'classnames'
import React, { useMemo } from 'react'

const { Title } = Typography

type Props = Omit<TitleProps, 'level' | 'type'> & {
  strong?: boolean
  align?: 'center' | 'left' | 'right'
}

const useExtraPropsClassNames = ({
  strong,
  align,
  level,
}: {
  strong: boolean
  align: 'center' | 'left' | 'right'
  level: 1 | 2 | 3 | 4 | 5
}) => {
  return useMemo(() => {
    return classNames(
      {
        '!font-medium': !strong,
        "!font-semibold !font-['Poppins-SemiBold']": strong,
      },
      {
        'text-center': align === 'center',
        'text-left': align === 'left',
        'text-right': align === 'right',
      },
      {
        'lg:!text-5xl md:!text-4xl !text-3xl': level === 1,
        'lg:!text-4xl md:!text-3xl !text-2xl': level === 2,
        'lg:!text-3xl md:!text-2xl !text-xl': level === 3,
        'lg:!text-2xl md:!text-xl !text-lg': level === 4,
        'lg:!text-xl md:!text-lg !text-base': level === 5,
      }
    )
  }, [align, level, strong])
}

const Headline =
  (level: 1 | 2 | 3 | 4 | 5) =>
  // eslint-disable-next-line react/display-name
  ({ children, strong = true, align = 'left', ...props }: Props) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const extraClasses = useExtraPropsClassNames({ strong, align, level })
    return (
      <Title
        {...props}
        level={level}
        className={classNames(extraClasses, props.className)}
      >
        {children}
      </Title>
    )
  }

export const H1 = Headline(1)
export const H2 = Headline(2)
export const H3 = Headline(3)
export const H4 = Headline(4)
export const H5 = Headline(5)
