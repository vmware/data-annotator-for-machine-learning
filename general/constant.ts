/*
Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0
*/
export let Constant = {
  DEFAULT_TIME_OUT: 100 * 1000,
  login: false,
  project_name: "e2e Test Project",
  project_name_text_al: "",
  project_name_numberic_mutiple: "",
  project_name_text_multiple: "",
  project_name_tabular_numeric: "",
  project_name_tabular_al: "",
  project_name_ner: "",
  project_name_log: "",
  project_name_image: "",
  dataset_name: "e2e Test Data",
  dataset_name_text: "",
  dataset_name_ner: "",
  dataset_name_log: "",
  dataset_name_image: "",
  firstname: "poc",
  lastname: "os",
  username: process.env.IN? process.env.TEST_USER_NAME: "poc-os@poc-os.com",
  fullname: process.env.IN? process.env.TEST_FULL_NAME: "Poc Os",
  password: process.env.IN? process.env.TEST_PASSWORD: "Abcd1234@",
  username2: "test2@vmware.com",
  passwordErr: "Abcd1234$#",
  firstname_owner: "test",
  lastname_owner: "hub",
  username_owner: "test@test.com",
  fullname_owner: "Test Hub",
  password_owner: "Abcd1234@",
};
