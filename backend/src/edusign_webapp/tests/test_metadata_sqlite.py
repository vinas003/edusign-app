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
import os
import sqlite3
import uuid
from datetime import datetime

from edusign_webapp import run


def test_add(sqlite_md):
    tempdir, test_md = sqlite_md
    dummy_key = uuid.uuid4()
    test_doc = {'name': 'test.pdf', 'size': 1500000, 'type': 'application/pdf'}
    test_invites = ['invite1@example.com', 'invite2@example.com']

    with run.app.app_context():
        test_md.add(dummy_key, test_doc, 'owner@example.com', test_invites)

    db_path = os.path.join(tempdir.name, 'test.db')
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT * FROM Documents")
    result = cur.fetchone()
    cur.close()
    conn.close()

    # Remove timestamps from the result
    assert result[:5] == (1, dummy_key.bytes, 'test.pdf', 1500000, 'application/pdf')


def test_add_and_get_pending(sqlite_md):
    tempdir, test_md = sqlite_md
    dummy_key = uuid.uuid4()
    test_doc = {'name': 'test.pdf', 'size': 1500000, 'type': 'application/pdf'}
    test_invites = ['invite1@example.com', 'invite2@example.com']

    with run.app.app_context():
        test_md.add(dummy_key, test_doc, 'owner@example.com', test_invites)

        pending1 = test_md.get_pending('invite1@example.com')
        pending2 = test_md.get_pending('invite2@example.com')

    assert len(pending1) == 1
    assert pending1[0]['name'] == 'test.pdf'
    assert pending1[0]['size'] == 1500000
    assert pending1[0]['type'] == 'application/pdf'
    assert pending1[0]['owner'] == 'owner@example.com'

    assert len(pending2) == 1
    assert pending2[0]['name'] == 'test.pdf'
    assert pending2[0]['size'] == 1500000
    assert pending2[0]['type'] == 'application/pdf'
    assert pending2[0]['owner'] == 'owner@example.com'


def test_add_and_get_pending_not(sqlite_md):
    tempdir, test_md = sqlite_md
    dummy_key = uuid.uuid4()
    test_doc = {'name': 'test.pdf', 'size': 1500000, 'type': 'application/pdf'}
    test_invites = ['invite1@example.com', 'invite2@example.com']

    with run.app.app_context():
        test_md.add(dummy_key, test_doc, 'owner@example.com', test_invites)

        pending = test_md.get_pending('invite3@example.com')

    assert pending == []


def test_add_two_and_get_pending(sqlite_md):
    tempdir, test_md = sqlite_md
    dummy_key_1 = uuid.uuid4()
    test_doc_1 = {'name': 'test1.pdf', 'size': 1500000, 'type': 'application/pdf'}
    test_invites_1 = ['invite1@example.com', 'invite2@example.com']
    dummy_key_2 = uuid.uuid4()
    test_doc_2 = {'name': 'test2.pdf', 'size': 1500000, 'type': 'application/pdf'}
    test_invites_2 = ['invite1@example.com', 'invite3@example.com']

    with run.app.app_context():
        test_md.add(dummy_key_1, test_doc_1, 'owner1@example.com', test_invites_1)
        test_md.add(dummy_key_2, test_doc_2, 'owner2@example.com', test_invites_2)

        pending = test_md.get_pending('invite1@example.com')

    assert len(pending) == 2

    assert pending[0]['name'] == 'test1.pdf'
    assert pending[0]['size'] == 1500000
    assert pending[0]['type'] == 'application/pdf'
    assert pending[0]['owner'] == 'owner1@example.com'

    assert pending[1]['name'] == 'test2.pdf'
    assert pending[1]['size'] == 1500000
    assert pending[1]['type'] == 'application/pdf'
    assert pending[1]['owner'] == 'owner2@example.com'


def test_update_and_get_pending(sqlite_md):
    tempdir, test_md = sqlite_md
    dummy_key = uuid.uuid4()
    test_doc = {'name': 'test.pdf', 'size': 1500000, 'type': 'application/pdf'}
    test_invites = ['invite1@example.com', 'invite2@example.com']

    with run.app.app_context():
        test_md.add(dummy_key, test_doc, 'owner@example.com', test_invites)

        test_md.update(dummy_key, test_invites[0])

        pending1 = test_md.get_pending('invite1@example.com')
        pending2 = test_md.get_pending('invite2@example.com')

    assert len(pending1) == 0

    assert len(pending2) == 1
    assert pending2[0]['name'] == 'test.pdf'
    assert pending2[0]['size'] == 1500000
    assert pending2[0]['type'] == 'application/pdf'
    assert pending2[0]['owner'] == 'owner@example.com'


def test_updated_timestamp(sqlite_md):
    tempdir, test_md = sqlite_md
    dummy_key = uuid.uuid4()
    test_doc = {'name': 'test.pdf', 'size': 1500000, 'type': 'application/pdf'}
    test_invites = ['invite1@example.com', 'invite2@example.com']

    with run.app.app_context():
        test_md.add(dummy_key, test_doc, 'owner@example.com', test_invites)

    def get_doc():
        db_path = os.path.join(tempdir.name, 'test.db')
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT * FROM Documents")
        result = cur.fetchone()
        cur.close()
        conn.close()
        return result

    result = get_doc()

    assert datetime.fromisoformat(result[5]) == datetime.fromisoformat(result[6])

    with run.app.app_context():
        test_md.update(dummy_key, 'invite1@example.com')

    result = get_doc()

    assert datetime.fromisoformat(result[5]) < datetime.fromisoformat(result[6])


def test_add_and_get_owned(sqlite_md):
    tempdir, test_md = sqlite_md
    dummy_key = uuid.uuid4()
    test_doc = {'name': 'test.pdf', 'size': 1500000, 'type': 'application/pdf'}
    test_invites = ['invite1@example.com', 'invite2@example.com']

    with run.app.app_context():
        test_md.add(dummy_key, test_doc, 'owner@example.com', test_invites)

        owned = test_md.get_owned('owner@example.com')

    assert len(owned) == 1
    assert owned[0]['key'] == dummy_key
    assert owned[0]['name'] == 'test.pdf'
    assert owned[0]['size'] == 1500000
    assert owned[0]['type'] == 'application/pdf'
    assert owned[0]['pending'] == ['invite1@example.com', 'invite2@example.com']


def test_add_and_remove(sqlite_md):
    tempdir, test_md = sqlite_md
    dummy_key = uuid.uuid4()
    test_doc = {'name': 'test.pdf', 'size': 1500000, 'type': 'application/pdf'}
    test_invites = ['invite1@example.com']

    with run.app.app_context():
        test_md.add(dummy_key, test_doc, 'owner@example.com', test_invites)
        test_md.update(dummy_key, test_invites[0])
        test_md.remove(dummy_key)

        owned = test_md.get_owned('owner@example.com')

    assert len(owned) == 0


def test_add_and_remove_not(sqlite_md):
    tempdir, test_md = sqlite_md
    dummy_key = uuid.uuid4()
    test_doc = {'name': 'test.pdf', 'size': 1500000, 'type': 'application/pdf'}
    test_invites = ['invite1@example.com']

    with run.app.app_context():
        test_md.add(dummy_key, test_doc, 'owner@example.com', test_invites)
        test_md.remove(dummy_key)

        owned = test_md.get_owned('owner@example.com')

    assert len(owned) == 1
