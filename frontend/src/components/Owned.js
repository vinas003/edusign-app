import React, { Component } from "react";
import PropTypes from "prop-types";
import { FormattedMessage, injectIntl } from "react-intl";
import Button from "react-bootstrap/Button";
import OverlayTrigger from "containers/Overlay";
import Tooltip from "react-bootstrap/Tooltip";
import Popover from "react-bootstrap/Popover";
import PopoverContent from "react-bootstrap/PopoverContent";
import PopoverTitle from "react-bootstrap/PopoverTitle";
import ConfirmDialogContainer from "containers/ConfirmDialog";

import ReInviteFormContainer from "containers/ReInviteForm";
import DocPreviewContainer from "containers/DocPreview";
import { docToFile, humanFileSize } from "components/utils";
import LittleSpinner from "components/LittleSpinner";

import "styles/Invitation.scss";

const selectDoc = (index, doc, props) => {
  return (
    <>
      <div className="doc-selector-flex-item">
        <OverlayTrigger
          delay={{ show: DELAY_SHOW_HELP, hide: DELAY_HIDE_HELP }}
          trigger={["hover", "focus"]}
          rootClose={true}
          overlay={(props) => (
            <Tooltip id="tooltip-select-owned-doc" {...props}>
              <FormattedMessage
                defaultMessage="Select the document for signing"
                key="select-doc-tootip"
              />
            </Tooltip>
          )}
        >
          <input
            type="checkbox"
            id={"owned-doc-selector-" + index}
            name={"owned-doc-selector-" + index}
            data-testid={"owned-doc-selector-" + index}
            onChange={props.handleDocSelection(doc.name)}
            checked={doc.state === "selected"}
          />
        </OverlayTrigger>
      </div>
    </>
  );
};
const dummySelectDoc = () => {
  return (
    <>
      <div className="doc-selector-flex-item" />
    </>
  );
};

const docName = (doc) => {
  return <div className="name-flex-item">{doc.name}</div>;
};
const docSize = (doc) => {
  return <div className="size-flex-item">{humanFileSize(doc.size)}</div>;
};

const namedSpinner = (index, name) => {
  return (
    <>
      <LittleSpinner index={index} />
      <div className="spinning-flex-item">{` ${name} ...`}</div>
    </>
  );
};

const skipSignatureButton = (props, doc, help) => {
  return (
    <>
      <OverlayTrigger
        delay={{ show: DELAY_SHOW_HELP, hide: DELAY_HIDE_HELP }}
        trigger={["hover", "focus"]}
        overlay={<Tooltip placement="auto">{help}</Tooltip>}
      >
        <div className="button-skip-container">
          <div className="button-skip-invitation">
            <Button
              variant="outline-success"
              size="sm"
              onClick={props.handleSkipSigning(doc, props)}
            >
              <FormattedMessage
                defaultMessage="Skip Signature"
                key="skip-sign-button"
              />
            </Button>
          </div>
        </div>
      </OverlayTrigger>
    </>
  );
};

const resendButton = (props, doc, help) => {
  return (
    <>
      <OverlayTrigger
        delay={{ show: DELAY_SHOW_HELP, hide: DELAY_HIDE_HELP }}
        trigger={["hover", "focus"]}
        overlay={<Tooltip placement="auto">{help}</Tooltip>}
      >
        <div className="button-resend-container">
          <div className="button-resend-invitation">
            <Button
              variant="outline-success"
              size="sm"
              data-testid={"button-open-resend-" + doc.name}
              onClick={props.handleResend(doc)}
            >
              <FormattedMessage
                defaultMessage="Resend invitations"
                key="resend-invitations-button"
              />
            </Button>
          </div>
        </div>
      </OverlayTrigger>
      <ReInviteFormContainer doc={doc} />
    </>
  );
};

const previewButton = (props, doc, help) => {
  return (
    <>
      <OverlayTrigger
        delay={{ show: DELAY_SHOW_HELP, hide: DELAY_HIDE_HELP }}
        trigger={["hover", "focus"]}
        overlay={<Tooltip placement="auto">{help}</Tooltip>}
      >
        <div className="button-preview-container">
          <div className="button-preview-invitation">
            <Button
              variant="outline-dark"
              size="sm"
              onClick={props.showPreview(doc.key)}
            >
              <FormattedMessage defaultMessage="Preview" key="preview-button" />
            </Button>
          </div>
        </div>
      </OverlayTrigger>
    </>
  );
};

