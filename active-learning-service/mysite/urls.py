# Copyright 2019-2021 VMware, Inc.
# SPDX-License-Identifier: Apache-2.0

"""mysite URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/dev/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include
from src import views

urlpatterns = [
    path('api/poc', views.api_poc),
    path('api/al/sr/vector', views.al_srs_vector),
    path('api/al/model/train', views.al_train_model),
    path('api/al/model/query', views.al_query_instance),
    path('api/al/model/teach', views.al_teach_model),
    path('health', views.health, name='health'),
    path('', views.health, name='health'),

]
