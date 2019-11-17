FROM jupyter/tensorflow-notebook
RUN mkdir images && mkdir data && mkdir thumbnails
# RUN jupyter notebook --generate-config
USER root
RUN locale-gen es_ES
RUN dpkg-reconfigure locales
USER jovyan
RUN pip install elasticsearch oauth2client httplib2 google-auth pillow google_auth_oauthlib
COPY config/jupyter_notebook_config.json /home/jovyan/.jupyter/
CMD start.sh jupyter lab
