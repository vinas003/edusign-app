/**
 * @module init-app/database
 * @desc Here we create the IndexedDB db that will persst the documents n the session between sessions
 */

import { addNotification } from "slices/Notifications";

let db = null;

export async function getDb() {
  if (db === null) {
    const promisedDb = await new Promise((resolve) => {
      const request = indexedDB.open("eduSignDB", 1);
      request.onsuccess = () => {
        console.log("Loaded db from disk");
        db = request.result;
        resolve(db);
      };
      request.onerror = (event) => {
        console.log("Problem opening eduSign db", event);
        resolve(null);
      };
      request.onupgradeneeded = (event) => {
        console.log("Loaded db from disk, upgrading...");
        db = request.result;
        if (event.oldVersion < 1) {
          db.createObjectStore("documents", {
            keyPath: "id",
            autoIncrement: true,
          });
        }
        event.target.transaction.oncomplete = () => {
          resolve(db);
        };
      };
    });
    return promisedDb;
  } else {
    return db;
  }
}

const getDocStore = () => {
  if (db !== null) {
    const transaction = db.transaction(["documents"], "readwrite");
    transaction.onerror = (event) => {
      console.log("cannot create a db transaction", event);
    };
    return transaction.objectStore("documents");
  } else {
    console.log("No persistent state, db absent");
    return null;
  }
};

const documentDo = (action, document) => {
  const docStore = getDocStore();
  if (docStore !== null) {
    let docRequest = null;
    if (action === "saving") {
      console.log("saving document to db", document.name);
      docRequest = docStore.put(document);
    } else if (action === "removing") {
      console.log("removing document from db", document.name);
      docRequest = docStore.delete(document.id);
    }
    docRequest.onerror = (event) => {
      console.log(`Problem {action} document`, document.name, "Error:", event);
    };
  } else {
    console.log(`Problem {action} document, db absent`);
  }
};

export const dbSaveDocument = (document) => {
  documentDo("saving", document);
};

export const dbRemoveDocument = (document) => {
  documentDo("removing", document);
};

export const clearDocStore = (dispatch) => {
  const docStore = getDocStore();
  if (docStore !== null) {
    console.log("clearing the db");
    const docRequest = docStore.clear();
    docRequest.onerror = (event) => {
      console.log("Problem clearing the db", "Error:", event);
      dispatch(
        addNotification({
          level: "danger",
          message: "XXX problem clearing db, please try again",
        })
      );
    };
  } else {
    console.log("Problem clearing the state, db absent");
    dispatch(
      addNotification({ level: "danger", message: "XXX no persistent state" })
    );
  }
};