const removeButton = (props, doc, help) => {
  return (
    <>
      <OverlayTrigger
        delay={{ show: DELAY_SHOW_HELP, hide: DELAY_HIDE_HELP }}
        trigger={["hover", "focus"]}
        overlay={<Tooltip placement="auto">{help}</Tooltip>}
      >
        <div className="button-remove-container">
          <div className="button-remove-invitation">
            <Button
              variant="outline-danger"
              size="sm"
              onClick={props.showConfirm("confirm-remove-owned-" + doc.name)}
              data-testid={"rm-invitation-" + doc.name}
            >
              <FormattedMessage defaultMessage="Remove" key="remove-button" />
            </Button>
            <ConfirmDialogContainer
              confirmId={"confirm-remove-owned-" + doc.name}
              title={props.intl.formatMessage({
                defaultMessage: "Confirm Removal of invitation",
                id: "header-confirm-remove-owned-title",
              })}
              mainText={props.intl.formatMessage({
                defaultMessage:
                  'Clicking "Confirm" will remove all invitations to sign the document',
                id: "header-confirm-remove-owned-text",
              })}
              confirm={props.handleRemove(doc, props)}
            />
          </div>
        </div>
      </OverlayTrigger>
    </>
  );
};

const downloadButton = (props, doc, help) => {
  return (
    <>
      <OverlayTrigger
        delay={{ show: DELAY_SHOW_HELP, hide: DELAY_HIDE_HELP }}
        trigger={["hover", "focus"]}
        overlay={<Tooltip placement="auto">{help}</Tooltip>}
      >
        <div className="button-download-container">
          <div className="button-download-invitation">
            <Button
              variant="outline-success"
              size="sm"
              onClick={props.downloadSigned(doc.name)}
            >
              <FormattedMessage
                defaultMessage="Download (signed)"
                key="dlsigned-button"
              />
            </Button>
          </div>
        </div>
      </OverlayTrigger>
    </>
  );
};

/**
 * @desc eduSign component showing a list of signing invitations by the logged in user.
 *
 * @component
 */
