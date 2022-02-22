import React from "react";
import PropTypes from "prop-types";
import { FormattedMessage, injectIntl } from "react-intl";
import Button from "react-bootstrap/Button";

import ForcedPreviewContainer from "containers/ForcedPreview";
import DocPreviewContainer from "containers/DocPreview";
import InviteFormContainer from "containers/InviteForm";
import OwnedContainer from "containers/Owned";
import InvitedContainer from "containers/Invited";
import { preparePDF } from "components/utils";
import ConfirmDialogContainer from "containers/ConfirmDialog";
import DocumentLocal from "components/DocumentLocal";
import DocumentTemplate from "components/DocumentTemplate";
import DocumentOwned from "components/DocumentOwned";
import { ESTooltip } from "containers/Overlay";

import "styles/DocManager.scss";
import "styles/Invitation.scss";

/**
 * @desc This component provides a representation of the documents in the session.
 *
 * Each document can be in one of several states:
 * - "loading": The document is being loaded from the filesystem.
 * - "failed-loading": PDFjs has not been able to parse the document, irrecoverable failure.
 * - "failed-preparing": There's been som problem sending the document to the backend and API to be prepared, recoverable.
 * - "loaded": The document has been loaded from the fs and is ready to be signed.
 * - "signing": The document is in the process of being signed.
 * - "failed-signing": There's been some problem in the signing process, recoverable failure.
 * - "signed": The document has been signed and is ready to be got by the user.
 *
 * Depending on the state, it will show a different set of controls.
 * @component
 */
