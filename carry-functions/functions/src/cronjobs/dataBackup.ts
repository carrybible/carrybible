const functions = require('firebase-functions');
const firestore = require('@google-cloud/firestore');
const client = new firestore.v1.FirestoreAdminClient();

const bucket = 'gs://carry-data-backup';

const dataBackup = functions.pubsub
  .schedule('every 24 hours')
  .onRun(() => {


    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;

    if (projectId == "carry-live") {
      const databaseName =
        client.databasePath(projectId, '(default)');

      return client.exportDocuments({
        name: databaseName,
        outputUriPrefix: bucket,
        // Leave collectionIds empty to export all collections
        // or set to a list of collection IDs to export,
        // collectionIds: ['users', 'posts']
        collectionIds: []
      })
        .then((responses: any[]) => {
          const response = responses[0];
          console.log(`Operation Name: ${response['name']}`);
        })
        .catch((err: any) => {
          functions.logger.error(err);
          throw new Error('Export operation failed');
        });
    }

  });

export default dataBackup
