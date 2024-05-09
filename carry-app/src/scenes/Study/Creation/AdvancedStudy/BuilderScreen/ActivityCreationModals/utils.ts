import { wait } from '@shared/Utils'
import { Dispatch, SetStateAction, useCallback } from 'react'

export const useHandleChangeModalHeight = (setHeight: Dispatch<SetStateAction<number>>) => {
  return useCallback(
    newHeight => {
      setHeight(currentHeight => {
        // HACK: just a stupid workaround solution that force re-render to solve incorrect modal height
        if (newHeight < currentHeight) {
          wait(100).then(() => {
            return setHeight(newHeight)
          })
          return newHeight - 1
        }
        return newHeight
      })
    },
    [setHeight],
  )
}
