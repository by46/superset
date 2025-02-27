/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React from 'react';
import { mount } from 'enzyme';
import { supersetTheme, ThemeProvider } from '@superset-ui/core';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import configureStore from 'redux-mock-store';
import fetchMock from 'fetch-mock';
import {
  SQL_EDITOR_GUTTER_HEIGHT,
  SQL_EDITOR_GUTTER_MARGIN,
  SQL_TOOLBAR_HEIGHT,
} from 'src/SqlLab/constants';
import AceEditorWrapper from 'src/SqlLab/components/AceEditorWrapper';
import ConnectedSouthPane from 'src/SqlLab/components/SouthPane/state';
import SqlEditor from 'src/SqlLab/components/SqlEditor';
import QueryProvider from 'src/views/QueryProvider';
import SqlEditorLeftBar from 'src/SqlLab/components/SqlEditorLeftBar';
import { AntdDropdown } from 'src/components';
import {
  queryEditorSetFunctionNames,
  queryEditorSetSelectedText,
  queryEditorSetSchemaOptions,
} from 'src/SqlLab/actions/sqlLab';
import { EmptyStateBig } from 'src/components/EmptyState';
import waitForComponentToPaint from 'spec/helpers/waitForComponentToPaint';
import {
  initialState,
  queries,
  table,
  defaultQueryEditor,
} from 'src/SqlLab/fixtures';

const MOCKED_SQL_EDITOR_HEIGHT = 500;

fetchMock.get('glob:*/api/v1/database/*', { result: [] });

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const store = mockStore({
  ...initialState,
  sqlLab: {
    ...initialState.sqlLab,
    databases: {
      dbid1: {
        allow_ctas: false,
        allow_cvas: false,
        allow_dml: false,
        allow_file_upload: false,
        allow_multi_schema_metadata_fetch: false,
        allow_run_async: false,
        backend: 'postgresql',
        database_name: 'examples',
        expose_in_sqllab: true,
        force_ctas_schema: null,
        id: 1,
      },
    },
    unsavedQueryEditor: {
      id: defaultQueryEditor.id,
      dbId: 'dbid1',
    },
  },
});

describe('SqlEditor', () => {
  const mockedProps = {
    actions: {
      queryEditorSetFunctionNames,
      queryEditorSetSelectedText,
      queryEditorSetSchemaOptions,
      addDangerToast: jest.fn(),
      removeDataPreview: jest.fn(),
    },
    queryEditor: initialState.sqlLab.queryEditors[0],
    latestQuery: queries[0],
    tables: [table],
    getHeight: () => '100px',
    editorQueries: [],
    dataPreviewQueries: [],
    defaultQueryLimit: 1000,
    maxRow: 100000,
    displayLimit: 100,
  };

  const buildWrapper = (props = {}) =>
    mount(
      <QueryProvider>
        <Provider store={store}>
          <SqlEditor {...mockedProps} {...props} />
        </Provider>
      </QueryProvider>,
      {
        wrappingComponent: ThemeProvider,
        wrappingComponentProps: { theme: supersetTheme },
      },
    );

  it('does not render SqlEditor if no db selected', () => {
    const queryEditor = initialState.sqlLab.queryEditors[1];
    const updatedProps = { ...mockedProps, queryEditor };
    const wrapper = buildWrapper(updatedProps);
    expect(wrapper.find(EmptyStateBig)).toExist();
  });
  it('render a SqlEditorLeftBar', async () => {
    const wrapper = buildWrapper();
    await waitForComponentToPaint(wrapper);
    expect(wrapper.find(SqlEditorLeftBar)).toExist();
  });
  it('render an AceEditorWrapper', async () => {
    const wrapper = buildWrapper();
    await waitForComponentToPaint(wrapper);
    expect(wrapper.find(AceEditorWrapper)).toExist();
  });
  it('render a SouthPane', async () => {
    const wrapper = buildWrapper();
    await waitForComponentToPaint(wrapper);
    expect(wrapper.find(ConnectedSouthPane)).toExist();
  });
  // TODO eschutho convert tests to RTL
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('does not overflow the editor window', async () => {
    const wrapper = buildWrapper();
    await waitForComponentToPaint(wrapper);
    const totalSize =
      parseFloat(wrapper.find(AceEditorWrapper).props().height) +
      wrapper.find(ConnectedSouthPane).props().height +
      SQL_TOOLBAR_HEIGHT +
      SQL_EDITOR_GUTTER_MARGIN * 2 +
      SQL_EDITOR_GUTTER_HEIGHT;
    expect(totalSize).toEqual(MOCKED_SQL_EDITOR_HEIGHT);
  });
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('does not overflow the editor window after resizing', async () => {
    const wrapper = buildWrapper();
    wrapper.setState({ height: 450 });
    await waitForComponentToPaint(wrapper);
    const totalSize =
      parseFloat(wrapper.find(AceEditorWrapper).props().height) +
      wrapper.find(ConnectedSouthPane).props().height +
      SQL_TOOLBAR_HEIGHT +
      SQL_EDITOR_GUTTER_MARGIN * 2 +
      SQL_EDITOR_GUTTER_HEIGHT;
    expect(totalSize).toEqual(450);
  });
  it('render a Limit Dropdown', async () => {
    const defaultQueryLimit = 101;
    const updatedProps = { ...mockedProps, defaultQueryLimit };
    const wrapper = buildWrapper(updatedProps);
    await waitForComponentToPaint(wrapper);
    expect(wrapper.find(AntdDropdown)).toExist();
  });
});
