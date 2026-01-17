FROM python:3.10.19-slim-trixie

WORKDIR /app

COPY requirements.txt .

RUN pip3 install -r requirements.txt
RUN pip3 install gunicorn

COPY backend.py ./
COPY templates/ ./templates/
COPY static/ ./static

CMD [ "python3", "-m", "gunicorn", "-w4", "-b", "0.0.0.0:8000", "backend:app" ]
