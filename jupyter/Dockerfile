FROM jupyter/tensorflow-notebook
# RUN jupyter notebook --generate-config
USER root
RUN locale-gen es_ES
RUN dpkg-reconfigure locales
RUN mkdir /images && mkdir /thumbnails && mkdir -p /etc/letsencrypt
RUN chown -R jovyan:users /images /thumbnails /home/jovyan
RUN groupadd -g 101 nginx && usermod -a -G nginx jovyan
USER jovyan:users
RUN pip install elasticsearch oauth2client httplib2 google-auth pillow google_auth_oauthlib
COPY --chown=jovyan:users config/jupyter_notebook_config.json /home/jovyan/.jupyter/
CMD start.sh jupyter lab
