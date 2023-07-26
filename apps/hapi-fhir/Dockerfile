FROM ubuntu as build-hapi
ENV PATH="/tmp/apache-maven-3.6.0/bin:${PATH}"

WORKDIR /tmp

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
  apt-get install git -y && \
  apt-get install sed -y && \
  apt-get install wget -y && \
  apt-get install openjdk-8-jdk -y

RUN wget https://archive.apache.org/dist/maven/maven-3/3.6.0/binaries/apache-maven-3.6.0-bin.tar.gz
RUN tar xzf apache-maven-3.6.0-bin.tar.gz
RUN export PATH=/tmp/apache-maven-3.6.0/bin:${PATH}

# Fetch and build forked and fixed jpaserver-base
RUN git clone https://github.com/ThisIsRuvos/hapi-fhir.git
WORKDIR /tmp/hapi-fhir
RUN git checkout email-subscription-improvements
RUN mvn -P NOPARALLEL clean install -DskipTests

FROM tomcat:9-jre8
RUN apt-get update && \
  apt-get install zip -y
RUN mkdir -p /data/hapi_dstu3/lucenefiles && chmod 0775 /data/hapi_dstu3/lucenefiles
ADD deployables.zip /tmp/

RUN cd /tmp && unzip /tmp/deployables.zip && cd -
RUN mv /tmp/deployables/hapi-fhir-jpaserver.war /usr/local/tomcat/webapps/
RUN mv /tmp/deployables/manager /usr/local/tomcat/webapps/manager
COPY tomcat-users.xml /usr/local/tomcat/conf/
COPY run.sh ./
RUN ls -l /usr/local/tomcat/webapps
RUN sed -i '/allow=/c\allow="\\d+\\.\\d+\\.\\d+\\.\\d+" />' /usr/local/tomcat/webapps/manager/META-INF/context.xml
EXPOSE 8080

CMD ["./run.sh"]