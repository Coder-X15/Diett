FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY inference.py .
COPY .env .
COPY model.onnx .
COPY classes.txt .
CMD ["python", "-u", "inference.py"]