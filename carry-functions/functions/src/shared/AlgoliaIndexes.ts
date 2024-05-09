import { logger } from 'firebase-functions'
import Service from './Service'

const updateUser = async (user: Carry.User, old: any = {}) => {
  if (!user.uid || !user.name || user.visibility === 'private') {
    logger.log('Profile not updated in Algolia index', user)
    return
  }

  const algoliaObject = {
    objectID: user.uid,
    id: user.uid,
    name: user.name,
    image: user.image,
    reading: user.reading,
    currentStreak: user.currentStreak,
    subscription: user.subscription,
  }

  if (
    algoliaObject.name === old.name &&
    algoliaObject.image === old.image &&
    algoliaObject.reading === old.reading &&
    algoliaObject.currentStreak === old.currentStreak
  )
    return

  try {
    await Service.Algolia.usersIndex.saveObject(algoliaObject)
  } catch (e) {
    logger.error('Profile update failed in Algolia index', user.uid)
  }
}

const deleteUser = async (uid: string) => {
  try {
    await Service.Algolia.usersIndex.deleteObject(uid)
  } catch (e) {
    logger.error('Profile remove failed from Algolia index', uid)
  }
}

const deleteGroup = async (uid: string) => {
  try {
    await Service.Algolia.groupIndex.deleteObject(uid)
  } catch (e) {
    logger.error('Profile remove failed from Algolia index', uid)
  }
}

const updateGroup = async (group: Carry.Group, old?: any) => {
  if (!group.name || (!old && group.visibility !== 'public')) {
    logger.log('Group not updated in Algolia index', group)
    return
  }

  const algoliaObject = {
    objectID: group.id,
    id: group.id,
    name: group.name || '',
    image: group.image,
    memberCount: group.memberCount,
    verified: group.verified || 'none',
    activeGoal: group.activeGoal,
    // members: group.members,
    activity: group.activity || 60,
    ageFrom: group.ageFrom || 0,
    ageTo: group.ageTo || 100,
    location: group.location,
    _geoloc: {
      lat: group.locationLatLng?.latitude || 40.6971478,
      lng: group.locationLatLng?.longitude || -74.2605469,
    },
    activityAvg: group.activityAvg,
    activityToday: group.activityToday,
  }

  // if (
  //   old &&
  //   algoliaObject.name === old.name &&
  //   algoliaObject.image === old.image &&
  //   algoliaObject.memberCount === old.memberCount &&
  //   algoliaObject.activeGoal === old.activeGoal &&
  //   algoliaObject.verified === old.verified &&
  //   algoliaObject.activity === old.activity &&
  //   algoliaObject.ageFrom === old.ageFrom &&
  //   algoliaObject.ageTo === old.ageTo &&
  //   algoliaObject.location === old.location &&
  //   algoliaObject._geoloc.lat === old.geopoint?.latitude &&
  //   algoliaObject._geoloc.lng === old.geopoint?.longitude
  // )
  //   return

  if (group.deleted && !old.deleted) {
    await deleteGroup(group.id)
  }

  try {
    await Service.Algolia.groupIndex.saveObject(algoliaObject)
  } catch (e) {
    logger.error('Group update failed in Algolia index', group.id)
  }
}

const updateGoal = async (goal: Carry.Goal, old: any = {}) => {
  if (!goal.uid || !goal.name || goal.visibility === 'private') {
    logger.log('Profile not updated in Algolia index', goal)
    return
  }

  const algoliaObject = {
    objectID: goal.uid,
    id: goal.uid,
    name: goal.name,
  }

  if (algoliaObject.name === old.name) return

  try {
    await Service.Algolia.usersIndex.saveObject(algoliaObject)
  } catch (e) {
    logger.error('Profile update failed in Algolia index', goal.uid)
  }
}

export default {
  deleteUser,
  updateUser,
  updateGroup,
  deleteGroup,
  updateGoal,
}
