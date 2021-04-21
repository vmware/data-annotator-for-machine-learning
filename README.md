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

## What is included

DAML project includes three components: 
- annotation-app: Angular application for the UI
- annotation-service: Backend services built with Node & Express
- active-learning-service: Django application providing active learning api using modAL library for pool-based uncertainty sampling to rank the unlabelled data


## Quick start

For development environment and build configuration see [build documentation](BUILD.md)

## Contributing

DAML project team welcomes contributions from the community. For more detailed information, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Bugs and feature requests

Have a bug or a feature request? Please first read the issue guidelines and search for existing and closed issues. If your problem or idea is not addressed yet, please open a new issue.
<br>

## Copyright and license

Copyright 2019-2021 VMware, Inc.
SPDX-License-Identifier: Apache-2.0.
