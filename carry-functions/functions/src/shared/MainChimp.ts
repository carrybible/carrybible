import mailchimp from '@mailchimp/mailchimp_transactional'
import * as functions from 'firebase-functions'
import { generateBranchIOLoginLink } from './Branch'
import Service from './Service'
const mailchimpClient = mailchimp(functions.config().mailchimp.key)

export const sendLoginLink = async (userName: string, orgName: string, link: string, email: string) => {
  const response = await mailchimpClient.messages.sendTemplate({
    template_name: 'email-login-link',
    template_content: [],
    message: {
      merge: true,
      merge_language: 'mailchimp',
      subject: 'Login to Carry Dashboard',
      from_name: 'Carry',
      from_email: 'auth@carrybible.com',
      to: [
        {
          name: userName,
          type: 'to',
          email,
        },
      ],
      global_merge_vars: [
        {
          name: 'MINISTRYNAME',
          content: orgName,
        },
        {
          name: 'INVITELINK',
          content: link,
        },
      ],
      tags: ['invite-login'],
    },
  })
  return response as mailchimp.MessagesSendResponse[]
}

export const sendLoginAppLink = async (
  userName: string,
  orgName: string,
  loginLink: string,
  email: string,
  appName: string,
) => {
  const branchIOLink = await generateBranchIOLoginLink(loginLink, appName)

  if (Service.Firebase.appCheck().app.options.projectId !== 'carry-live') {
    // To login other dev account
    functions.logger.info('LOGIN APP WITH EMAIL', email, 'BY LINK', { branchIOLink })
  }

  const getAppName = () => {
    return 'Carry App'
  }
  const getFromName = () => {
    return 'Carry'
  }
  const getFromEmail = () => {
    return 'auth@carrybible.com'
  }

  const response = await mailchimpClient.messages.sendTemplate({
    template_name: 'app-login-link',
    template_content: [],
    message: {
      merge: true,
      merge_language: 'mailchimp',
      subject: `Login to ${getAppName()}`,
      from_name: getFromName(),
      from_email: getFromEmail(),
      to: [
        {
          name: userName,
          type: 'to',
          email,
        },
      ],
      global_merge_vars: [
        {
          name: 'SUBJECT',
          content: `Login to ${getAppName()}`,
        },
        {
          name: 'MINISTRYNAME',
          content: orgName,
        },
        {
          name: 'LOGINLINK',
          content: branchIOLink,
        },
      ],
      tags: ['login-app-link'],
    },
  })
  return response as mailchimp.MessagesSendResponse[]
}

export const sendInviteGroupLeader = async ({
  senderName,
  receiverName,
  orgName,
  link,
  receiverEmail,
  groupImage,
  groupName,
}: {
  senderName: string
  receiverName: string
  orgName: string
  groupName: string
  link: string
  receiverEmail: string
  groupImage: string
}) => {
  const response = await mailchimpClient.messages.sendTemplate({
    template_name: 'group-leader-invite',
    template_content: [],
    message: {
      merge: true,
      merge_language: 'mailchimp',
      subject: 'Leader invitation',
      from_name: 'Carry',
      from_email: 'invite@carrybible.com',
      to: [
        {
          name: receiverName,
          type: 'to',
          email: receiverEmail,
        },
      ],
      global_merge_vars: [
        {
          name: 'SUBJECT',
          content: 'Leader invitation',
        },
        {
          name: 'GROUPIMAGEURL',
          content: groupImage,
        },
        {
          name: 'ORGNAME',
          content: orgName,
        },
        {
          name: 'GROUPNAME',
          content: groupName,
        },
        {
          name: 'INVITENAME',
          content: senderName,
        },
        {
          name: 'INVITELINK',
          content: link,
        },
      ],
      tags: ['group-leader-invite'],
    },
  })
  return response as mailchimp.MessagesSendResponse[]
}

