import * as functions from 'firebase-functions'
import Mixpanel from 'mixpanel'
import { Service } from '../shared'

const db = Service.Firebase.firestore()

const mixpanel = Mixpanel.init(functions.config().mixpanel.token, {
  protocol: 'https'
});

const updateMixpanel = functions.pubsub.schedule('every 12 hours').onRun(async (context) => {
  const orgData: { [key: string]: string } = {};
  const groupData: { [key: string]: { name: string, members: number } } = {};
  const owners: string[] = [];

  const organisations = await db.collection('organisations').get();
  console.log(`Updating Mixpanel with user organisations. Found ${organisations.size} organisations.`);
  organisations.forEach(doc => {
    orgData[doc.id] = doc.data().name
  });
  const groups = await db.collection('groups').where("organisation.id", "!=", null).get();
  console.log(`Updating Mixpanel with user groups. Found ${groups.size} org-affiliated groups.`);
  groups.forEach(doc => {

    groupData[doc.id] = {
      name: doc.data().name,
      members: doc.data().members.length
    }
    owners.push(doc.data().owner)
  });

  //console.log(groupData)

  const users = await db.collection('users').where("organisation.id", "!=", null).get();
  //console.log(`Updating ${users.size} users`);
  let usersWithGroups = 0;
  let setUsers = 0;
  users.forEach(doc => {

    const mixPanelUpdate: any = {};
    let set = false;

    if (owners.includes(doc.id)) {
      mixPanelUpdate.role = "Leader"
    } else {
      mixPanelUpdate.role = "Member"
    }

    const orgId = doc.data().organisation.id;

    if (orgId !== undefined && orgId !== null) {
      set = true;
      const orgName = orgData[orgId];
      mixPanelUpdate.org = orgName;
      mixPanelUpdate.orgId = orgId;
    }

    let userGroups = doc.data().groups

    if (userGroups === undefined) {
      console.log(`no groups for ${doc.id}`)
    } else {
      userGroups = userGroups.filter((groupId: any) => {
        return groupData.hasOwnProperty(groupId)
      })
    }

    if (userGroups !== undefined && Array.isArray(userGroups) && userGroups.length > 0) {
      usersWithGroups++;
      set = true;
      const groupNames = userGroups.map(groupId => {
        return groupData[groupId].name
      })

      const groupIdsText = userGroups.join(',')
      const groupNamesText = groupNames.join(',')

      let maxId = userGroups[0]
      let max = groupData[maxId].members;
      let maxName = groupData[maxId].name

      for (let groupId of userGroups) {
        if (groupData[groupId].members > max) {
          maxId = groupId;
          max = groupData[groupId].members
          maxName = groupData[groupId].name
        }
      }

      mixPanelUpdate.mainGroupId = maxId;
      mixPanelUpdate.mainGroupName = maxName

      mixPanelUpdate.groupIds = groupIdsText;
      mixPanelUpdate.groups = groupNamesText;
    }

    if (set) {
      setUsers++;
      mixpanel.people.set(doc.id, mixPanelUpdate, {
        $ignore_time: true
      });
    }

  });
  functions.logger.info(`Found ${usersWithGroups} users with groups in their profiles. Updated ${setUsers} profiles.`);
})

export default updateMixpanel