
import React, { useState } from 'react';
import PropTypes from "prop-types";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import BForm from "react-bootstrap/Form";
import { Formik, Form, Field, ErrorMessage, FieldArray } from "formik";
import { FormattedMessage } from "react-intl";


const validateEmail = (value) => {
  let error;

  if (!value) {
    error = <FormattedMessage defaultMessage="Required" key="required-field" />;
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(value)) {
    error = <FormattedMessage defaultMessage="Invalid email" key="invalid-email" />;
  }
  return error;
};


const validateName = (value) => {
  let error;

  if (!value) {
    error = <FormattedMessage defaultMessage="Required" key="required-field" />;
  }
  return error;
};

const initialValues = (docId) => ({
  documentId: docId,
  invitees: [
    {
      name: '',
      email: '',
    },
  ],
});

const InviteForm = (props) => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <div className="button-multisign-flex-item">
        <Button
          variant="outline-success"
          size="sm"
          onClick={handleShow}
        >
          <FormattedMessage
            defaultMessage="Multi sign"
            key="multisign-button"
          />
        </Button>
      </div>

      <Modal show={show} onHide={handleClose}>
        <Formik
          initialValues={initialValues(props.docId)}
          onSubmit={(values) => {props.handleSubmit(values)}}
        >
          {(fprops) => (
          <Form>
            <Field type="hidden" name="documentId" value={fprops.values.documentId} />
            <Modal.Header closeButton>
              <Modal.Title>
                <FormattedMessage
                  defaultMessage="Invite people to sign document"
                  key="invite-people"
                />
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <FieldArray name="invitees">
                {(arrayHelpers) => (
                  <div>
                    {fprops.values.invitees.length > 0 &&
                      fprops.values.invitees.map((invitee, index) => (
                        <div className="row" key={index}>

                          <BForm.Group>
                            <BForm.Label htmlFor={`invitees.${index}.name`}>
                              <FormattedMessage defaultMessage="Name" key="name-input-field" />
                            </BForm.Label>
                            <Field
                              name={`invitees.${index}.name`}
                              data-testid={`invitees.${index}.name`}
                              value={invitee.name}
                              placeholder="Jane Doe"
                              as={BForm.Control}
                              type="text"
                              validate={validateName}
                            />
                            <ErrorMessage
                              name={`invitees.${index}.name`}
                              component="div"
                              className="field-error"
                            />
                          <BForm.Group>
                          </BForm.Group>
                            <BForm.Label htmlFor={`invitees.${index}.email`}>
                              <FormattedMessage defaultMessage="Email" key="email-input-field" />
                            </BForm.Label>
                            <Field
                              name={`invitees.${index}.email`}
                              data-testid={`invitees.${index}.email`}
                              value={invitee.email}
                              placeholder="jane@example.com"
                              as={BForm.Control}
                              type="email"
                              validate={validateEmail}
                            />
                            <ErrorMessage
                              name={`invitees.${index}.email`}
                              component="div"
                              className="field-error"
                            />
                          </BForm.Group>
                          <div className="col">
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => arrayHelpers.remove(index)}
                            >
                              X
                            </button>
                          </div>
                        </div>
                      ))}
                    <Button
                      variant="secondary"
                      onClick={() => arrayHelpers.push({ name: '', email: '' })}
                    >
                      <FormattedMessage
                        defaultMessage="Add Invitation"
                        key="add-invite"
                      />
                    </Button>
                  </div>
                )}
              </FieldArray>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>
                <FormattedMessage
                  defaultMessage="Cancel"
                  key="cancel-invite"
                />
              </Button>
              <Button variant="primary" type="submit">
                <FormattedMessage
                  defaultMessage="Send"
                  key="send-invite"
                />
              </Button>
            </Modal.Footer>
          </Form>
          )}
        </Formik>
      </Modal>
    </>
  )
};


InviteForm.propTypes = {
  show: PropTypes.bool,
  docId: PropTypes.number,
};

export default InviteForm;
