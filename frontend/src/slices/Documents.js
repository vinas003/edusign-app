/**
 * @module slices/Documents
 * @desc Here we define the initial state for the documents key of the Redux state,
 * and the actions and reducers to manipulate it.
 *
 * The documents key of the state holds the documents added by the user to be signed.
 */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

import {
  postRequest,
  checkStatus,
  preparePayload,
  processResponseData,
} from "slices/fetch-utils";
import { addNotification } from "slices/Notifications";

/**
 * @public
 * @function fetchConfig
 * @desc Redux async thunk to get configuration data from the backend.
 */
export const prepareDocument = createAsyncThunk(
  "main/prepareDocument",
  async (document, thunkAPI) => {
    const body = preparePayload(thunkAPI.getState(), document);
    let data = null;
    try {
      const response = await fetch("/sign/add-doc", {
        ...postRequest,
        body: body,
      });
      data = await checkStatus(response);
    } catch (err) {
      thunkAPI.dispatch(
        addNotification({ level: "danger", message: "comm prob XXX TODO" })
      );
      return thunkAPI.rejectWithValue({
        ...document,
        state: "failed",
        reason: err.toString(),
      });
    }
    if ("message" in data) {
      const level = data.error ? "danger" : "success";
      thunkAPI.dispatch(
        addNotification({ level: level, message: data.message })
      );
    }
    if ("payload" in data) {
      const updatedDoc = {
        ...document,
        ...data.payload,
        state: "loaded",
      };
      return updatedDoc;
    }
    return thunkAPI.rejectWithValue({
      ...document,
      state: "failed",
      reason: data.message,
    });
  }
);

const documentsSlice = createSlice({
  name: "documents",
  initialState: {
    documents: [],
  },
  reducers: {
    /**
     * @public
     * @function addDocument
     * @desc Redux action to add a document to the documents state key, setting its name, size and type,
     * and setting the the show key to false, the blob key to null and the state key to "loading".
     */
    addDocument(state, action) {
      state.documents.push({
        // action.payload carries keys: name, size, type, and blob
        ...action.payload,
        show: false,
        state: "loading",
      });
    },
    /**
     * @public
     * @function updateDocument
     * @desc Redux action to update a document in the documents state key,
     * setting the blob key to the contents of the file as a base64 data URL, and the state key to "loaded".
     */
    updateDocument(state, action) {
      state.documents = state.documents.map((doc) => {
        if (doc.name === action.payload.name) {
          return {
            ...action.payload,
            state: "loading",
          };
        } else {
          return {
            ...doc,
          };
        }
      });
    },
    /**
     * @public
     * @function showPreview
     * @desc Redux action to update a document in the documents state key,
     * setting the show key to true (so that the UI will show a preview of the document).
     */
    showPreview(state, action) {
      state.documents = state.documents.map((doc, index) => {
        if (index === action.payload) {
          return {
            ...doc,
            show: true,
          };
        } else {
          return {
            ...doc,
          };
        }
      });
    },
    /**
     * @public
     * @function hidePreview
     * @desc Redux action to update a document in the documents state key,
     * setting the show key to false (so that the UI will hide the preview of the document).
     */
    hidePreview(state, action) {
      state.documents = state.documents.map((doc, index) => {
        if (index === action.payload) {
          return {
            ...doc,
            show: false,
          };
        } else {
          return {
            ...doc,
          };
        }
      });
    },
    /**
     * @public
     * @function hidePreview
     * @desc Redux action to remove a document from the documents state key.
     */
    removeDocument(state, action) {
      state.documents = state.documents.filter((doc, index) => {
        return index !== action.payload;
      });
    },
    /**
     * @public
     * @function startSigning
     * @desc Redux action to update a document in the documents state key,
     * setting the state key to "signing"
     */
    startSigning(state, action) {
      state.documents = state.documents.map((doc, index) => {
        if (index === action.payload) {
          return {
            ...doc,
            state: "signing",
          };
        } else {
          return {
            ...doc,
          };
        }
      });
    },
    /**
     * @public
     * @function setSigned
     * @desc Redux action to update a document in the documents state key,
     * setting the state key to "signed"
     */
    setSigned(state, action) {
      state.documents = state.documents.map((doc, index) => {
        if (index === action.payload) {
          return {
            ...doc,
            state: "signed",
          };
        } else {
          return {
            ...doc,
          };
        }
      });
    },
  },
  extraReducers: {
    [prepareDocument.fulfilled]: (state, action) => {
      state.documents = state.documents.map((doc) => {
        if (doc.name === action.payload.name) {
          return {
            ...action.payload,
          };
        } else {
          return {
            ...doc,
          };
        }
      });
    },

    [prepareDocument.rejected]: (state, action) => {
      state.documents = state.documents.map((doc) => {
        if (doc.name === action.payload.name) {
          return {
            ...action.payload,
          };
        } else {
          return {
            ...doc,
          };
        }
      });
    },
  },
});

export const {
  addDocument,
  updateDocument,
  showPreview,
  hidePreview,
  removeDocument,
  startSigning,
  setSigned,
} = documentsSlice.actions;

export default documentsSlice.reducer;
