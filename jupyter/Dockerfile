FROM jupyter/tensorflow-notebook
RUN mkdir images && mkdir data
# RUN jupyter notebook --generate-config
RUN pip install elasticsearch oauth2client httplib2 google-auth pillow
COPY config/jupyter_notebook_config.json /home/jovyan/.jupyter/
CMD start.sh jupyter lab
