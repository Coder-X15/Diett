#! /usr/bin/env python3
from io import BytesIO
import os
import onnxruntime as ort  # for inference
import numpy as np
from PIL import Image
import sys
import asyncio
import requests
import dotenv
import logging

from supabase import acreate_client, Client

dotenv.load_dotenv()

# Setup logging to output to stdout
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    stream=sys.stdout,
)


inference_model = ort.InferenceSession(
    os.getenv("MODEL_PATH", "./model.onnx")
)
classes = open(os.getenv("CLASSES_PATH", "./classes.txt")).read().strip().split(",")

logging.info("Inference model loaded successfully.")

WEBHOOK_URL = os.getenv(
    "WEBHOOK_URL",
    "http://diett-apiserver:8080/webhook/inference_result",
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logging.critical("Missing SUPABASE_URL or SUPABASE_KEY environment variables.")
    sys.exit(1)


async def main() -> None:
    try:
        logging.info("Connecting to Supabase...")
        client: Client = await acreate_client(SUPABASE_URL, SUPABASE_KEY)
        logging.info("Supabase client created successfully.")
    except Exception as e:
        logging.error(f"Failed to create Supabase client: {e}")
        return

    has_logged_payload_structure = False

    def on_broadcast(message):
        nonlocal has_logged_payload_structure
        logging.info("Received broadcast message.")

        payload = message.get("payload") if isinstance(message, dict) and "payload" in message else message

        if not has_logged_payload_structure:
            logging.info(f"Structure of first received payload: {payload}")
            has_logged_payload_structure = True

        record = None
        if isinstance(payload, dict):
            record = payload.get("payload", {}).get("record")
            if record is None:
                record = payload.get("record")

        if not record:
            logging.warning("Could not find record in broadcast payload, skipping.")
            return

        try:
            image_data = record["image_url"]
            user_id = record["user_id"]
            job_id = record["id"]
        except KeyError as e:
            logging.warning(f"Missing expected key {e} in record. Record keys: {list(record.keys())}")
            return

        logging.info(f"Processing job_id: {job_id}, user_id: {user_id}")

        try:
            resp = requests.get(image_data, timeout=30)
            resp.raise_for_status()
            image = Image.open(BytesIO(resp.content)).convert("RGB")
        except Exception as e:
            logging.error(f"Failed to download/open image for job {job_id} from {image_data}: {e}")
            return

        logging.info(f"Image for job {job_id} downloaded and opened successfully.")

        image = image.resize((224, 224))
        image_array = np.array(image).astype(np.float32) / 255.0
        image_array = np.transpose(image_array, (2, 0, 1))
        image_array = np.expand_dims(image_array, axis=0)

        inputs = {inference_model.get_inputs()[0].name: image_array}
        outputs = inference_model.run(None, inputs)
        predicted_class_index = int(np.argmax(outputs[0]))
        predicted_class_name = classes[predicted_class_index]

        logging.info(f"Predicted class for job {job_id}: {predicted_class_name}")
        
        try:
            logging.info(f"Sending webhook to {WEBHOOK_URL} for job {job_id}...")
            res = requests.post(
                WEBHOOK_URL,
                json={"id": job_id, "identified_food_name": predicted_class_name},
                timeout=10,
            )
            res.raise_for_status()
            logging.info(f"Webhook for job {job_id} sent successfully. Response: {res.status_code}")
        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to send webhook for job {job_id}: {e}")

    channel = client.channel(
        "food_identification",
        params={"config": {"private": True}},
    )

    try:
        logging.info("Subscribing to 'food_identification' channel...")
        await channel.on_broadcast("INSERT", on_broadcast).subscribe()
        logging.info("Successfully subscribed to channel. Waiting for messages...")
    except Exception as e:
        logging.error(f"Failed to subscribe to channel: {e}")
        return

    while True:
        await asyncio.sleep(1)


if __name__ == "__main__":
    asyncio.run(main())