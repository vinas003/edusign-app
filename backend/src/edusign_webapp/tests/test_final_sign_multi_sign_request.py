# -*- coding: utf-8 -*-
#
# Copyright (c) 2021 SUNET
# All rights reserved.
#
#   Redistribution and use in source and binary forms, with or
#   without modification, are permitted provided that the following
#   conditions are met:
#
#     1. Redistributions of source code must retain the above copyright
#        notice, this list of conditions and the following disclaimer.
#     2. Redistributions in binary form must reproduce the above
#        copyright notice, this list of conditions and the following
#        disclaimer in the documentation and/or other materials provided
#        with the distribution.
#     3. Neither the name of the SUNET nor the names of its
#        contributors may be used to endorse or promote products derived
#        from this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
# FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
# COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
# INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
# BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
# LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
# ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
# POSSIBILITY OF SUCH DAMAGE.
#

from edusign_webapp.doc_store import DocStore
from edusign_webapp.marshal import ResponseSchema


def _test_final_sign_multi_sign_request(app, environ_base, monkeypatch, sample_doc_1, mock_invitation, create_sign_request=True, prepare_data=None, create_data=None, error_creation=False):

    _, app = app

    client = app.test_client()
    client.environ_base.update(environ_base)

    response1 = client.get('/sign/')

    assert response1.status == '200 OK'

    with app.test_request_context():
        with client.session_transaction() as sess:

            csrf_token = ResponseSchema().get_csrf_token({}, sess=sess)['csrf_token']
            user_key = sess['user_key']

    from flask.sessions import SecureCookieSession

    def mock_getitem(self, key):
        if key == 'user_key':
            return user_key
        self.accessed = True
        return super(SecureCookieSession, self).__getitem__(key)

    monkeypatch.setattr(SecureCookieSession, '__getitem__', mock_getitem)

    if create_sign_request:

        doc_data = {
            'csrf_token': csrf_token,
            'payload': {
                'document': sample_doc_1,
                'owner': 'tester@example.org',
                'invites': [
                    {'name': 'invite0', 'email': 'invite0@example.org'},
                    {'name': 'invite1', 'email': 'invite1@example.org'},
                ],
            },
        }

        response = client.post(
            '/sign/create-multi-sign',
            headers={
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': 'https://test.localhost',
                'X-Forwarded-Host': 'test.localhost',
            },
            json=doc_data,
        )

        assert response.status == '200 OK'

    from edusign_webapp.api_client import APIClient

    def mock_post(self, url, *args, **kwargs):
        if 'prepare' in url:
            if prepare_data is not None:
                return prepare_data
            return {
                'policy': 'edusign-test',
                'updatedPdfDocumentReference': 'ba26478f-f8e0-43db-991c-08af7c65ed58',
                'visiblePdfSignatureRequirement': {
                    'fieldValues': {'idp': 'https://login.idp.eduid.se/idp.xml'},
                    'page': 2,
                    'scale': -74,
                    'signerName': {
                        'formatting': None,
                        'signerAttributes': [
                            {'name': 'urn:oid:2.5.4.42'},
                            {'name': 'urn:oid:2.5.4.4'},
                            {'name': 'urn:oid:0.9.2342.19200300.100.1.3'},
                        ],
                    },
                    'templateImageRef': 'eduSign-image',
                    'xposition': 37,
                    'yposition': 165,
                },
            }

        if error_creation:
            raise Exception()

        if create_data is not None:
            return create_data

        return {
            'binding': 'POST/XML/1.0',
            'destinationUrl': 'https://sig.idsec.se/sigservice-dev/request',
            'relayState': '31dc573b-ab7d-496c-845e-cae8792ba063',
            'signRequest': 'DUMMY SIGN REQUEST',
            'state': {'id': '31dc573b-ab7d-496c-845e-cae8792ba063'},
        }

    monkeypatch.setattr(APIClient, '_post', mock_post)

    def mock_get_invitation(*args):
        return mock_invitation

    monkeypatch.setattr(DocStore, 'get_signed_document', mock_get_invitation)

    final_data = {
        'csrf_token': csrf_token,
        'payload': {
            'key': sample_doc_1['key'],
        },
    }

    response = client.post(
        '/sign/final-sign-request',
        headers={
            'X-Requested-With': 'XMLHttpRequest',
            'Origin': 'https://test.localhost',
            'X-Forwarded-Host': 'test.localhost',
        },
        json=final_data,
    )

    return response