class Owned extends Component {
  getHelp(msg) {
    const msgs = {
      "close-button-help": this.props.intl.formatMessage({
        defaultMessage: "Cancel Request",
        id: "owned-close-button-help",
      }),
      "skip-button-help": this.props.intl.formatMessage({
        defaultMessage:
          "All requested users have alredy signed the document, click here to skip adding your final signature",
        id: "owned-skip-button-help",
      }),
      "resend-button-help": this.props.intl.formatMessage({
        defaultMessage:
          "Click here to re-send an invitation email to all pending users",
        id: "owned-resend-button-help",
      }),
      "preview-button-help": this.props.intl.formatMessage({
        defaultMessage: "Click here to preview the document",
        id: "owned-preview-button-help",
      }),
      "download-button-help": this.props.intl.formatMessage({
        defaultMessage: "Click here to download the signed document",
        id: "owned-download-button-help",
      }),
      "loaded-title": this.props.intl.formatMessage({
        defaultMessage: "Document loaded",
        id: "docmanager-help-loaded-title",
      }),
      loaded: this.props.intl.formatMessage({
        defaultMessage:
          'To sign this document, select it on the checkbox to left and then click on the button labelled "Sign Selected Documents"',
        id: "docmanager-help-loaded",
      }),
      "incomplete-title": this.props.intl.formatMessage({
        defaultMessage: "Waiting for invited signatures",
        id: "docmanager-help-incomplete-title",
      }),
      incomplete: this.props.intl.formatMessage({
        defaultMessage:
          'You must wait for all invited people to sign before signing this document yourself.',
        id: "docmanager-help-incomplete",
      }),
      "selected-title": this.props.intl.formatMessage({
        defaultMessage: "Document selected for signing",
        id: "docmanager-help-selected-title",
      }),
      selected: this.props.intl.formatMessage({
        defaultMessage:
          'Click on the button below labelled "Sign Selected Documents" to sign this document',
        id: "docmanager-help-selected",
      }),
      "signing-title": this.props.intl.formatMessage({
        defaultMessage: "Signing document",
        id: "docmanager-help-signing-title",
      }),
      signing: this.props.intl.formatMessage({
        defaultMessage: "Please wait while the document is signed",
        id: "docmanager-help-signing",
      }),
      "failed-signing-title": this.props.intl.formatMessage({
        defaultMessage: "Failed signing document",
        id: "docmanager-help-failed-signing-title",
      }),
      "failed-signing": this.props.intl.formatMessage({
        defaultMessage:
          'There was a problem signing the document, to try again click on the checkbox to the left and then on the button labelled "Sign Selected Documents"',
        id: "docmanager-help-failed-signing",
      }),
      "signed-title": this.props.intl.formatMessage({
        defaultMessage: "Document signed",
        id: "docmanager-help-signed-title",
      }),
      signed: this.props.intl.formatMessage({
        defaultMessage:
          'Document succesfully signed, click on the button labelled "Download (signed)" to download it',
        id: "docmanager-help-signed",
      }),
    };
    return msgs[msg];
  }
  render() {
    if (this.props.owned.length === 0) return "";
    return (
      <>
        {this.props.owned.map((doc, index) => {
          let docFile = null;
          if (doc.show) {
            docFile = docToFile(doc);
          }
          return (
            <OverlayTrigger
              key={index}
              delay={{ show: DELAY_SHOW_HELP, hide: DELAY_HIDE_HELP }}
              trigger={["hover", "focus"]}
              rootClose={true}
              overlay={
                <Popover placement="auto">
                  <PopoverTitle>
                    {this.getHelp(doc.state + "-title")}
                  </PopoverTitle>
                  <PopoverContent>
                    {this.getHelp(doc.state)}
                  </PopoverContent>
                </Popover>
              }
            >
              <div className={"invitation-multisign " + doc.state}>
                <div className="invitation-multisign-request">
                  <div
                    className={"invitation-name-and-buttons-" + this.props.size}
                  >
                    {doc.state === "incomplete" && (
                      <>
                        {(this.props.size === "lg" && (
                          <>
                            {dummySelectDoc()}
                            {docSize(doc)}
                            {docName(doc)}
                            <div className="owned-container-buttons-lg">
                              {previewButton(
                                this.props,
                                doc,
                                this.getHelp("preview-button-help")
                              )}
                              {removeButton(
                                this.props,
                                doc,
                                this.getHelp("close-button-help")
                              )}
                              {resendButton(
                                this.props,
                                doc,
                                this.getHelp("resend-button-help")
                              )}
                            </div>
                          </>
                        )) || (
                          <div className="owned-name-and-buttons">
                            <div className="owned-container-name">
                              {dummySelectDoc()}
                              {docSize(doc)}
                              {docName(doc)}
                            </div>
                            <div className="owned-container-buttons-sm">
                              {previewButton(
                                this.props,
                                doc,
                                this.getHelp("preview-button-help")
                              )}
                              {removeButton(
                                this.props,
                                doc,
                                this.getHelp("close-button-help")
                              )}
                              {resendButton(
                                this.props,
                                doc,
                                this.getHelp("resend-button-help")
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {["loaded", "selected", "failed-signing"].includes(
                      doc.state
                    ) && (
                      <>
                        {(this.props.size === "lg" && (
                          <>
                            {selectDoc(index, doc, this.props)}
                            {docSize(doc)}
                            {docName(doc)}
                            <div className="owned-container-buttons-lg">
                              {previewButton(
                                this.props,
                                doc,
                                this.getHelp("preview-button-help")
                              )}
                              {removeButton(
                                this.props,
                                doc,
                                this.getHelp("close-button-help")
                              )}
                              {skipSignatureButton(
                                this.props,
                                doc,
                                this.getHelp("skip-button-help")
                              )}
                            </div>
                          </>
                        )) || (
                          <div className="owned-name-and-buttons">
                            <div className="owned-container-name">
                              {selectDoc(index, doc, this.props)}
                              {docSize(doc)}
                              {docName(doc)}
                            </div>
                            <div className="owned-container-buttons-sm">
                              {previewButton(
                                this.props,
                                doc,
                                this.getHelp("preview-button-help")
                              )}
                              {removeButton(
                                this.props,
                                doc,
                                this.getHelp("close-button-help")
                              )}
                              {skipSignatureButton(
                                this.props,
                                doc,
                                this.getHelp("skip-button-help")
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {doc.state === "signing" && (
                      <>
                        {dummySelectDoc()}
                        {docSize(doc)}
                        {docName(doc)}
                        {namedSpinner(index, "signing")}
                      </>
                    )}
                    {doc.state === "signed" && (
                      <>
                        {dummySelectDoc()}
                        {docSize(doc)}
                        {docName(doc)}
                        {downloadButton(
                          this.props,
                          doc,
                          this.getHelp("download-button-help")
                        )}
                      </>
                    )}
                    {doc.show && (
                      <DocPreviewContainer
                        doc={doc}
                        docFile={docFile}
                        index={index}
                        handleClose={this.props.handleClosePreview}
                      />
                    )}
                  </div>
                  {doc.pending.length > 0 && (
                    <>
                      <div className="pending-invites">
                        <span className="pending-invites-label">
                          <FormattedMessage
                            defaultMessage="Waiting for signatures by:"
                            key="multisign-owned-waiting"
                          />
                        </span>
                        <span className="pending-invites-items">
                          {doc.pending.map((invite, index) => {
                            return (
                              <span className="pending-invite-item" key={index}>
                                {invite.name} &lt;{invite.email}&gt;
                              </span>
                            );
                          })}
                        </span>
                      </div>
                    </>
                  )}
                  {doc.signed.length > 0 && (
                    <>
                      <div className="signed-invites">
                        <span className="signed-invites-label">
                          <FormattedMessage
                            defaultMessage="Already signed by:"
                            key="multisign-owned-signed"
                          />
                        </span>
                        <span className="signed-invites-items">
                          {doc.signed.map((invite, index) => {
                            return (
                              <span className="signed-invite-item" key={index}>
                                {invite.name} &lt;{invite.email}&gt;
                              </span>
                            );
                          })}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </OverlayTrigger>
          );
        })}
      </>
    );
  }
}

Owned.propTypes = {
  owned: PropTypes.array,
};

export default injectIntl(Owned);
