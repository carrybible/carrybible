import { config } from 'firebase-functions'
import mailchimpMarketing from '@mailchimp/mailchimp_marketing'
import { createHash } from 'crypto';

mailchimpMarketing.setConfig({
  server: 'us16',
  apiKey: config().mailchimp_marketing.apikey
})

export async function subscribeNewMember(audienceId: string, email: string, orgId: string = "", tags?: Array<string>) {

  const body: mailchimpMarketing.AddListMemberBody = {
    email_address: email,
    status: 'subscribed',
    email_type: 'html',
    merge_fields: {
      "ORGID": orgId
    }
  }

  if (tags) body.tags = tags;

  const response = await mailchimpMarketing.lists.addListMember(audienceId, body);

  return response;
}

export async function addMemberTags(audienceId: string, email: string, tags: Array<string>) {

  const formattedTags: Array<{ name: string, status: string }> = [];

  for (const tag of tags) {
    formattedTags.push({ name: tag, status: "active" })
  }

  await updateMemberTags(audienceId, email, formattedTags)

}

export async function removeMemberTags(audienceId: string, email: string, tags: Array<string>) {

  const formattedTags: Array<{ name: string, status: string }> = [];

  for (const tag of tags) {
    formattedTags.push({ name: tag, status: "inactive" })
  }

  await updateMemberTags(audienceId, email, formattedTags)


}

async function updateMemberTags(audienceId: string, email: string, tags: Array<{ name: string, status: string }>) {
  const emailHash = createHash('md5').update(email).digest('hex')


  await mailchimpMarketing.lists.updateListMemberTags(audienceId, emailHash, { tags: tags, is_syncing: false })


}


export default {
  subscribeNewMember,
  addMemberTags,
  removeMemberTags
}