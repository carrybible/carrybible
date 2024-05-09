import { UserRecord } from 'firebase-admin/auth';
import { RuntimeOptions, runWith } from 'firebase-functions'
import { Service } from '../shared'
import { sendEmailTemplate } from '../shared/MainChimp';
import { randomUUID } from 'crypto';

const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 300,
  memory: '1GB',
}

const db = Service.Firebase.firestore()
const auth = Service.Firebase.auth();
const DASHBOARD_URL: string = Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? "https://dashboard.carrybible.com/" : "https://carry-dev-dashboard.vercel.app/";
const devPrefix: string = Service.Firebase.appCheck().app.options.projectId === 'carry-live'
  ? '' : '[Dev] ';
const carryUID: string =
  Service.Firebase.appCheck().app.options.projectId === 'carry-live'
    ? 'AIQdLRFdueYaW3ajagenSZSc3dj1'
    : 'HdyQHE15jDX4fB1CA6cIUoMU45G2';

export default runWith(runtimeOpts).https.onRequest(async (req, res) => {

  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  res.set('Access-Control-Allow-Methods', 'POST');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
  } else if (req.method === "POST") {

    let email = req.body.email;
    let name = req.body.name;
    let orgId = req.body.orgId;

    let campusId;
    let userUpdateSuccess = false;



    if (email) {
      try {
        if (!orgId) {

          const orgs = (await db.collection("organisations").where("mainEmail", "==", email).get()).docs

          if (orgs.length > 0) {
            if (orgs.length > 1) console.log(`multiple orgs with the same email ${email}`)
            orgId = orgs[0].id
          }

          if (!orgId) {
            const videos = (await db.collection("videos").where("email", "==", email).get()).docs

            if (videos.length > 0) {
              orgId = videos[0].data().orgId
            }
          }

          if (!orgId) {

            console.info(`Cannot find org for email ${email}, creating a new org and campus`)

            const namePosessive = name.slice(-1) === 's' ? `${name}'` : `${name}'s`;
            const orgName = name ? `${namePosessive} Free Trial` : 'Free Trial';
            const orgImage = "https://storage.googleapis.com/carry-public/images/org/carry-logo.png";

            orgId = await createOrg(orgName, orgImage, email, "survey-free-trial")
            campusId = await createCampus(orgId, orgName, orgImage);
          }
        }

        if (!orgId) throw new Error(`No org Id to upgrade from ${email}`)

        const orgRef = db.collection("organisations").doc(orgId)
        const orgData = (await orgRef.get()).data()

        if (!orgData) throw new Error(`${orgId} does not have any org data`)

        if (!email) {
          if (orgData.mainEmail) {
            email = orgData.mainEmail
          }
        }

        if (orgData?.mainCampus) campusId = orgData.mainCampus;

        if (!campusId) {
          const campuses = (await db.collection("organisations").doc(orgId).collection("campuses").limit(1).get()).docs

          if (campuses.length > 0) {
            campusId = campuses[0].id
          } else {
            const namePosessive = name.slice(-1) === 's' ? `${name}'` : `${name}'s`;
            const orgName = name ? `${namePosessive} Free Trial` : 'Free Trial';
            const orgImage = "https://storage.googleapis.com/carry-public/images/org/carry-logo.png";
            campusId = await createCampus(orgId, orgName, orgImage);
            console.log(`Created campus ${campusId} `)
          }
        }

        if (orgData.subscription.name === "Grow" ||
          orgData.subscription.name === "Church" ||
          orgData.subscription.name === "Enterprise") throw new Error('Cannot upgrade org with an existing subscription');

        const today = new Date();
        const expires = new Date(today.getFullYear(), today.getMonth() + 2, 0);

        let subscription = {
          active: true,
          name: "Grow Free Trial",
          memberCap: 30,
          videoCap: 4,
          groupCap: 3,
          expires: expires,
        }

        const orgUpdate: any = {
          mainEmail: orgData.mainEmail || email,
          subscription: subscription
        }

        await orgRef.update(orgUpdate)

        let userRecord: UserRecord;

        console.info(`Getting firebase auth`)
        try {
          userRecord = await auth.getUserByEmail(email)
        } catch (e) {
          console.info(`Creating new firebase auth`)
          userRecord = await auth.createUser({
            email: email,
            password: randomUUID()
          })
        }

        const userRef = db.collection("users").doc(userRecord.uid)
        let userExists = (await userRef.get()).exists

        let counter = 0;

        while (!userExists && counter <= 5) {
          console.log("User not found, waiting for auth hook to complete " + counter)
          await new Promise(resolve => setTimeout(resolve, 5000));
          userExists = (await userRef.get()).exists
          counter++
        }

        const userUpdate: any = {
          name: name,
          email: email,
          organisation: {
            id: orgId,
            campusId: campusId,
            role: 'campus-user'
          }
        }

        try {
          console.info(`Updating user data`)
          await userRef.update(userUpdate)
          userUpdateSuccess = true;

        } catch (e) {
          console.warn("Can't update user record");
          console.log(e)
        }

        //console.log(userUpdateresponse);

      } catch (e) {
        if (e instanceof Error) {
          console.log(`Error processing free trial`)
          console.log(e.stack || e.name)
          userUpdateSuccess = false;
        }
      }

      if (userUpdateSuccess && email) {
        console.info(`Sending email to ${email}`)

        const mergeVars = [
          {
            name: 'LOGINLINK',
            content: DASHBOARD_URL,
          },
        ]

        const userEmailResponse = await sendEmailTemplate(
          "Carry",
          "hello@carrybible.com",
          "free-trial-unlocked",
          devPrefix + "Your 1-month Carry trial 🔓",
          email,
          name || "Carry User",
          mergeVars
        )

        console.log(userEmailResponse);

        res.status(200).send();

      } else {
        res.status(400).send({ error: "Missing data." })
      }
    } else {
      res.status(405).send();
    }
  }

  async function createOrg(orgName: string, orgImage: string, mainEmail: string, source = "study-creator", subscription?: any) {
    const org: any = {
      id: '',
      image: orgImage,
      name: orgName,
      mainEmail: mainEmail,
      source: source
    }

    if (subscription) {
      org.subscription = subscription;
    } else {
      org.subscription = {
        active: true,
        name: "Free",
        memberCap: 15,
        videoCap: 2
      }
    }

    const orgRef = await db.collection('organisations').doc()

    org.id = orgRef.id

    await orgRef.set(org)

    return orgRef.id;
  }
});

async function createCampus(orgId: string, campusName: string, campusImage: string) {
  const campusRef = await db.collection('organisations').doc(orgId).collection('campuses').doc()

  const createdDate = new Date()

  const campus = {
    name: campusName,
    organisationId: orgId,
    createBy: carryUID,
    owner: carryUID,
    created: createdDate,
    updated: createdDate,
    image: campusImage,
    id: campusRef.id,
  }

  await campusRef.set(campus);
}
