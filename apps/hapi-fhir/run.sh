#!/usr/bin/env bash

set -e

unzip webapps/hapi-fhir-jpaserver.war WEB-INF/classes/hapi.properties

SERVER_ADDRESS=${SERVER_ADDRESS:-'http://ersd-hapi-fhir:8080/hapi-fhir-jpaserver/fhir'}
SERVER_NAME=${SERVER_NAME:-'HAPI_DSTU3'}
DATASOURCE_DRIVER=${DATASOURCE_DRIVER:-'com.mysql.cj.jdbc.Driver'}
DATASOURCE_URL=${DATASOURCE_URL:-'jdbc:mysql://db:3306/hapi_dstu3'}
HIBERNATE_DIALECT=${HIBERNATE_DIALECT:-'org.hibernate.dialect.MySQL5Dialect'}
HIBERNATE_INDEX_BASE=${HIBERNATE_INDEX_BASE:-'/data/hapi_dstu3/lucenefiles'}
RESTHOOK_ENABLED=${RESTHOOK_ENABLED:-'true'}
EMAIL_ENABLED=${EMAIL_ENABLED:-'true'}
EMAIL_FROM=${EMAIL_FROM:-'sandboxsupport@aimsplatform.com'}
EMAIL_SUBJECT=${EMAIL_SUBJECT:-'Electronic Case Reporting Update Notification'}
EMAIL_HOST=${EMAIL_HOST:-'aws-smtp-relay'}
EMAIL_PORT=${EMAIL_PORT:-'10025'}

sed -i '/^server_address/c\server_address='$SERVER_ADDRESS WEB-INF/classes/hapi.properties
sed -i '/^server.name/c\server.name='$SERVER_NAME WEB-INF/classes/hapi.properties
sed -i '/^datasource.driver/c\datasource.driver='$DATASOURCE_DRIVER WEB-INF/classes/hapi.properties
sed -i '/^datasource.url/c\datasource.url='$DATASOURCE_URL WEB-INF/classes/hapi.properties
sed -i '/^datasource.username/c\datasource.username='$DATASOURCE_USERNAME WEB-INF/classes/hapi.properties
sed -i '/^datasource.password/c\datasource.password='$DATASOURCE_PASSWORD WEB-INF/classes/hapi.properties
sed -i '/^hibernate.dialect/c\hibernate.dialect='$HIBERNATE_DIALECT WEB-INF/classes/hapi.properties
sed -i '/^hibernate.search.default.indexBase/c\hibernate.search.default.indexBase='$HIBERNATE_INDEX_BASE WEB-INF/classes/hapi.properties
sed -i '/^subscription.resthook/c\subscription.resthook.enabled='$RESTHOOK_ENABLED WEB-INF/classes/hapi.properties
sed -i '/^subscription.email.enabled/c\subscription.email.enabled='$EMAIL_ENABLED WEB-INF/classes/hapi.properties
sed -i '/^email.enabled/c\email.enabled='$EMAIL_ENABLED WEB-INF/classes/hapi.properties
sed -i '/^email.from/c\email.from='$EMAIL_FROM WEB-INF/classes/hapi.properties
sed -i "/^email.defaultSubject/c\email.defaultSubject=$EMAIL_SUBJECT" WEB-INF/classes/hapi.properties
sed -i '/^email.host/c\email.host='$EMAIL_HOST WEB-INF/classes/hapi.properties
sed -i '/^email.port/c\email.port='$EMAIL_PORT WEB-INF/classes/hapi.properties
sed -i '/^email.username/c\email.username='$EMAIL_USERNAME WEB-INF/classes/hapi.properties
sed -i '/^email.password/c\email.password='$EMAIL_PASSWORD WEB-INF/classes/hapi.properties

zip -r webapps/hapi-fhir-jpaserver.war WEB-INF/classes/hapi.properties

rm -rf WEB-INF

# run tomcat
catalina.sh run