export const sendDashboardInvite = async ({
  senderName,
  receiverName,
  orgName,
  orgImage,
  link,
  receiverEmail,
}: {
  senderName: string
  receiverName: string
  orgName: string
  orgImage: string
  link: string
  receiverEmail: string
}) => {
  const response = await mailchimpClient.messages.sendTemplate({
    template_name: 'dashboard-invite',
    template_content: [],
    message: {
      merge: true,
      merge_language: 'mailchimp',
      subject: 'Join your ministry team on Carry',
      from_name: 'Carry',
      from_email: 'invite@carrybible.com',
      to: [
        {
          name: receiverName,
          type: 'to',
          email: receiverEmail,
        },
      ],
      global_merge_vars: [
        {
          name: 'SUBJECT',
          content: 'Join your ministry team on Carry',
        },
        {
          name: 'ORGIMAGEURL',
          content: orgImage,
        },
        {
          name: 'ORGNAME',
          content: orgName,
        },
        {
          name: 'INVITENAME',
          content: senderName,
        },
        {
          name: 'INVITELINK',
          content: link,
        },
      ],
      tags: ['dashboard-invite'],
    },
  })
  return response as mailchimp.MessagesSendResponse[]
}

export const sendGroupInvite = async ({
  senderName,
  receiverName,
  receiverEmail,
  orgName,
  link,
}: {
  senderName: string
  receiverName: string
  receiverEmail: string
  orgName: string
  link: string
}) => {
  const response = await mailchimpClient.messages.sendTemplate({
    template_name: 'group-invite',
    template_content: [],
    message: {
      merge: true,
      merge_language: 'mailchimp',
      subject: 'Group invitation',
      from_name: 'Carry',
      from_email: 'invite@carrybible.com',
      to: [
        {
          name: receiverName,
          type: 'to',
          email: receiverEmail,
        },
      ],
      global_merge_vars: [
        {
          name: 'SUBJECT',
          content: 'Group invitation',
        },
        {
          name: 'MINISTRYNAME',
          content: orgName,
        },
        {
          name: 'FNAME',
          content: receiverName,
        },
        {
          name: 'LEADERNAME',
          content: senderName,
        },
        {
          name: 'GROUPLINK',
          content: link,
        },
      ],
      tags: ['group-invite'],
    },
  })
  return response as mailchimp.MessagesSendResponse[]
}

export async function sendEmailTemplate(
  fromName: string,
  fromEmail: string,
  templateName: string,
  subject: string,
  toEmail: string,
  toName: string,
  mergeVars?: Array<any>,
): Promise<{ success: boolean; error: string | undefined }> {
  const response = (await mailchimpClient.messages.sendTemplate({
    template_name: templateName,
    template_content: [],
    message: {
      merge: true,
      merge_language: 'mailchimp',
      subject: subject,
      from_name: fromName,
      from_email: fromEmail,
      to: [
        {
          name: toName,
          type: 'to',
          email: toEmail,
        },
      ],
      global_merge_vars: mergeVars || [],
      tags: [templateName],
    },
  })) as mailchimp.MessagesSendResponse[]

  if (response[0].status === 'sent' || response[0].status === 'queued' || response[0].status === 'scheduled') {
    return { success: true, error: undefined }
  } else {
    return { success: false, error: response[0].reject_reason?.toString() }
  }
}

export const sendReceiptEmail = async ({
  userName,
  email,
  orgName,
  amount,
  currency,
  dateTime,
  groupName,
  campaignName,
  card,
}: {
  userName: string
  email: string
  orgName: string
  amount: string
  currency: string
  dateTime: string
  groupName: string
  campaignName: string
  card: string
}) => {
  let templateName = 'giving-receipt-carry'
  let usingName = 'Carry'

  const response = await mailchimpClient.messages.sendTemplate({
    template_name: templateName,
    template_content: [],
    message: {
      merge: true,
      merge_language: 'mailchimp',
      subject: `You've donated ${currency}${amount} to using ${usingName}`,
      from_name: 'Carry',
      from_email: 'giving@carrybible.com',
      to: [
        {
          name: userName,
          type: 'to',
          email,
        },
      ],
      global_merge_vars: [
        {
          name: 'NAME',
          content: userName,
        },
        {
          name: 'ORGNAME',
          content: orgName,
        },
        {
          name: 'AMOUNT',
          content: `${currency}${amount}`,
        },
        {
          name: 'DATE',
          content: dateTime,
        },
        {
          name: 'GROUPNAME',
          content: groupName,
        },
        {
          name: 'CAMPAIGNNAME',
          content: campaignName,
        },
        {
          name: 'CARD',
          content: card,
        },
      ],
      tags: [templateName],
    },
  })
  return response as mailchimp.MessagesSendResponse[]
}

export default {
  sendEmailTemplate,
  sendGroupInvite,
  sendDashboardInvite,
  sendInviteGroupLeader,
  sendLoginAppLink,
  sendLoginLink,
  sendReceiptEmail,
}