def test_final_sign_multi_sign_request(app, environ_base, monkeypatch, sample_doc_1):
    mock_invitation = {
        'key': b'\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11',
        'name': 'test.pdf',
        'size': '1',
        'type': 'application/pdf',
        'owner': 'tester@example.org',
        'blob': 'dummy blob',
    }
    response = _test_final_sign_multi_sign_request(app, environ_base, monkeypatch, sample_doc_1, mock_invitation)

    assert b"Success creating sign request" in response.data


def test_final_sign_multi_sign_request_no_doc(app, environ_base, monkeypatch, sample_doc_1):
    mock_invitation = {}
    response = _test_final_sign_multi_sign_request(app, environ_base, monkeypatch, sample_doc_1, mock_invitation, create_sign_request=False)

    assert b"Multisigned document not found in the doc store" in response.data


def test_final_sign_multi_sign_request_prepare_error(app, environ_base, monkeypatch, sample_doc_1):
    mock_invitation = {
        'key': b'\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11',
        'name': 'test.pdf',
        'size': '1',
        'type': 'application/pdf',
        'owner': 'tester@example.org',
        'blob': 'dummy blob',
    }
    prepare_data = {'error': True, 'message': "Problem preparing multisigned document"}
    response = _test_final_sign_multi_sign_request(app, environ_base, monkeypatch, sample_doc_1, mock_invitation, prepare_data=prepare_data)

    assert b"Problem preparing multisigned document" in response.data


def test_final_sign_multi_sign_request_create_error(app, environ_base, monkeypatch, sample_doc_1):
    mock_invitation = {
        'key': b'\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11',
        'name': 'test.pdf',
        'size': '1',
        'type': 'application/pdf',
        'owner': 'tester@example.org',
        'blob': 'dummy blob',
    }
    response = _test_final_sign_multi_sign_request(app, environ_base, monkeypatch, sample_doc_1, mock_invitation, error_creation=True)

    assert b"Communication error with the create endpoint of the eduSign API" in response.data


def test_final_sign_multi_sign_request_no_relay_state(app, environ_base, monkeypatch, sample_doc_1):
    mock_invitation = {
        'key': b'\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11',
        'name': 'test.pdf',
        'size': '1',
        'type': 'application/pdf',
        'owner': 'tester@example.org',
        'blob': 'dummy blob',
    }

    create_data = {
        'binding': 'POST/XML/1.0',
        'destinationUrl': 'https://sig.idsec.se/sigservice-dev/request',
        'signRequest': 'DUMMY SIGN REQUEST',
        'state': {'id': '31dc573b-ab7d-496c-845e-cae8792ba063'},
        'message': 'Dummy error message',
    }
    response = _test_final_sign_multi_sign_request(app, environ_base, monkeypatch, sample_doc_1, mock_invitation, create_data=create_data)

    assert b"Dummy error message" in response.data


def test_final_sign_multi_sign_request_no_sign_request(app, environ_base, monkeypatch, sample_doc_1):
    mock_invitation = {
        'key': b'\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11\x11',
        'name': 'test.pdf',
        'size': '1',
        'type': 'application/pdf',
        'owner': 'tester@example.org',
        'blob': 'dummy blob',
    }

    create_data = {
        'binding': 'POST/XML/1.0',
        'destinationUrl': 'https://sig.idsec.se/sigservice-dev/request',
        'relayState': '31dc573b-ab7d-496c-845e-cae8792ba063',
        'state': {'id': '31dc573b-ab7d-496c-845e-cae8792ba063'},
        'message': 'Dummy error message',
    }
    response = _test_final_sign_multi_sign_request(app, environ_base, monkeypatch, sample_doc_1, mock_invitation, create_data=create_data)

    assert b"Dummy error message" in response.data
