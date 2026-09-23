FROM ubuntu:latest
LABEL authors="samuel"

ENTRYPOINT ["top", "-b"]