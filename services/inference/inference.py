#! /usr/bin/env python3
import base64
from io import BytesIO
import os
import onnxruntime as ort # for inference
import numpy as np
from PIL import Image
import sys # for using curl and stuff
from supabase import acreate_client, Client
import asyncio
import requests


inference_model = ort.InferenceSession(os.getenv("MODEL_PATH", "./app/model.onnx")) # loading the model for inference
classes = open(os.getenv("CLASSES_PATH", "./app/classes.txt")).read().strip().split(",") # loading the class names for mapping the output of the model to human-readable labels

# defining the WEBHOOK_URL for sending the inference results back to the frontend
WEBHOOK_URL = os.getenv("WEBHOOK_URL", "http://127.0.0.1:8080/webhook/inference_result")

# initialize supabase client for storing the inference results
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


async def main() -> None:
    client: Client = acreate_client(SUPABASE_URL, SUPABASE_KEY)

    def on_insert_payload(payload):
        print("Received new inference request:", payload)
        image_data = payload["new"]["image"]  # assuming the image is sent as a supabase storage bucket public URL
        user_id = payload["new"]["user_id"]  # assuming the user ID is sent in the "user_id" field
        job_id = payload["new"]["id"]  # assuming the job ID is sent in the "id" field

        # Preprocess the image for inference
        # curl the image
        response = os.popen(f"curl -s {image_data}").read()
        image = Image.open(BytesIO(response.encode()))  # open the image using PIL
        image = image.resize((224, 224))  # resize to model's expected input size
        image_array = np.array(image).astype(np.float32) / 255.0  # normalize pixel values
        image_array = np.transpose(image_array, (2, 0, 1))  # change to channel-first format
        image_array = np.expand_dims(image_array, axis=0)  # add batch dimension

        # Run inference
        inputs = {inference_model.get_inputs()[0].name: image_array}
        outputs = inference_model.run(None, inputs)
        predicted_class_index = np.argmax(outputs[0])
        predicted_class_name = classes[predicted_class_index]

        print(f"Predicted class for user {user_id}: {predicted_class_name}")
        requests.post(WEBHOOK_URL, json={"id": job_id, "identified_food_name": predicted_class_name})
        os.remove("*.jpeg")  # clean up the downloaded image if jpeg
        os.remove("*.jpg")  # clean up the downloaded image if jpg
        os.remove("*.png")  # clean up the downloaded image if png
    
    channel = client.channel("food_identification")
    channel.on_postgres_changes("INSERT", schema = "public", table = "food_identifications", callback = on_insert_payload).subscribe()

    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    asyncio.run(main())


