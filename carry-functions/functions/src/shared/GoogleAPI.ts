import { androidpublisher_v3, google } from 'googleapis'
import Androidpublisher = androidpublisher_v3.Androidpublisher

// PRO KEY - CARRY-PROD
const key = {
  type: 'service_account',
  project_id: 'carry-live',
  private_key_id: '',
  private_key: '',
  client_email: '',
  client_id: '',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: '',
}

const androidPublisherScope = 'https://www.googleapis.com/auth/androidpublisher'

export const getClient = () => {
  return google.auth.getClient({
    scopes: androidPublisherScope,
    credentials: key,
  })
}

export const getSubscriptionData = ({
  auth,
  packageName,
  subscriptionId,
  token,
}: {
  auth: any
  packageName: string
  subscriptionId: string
  token: string
}) => {
  const androidPublisher = new Androidpublisher({
    auth: auth,
  })
  return androidPublisher.purchases.subscriptions.get({
    packageName,
    subscriptionId,
    token,
  })
}

export default {
  getClient,
  getSubscriptionData,
}
