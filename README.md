[![check-header](https://github.com/vmware/data-annotator-for-machine-learning/actions/workflows/check-header.yml/badge.svg?branch=master&event=push)](https://github.com/vmware/data-annotator-for-machine-learning/actions/workflows/check-header.yml)
[![smoke_test](https://github.com/vmware/data-annotator-for-machine-learning/actions/workflows/smoke_test.yml/badge.svg?branch=master)](https://github.com/vmware/data-annotator-for-machine-learning/actions/workflows/smoke_test.yml)
[![sonarcloud_scan_app](https://github.com/vmware/data-annotator-for-machine-learning/actions/workflows/sonarcloud_scan_app.yml/badge.svg)](https://sonarcloud.io/organizations/vmware-daml/projects?search=annotation-app&sort=-analysis_date)
[![sonarcloud_scan_service](https://github.com/vmware/data-annotator-for-machine-learning/actions/workflows/sonarcloud_scan_service.yml/badge.svg)](https://sonarcloud.io/organizations/vmware-daml/projects?search=service&sort=-analysis_date)
[![coverage report](https://avatars.githubusercontent.com/in/12526?s=20&v=4 "You can find the coverage report here")](https://sonarcloud.io/dashboard?id=vmware-daml-annotation-app)

<div align='center'> <h1>Data Annotator for Machine Learning</h1> </div>

Data Annotator for Machine Learning (DAML) is an application that helps machine learning teams facilitating the creation and management of annotations.

Core features include:

- Support for common annotation tasks:
  - Text classification
  - Named entity recognition
  - Tabular classification and regresion
  - Images recognition with bounding boxes and polygons
  - Log labeling
- Active learning with uncertainly sampling to query unlabeled data
- Project tracking with real time data aggregation and review process
- User management panel with role-based access control
- Data management
  - Import in common data formats
  - Export in ML friendly formats
  - Data sharing through community datasets
- Swagger API for programmatic labeling, connecting to data pipelines and more

<br>

## Helpful links

- [ATO 2021 talk](https://www.youtube.com/watch?v=n0WghXqCH5o)
- [DAML medium article](https://medium.com/vmware-data-ml-blog/introducing-data-annotator-for-machine-learning-e8af2f19497a)
- [User guide](https://github.com/vmware/data-annotator-for-machine-learning/wiki/DAML-User-Guide)
- [Tutorial](https://github.com/vmware/data-annotator-for-machine-learning/wiki/Tutorial:-Using-DAML-to-Label-the-Sentiment-of--VMware-Reddit-and-Twitter-Comments)

## DAML upgrade

- DAML upgrade to v3.0.0 that mainly raise UI/UX to a higher standard
  - [DAML v3.0.0 release note](https://github.com/vmware/data-annotator-for-machine-learning/releases/tag/v3.0.0). The latest code saved in branch master.
  - [DAML versions older than v3.0.0 releases](https://github.com/vmware/data-annotator-for-machine-learning/releases). The last version v2.1.0 (which still keep our old UI style) before v3.0.0 is saved in branch DAML-v2.1.0.
- As for DAML UI upgrade, our e2e code also updated
  - The latest e2e code saved in branch e2e-test.
  - The old UI e2e code saved in branch DAML-v2.1.0-e2e.

## What is included

DAML project includes three components:

- annotation-app: Angular application for the UI
- annotation-service: Backend services built with Node & Express
- active-learning-service: Django application providing active learning api using modAL library for pool-based uncertainty sampling to rank the unlabelled data

## Quick start

- For the docker version usage to see [run with docker documentation](RUN-WITH-DOCKER.md)
- For development environment and build configuration see [build documentation](BUILD.md)
- For the slack integration configuration see [manifest documentation](docs/manifest.yml)

## Contributing

DAML project team welcomes contributions from the community. For more detailed information, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Bugs and feature requests

Have a bug or a feature request? Please first read the issue guidelines and search for existing and closed issues. If your problem or idea is not addressed yet, please open a new issue.
<br>

## Copyright and license

Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0.
