import { RootState } from '@dts/state'
import { useSelector } from 'react-redux'

const useActionStepFeature = (): boolean => {
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  return group.hasActionStepFeature ?? false
}

export default useActionStepFeature