class DocManager extends React.Component {
  render() {
    let disableSigning = true;
    let disableDlAllButton = true;
    [this.props.pending, this.props.owned].forEach((docs) => {
      docs.forEach((doc) => {
        if (doc.state === "selected") {
          disableSigning = false;
        } else if (doc.state === "signed") {
          disableDlAllButton = false;
        }
      });
    });
    let disableClearButton = true;

    return (
      <>
        {this.props.unauthn && this.props.invitedUnauthn && (
          <>
            <div className="invited-unauthn-title">
              <FormattedMessage
                defaultMessage="You have been invited to sign the following document(s)"
                key="invited-unauthn-title"
              />
            </div>
          </>
        )}
        {this.props.unauthn && !this.props.invitedUnauthn && (
          <>
            <div className="invited-unauthn-title">
              <FormattedMessage
                defaultMessage="No documents to sign"
                key="unauthn-title"
              />
            </div>
            <div className="invited-unauthn-text">
              <FormattedMessage
                defaultMessage="You are currently not invited to sign any documents. The organization/identity provider you are affiliated with does not have permission to upload your own documents into eduSign to sign. Please contact your IT-department if you would like to be able to sign your own documents or invite others to sign your documents."
                key="unauthn-text"
              />
            </div>
          </>
        )}
        {!this.props.unauthn && (
          <>
            {this.props.templates.length > 0 && (
              <fieldset className="local-template-container">
                <legend>
                  <FormattedMessage
                    defaultMessage="Templates"
                    key="local-templates-legend"
                  />
                </legend>
                {this.props.templates.map((doc, index) => {
                  const docFile = preparePDF(doc);
                  return (
                    <React.Fragment key={index}>
                      <DocumentTemplate key={index} doc={doc} {...this.props} />
                      <ConfirmDialogContainer
                        confirmId={"confirm-remove-template-" + doc.name}
                        title={this.props.intl.formatMessage({
                          defaultMessage: "Confirm Removal of template",
                          id: "header-confirm-remove-template-title",
                        })}
                        mainText={this.props.intl.formatMessage({
                          defaultMessage:
                            'Clicking "Confirm" will remove the template',
                          id: "header-confirm-remove-template-text",
                        })}
                        confirm={this.props.handleTemplateRemove(doc.id)}
                      />
                      <DocPreviewContainer
                        doc={doc}
                        docFile={docFile}
                        handleClose={this.props.handleCloseTemplatePreview}
                      />
                      <InviteFormContainer
                        docId={doc.id}
                        docName={doc.name}
                        isTemplate={true}
                      />
                    </React.Fragment>
                  );
                })}
              </fieldset>
            )}
            {this.props.documents.length > 0 && (
              <fieldset className="local-monosign-container">
                <legend>
                  <FormattedMessage
                    defaultMessage="Personal documents"
                    key="local-monosign-legend"
                  />
                </legend>
                {this.props.documents.map((doc, index) => {
                  disableClearButton = false;
                  if (doc.state === "signed") {
                    disableDlAllButton = false;
                  }
                  const docFile = preparePDF(doc);
                  if (docFile === null) {
                    doc = {
                      ...doc,
                      state: "failed-loading",
                      message: this.props.intl.formatMessage({
                        defaultMessage: "Malformed PDF",
                        id: "malformed-pdf",
                      }),
                    };
                  }
                  if (doc.state === "selected") disableSigning = false;

                  let docRepr = null;
                  if (doc.hasOwnProperty("pending")) {
                    const _docRepr = (
                      <DocumentOwned key={index} doc={doc} {...this.props} />
                    );
                    if (doc.state === "signed") {
                      docRepr = (
                        <>
                          {_docRepr}
                          <ConfirmDialogContainer
                            confirmId={
                              "confirm-remove-signed-owned-" + doc.name
                            }
                            title={this.props.intl.formatMessage({
                              defaultMessage:
                                "Confirm Removal of signed invitation",
                              id: "header-confirm-remove-signed-owned-title",
                            })}
                            mainText={this.props.intl.formatMessage({
                              defaultMessage:
                                'Clicking "Confirm" will remove the document',
                              id: "header-confirm-remove-owned-signed-text",
                            })}
                            confirm={this.props.handleSignedRemove(doc.name)}
                          />
                        </>
                      );
                    } else {
                      docRepr = _docRepr;
                    }
                  } else {
                    docRepr = (
                      <DocumentLocal key={index} doc={doc} {...this.props} />
                    );
                  }
                  return (
                    <React.Fragment key={index}>
                      {docRepr}
                      {doc.state === "unconfirmed" && (
                        <ForcedPreviewContainer
                          doc={doc}
                          docFile={docFile}
                          index={doc.name}
                          handleClose={this.props.handleCloseForcedPreview}
                          handleConfirm={this.props.handleConfirmForcedPreview}
                          handleUnConfirm={
                            this.props.handleUnConfirmForcedPreview
                          }
                        />
                      )}
                      {["loaded", "selected", "failed-signing"].includes(
                        doc.state
                      ) && (
                        <DocPreviewContainer
                          doc={doc}
                          docFile={docFile}
                          handleClose={this.props.handleClosePreview}
                        />
                      )}
                      {["loaded", "selected", "signed"].includes(doc.state) && (
                        <InviteFormContainer
                          docId={doc.id}
                          docName={doc.name}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </fieldset>
            )}
          </>
        )}
        <div className={"multisign-container-" + this.props.size}>
          {!this.props.unauthn && (
            <>
              {this.props.owned.length > 0 && (
                <fieldset className="owned-multisign-container">
                  <legend>
                    <FormattedMessage
                      defaultMessage="Documents you have invited others to sign"
                      key="owned-multisign-legend"
                    />
                  </legend>
                  <OwnedContainer />
                </fieldset>
              )}
            </>
          )}
          {this.props.pending.length > 0 && (
            <fieldset className="invited-multisign-container">
              <legend>
                <FormattedMessage
                  defaultMessage="Documents you are invited to sign"
                  key="invited-multisign-legend"
                />
              </legend>
              <InvitedContainer />
            </fieldset>
          )}
        </div>
        <div id="adjust-vertical-space" />
        <div id="global-buttons-wrapper">
          <div className="button-sign-flex-item">
            <ESTooltip
              tooltip={
                <FormattedMessage
                  defaultMessage="Select documents above and click here to send them for signing."
                  key="button-sign-tootip"
                />
              }
            >
              <div id="button-sign-wrapper">
                <Button
                  variant="success"
                  id="button-sign"
                  size="lg"
                  disabled={disableSigning}
                  style={disableSigning ? { pointerEvents: "none" } : {}}
                  onClick={this.props.handleSubmitToSign.bind(this)}
                >
                  <FormattedMessage
                    defaultMessage="Sign Selected Documents"
                    key="sign-selected-button"
                  />
                </Button>
              </div>
            </ESTooltip>
          </div>
          {!this.props.unauthn && (
            <>
              <div className="button-dlall-flex-item">
                <ESTooltip
                  tooltip={
                    <FormattedMessage
                      defaultMessage="Download all signed documents."
                      key="button-dlall-tootip"
                    />
                  }
                >
                  <div id="button-dlall-wrapper">
                    <Button
                      variant="success"
                      id="button-dlall"
                      disabled={disableDlAllButton}
                      data-testid="button-dlall"
                      style={
                        disableDlAllButton ? { pointerEvents: "none" } : {}
                      }
                      size="lg"
                      onClick={this.props.handleDownloadAll.bind(this)}
                    >
                      <FormattedMessage
                        defaultMessage="Download All Signed"
                        key="dlall-selected-button"
                      />
                    </Button>
                  </div>
                </ESTooltip>
              </div>
              <div className="button-clear-flex-item">
                <ESTooltip
                  tooltip={
                    <FormattedMessage
                      defaultMessage='Discard all documents in the "Personal documents" list above'
                      key="clear-docs-tootip"
                    />
                  }
                >
                  <div id="button-clear-wrapper">
                    <Button
                      variant="primary"
                      id="clear-session-button"
                      disabled={disableClearButton}
                      size="lg"
                      style={
                        disableClearButton ? { pointerEvents: "none" } : {}
                      }
                      onClick={this.props.showConfirm("confirm-clear-session")}
                    >
                      <FormattedMessage
                        defaultMessage="Clear Personal Documents List"
                        key="clear-session-button"
                      />
                    </Button>
                  </div>
                </ESTooltip>
                <ConfirmDialogContainer
                  confirmId="confirm-clear-session"
                  title={this.props.intl.formatMessage({
                    defaultMessage: "Confirm Clear List",
                    id: "header-confirm-clear-title",
                  })}
                  mainText={this.props.intl.formatMessage({
                    defaultMessage:
                      'Clicking "Confirm" will remove all documents from your list',
                    id: "header-confirm-clear-text",
                  })}
                  confirm={this.props.clearDb}
                />
              </div>
            </>
          )}
        </div>
        {this.props.destinationUrl !== undefined &&
          this.props.destinationUrl !== "https://dummy.destination.url" && (
            <div>
              <form
                id="signing-form"
                data-testid="signing-form"
                action={this.props.destinationUrl}
                method="post"
              >
                <input
                  type="hidden"
                  name="Binding"
                  value={this.props.binding}
                />
                <input
                  type="hidden"
                  name="RelayState"
                  value={this.props.relayState}
                />
                <input
                  type="hidden"
                  name="EidSignRequest"
                  value={this.props.signRequest}
                />
              </form>
            </div>
          )}
        {this.props.destinationUrl === "https://dummy.destination.url" && (
          <div>
            <form
              id="signing-form"
              data-testid="signing-form"
              onSubmit={(e) => {
                e.preventDefault();
                return false;
              }}
            />
          </div>
        )}
      </>
    );
  }
}

DocManager.propTypes = {
  /**
   * The documents to manage
   */
  documents: PropTypes.array,
  handlePreview: PropTypes.func,
  handleRemove: PropTypes.func,
  handleDlSigned: PropTypes.func,
  handleSubmitToSign: PropTypes.func,
};

export default injectIntl(DocManager);
