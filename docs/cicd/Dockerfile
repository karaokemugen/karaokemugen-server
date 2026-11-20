FROM axelterizaki/karaokemugen-ci:node-24
WORKDIR /karaokemugen-app

RUN git clone https://gitlab.com/karaokemugen/code/karaokemugen-app.git .
COPY ./prepare.sh .
RUN chmod 775 *.sh
RUN ./prepare.sh

COPY ./config.CICD.yml ./app/config.yml

COPY ./validate.sh .
RUN chmod 775 *.sh

CMD ./validate.sh