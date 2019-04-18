FROM jupyter/tensorflow-notebook:4cdbc9cdb7d1
RUN pwd
RUN mkdir images && mkdir data
RUN pip install elasticsearch oauth2client httplib2 google-auth
CMD start.sh jupyter lab


